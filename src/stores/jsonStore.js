import fs from "node:fs";
import path from "node:path";

function timestampMs(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampLimit(limit, fallback = 20, max = 100) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, max));
}

export function createJsonStore(config) {
  const proofs = new Map();
  const idempotencyIndex = new Map();
  const accounts = new Map();
  const apiKeys = new Map();
  const apiKeyHashIndex = new Map();
  const webhooks = new Map();
  const webhookDeliveries = new Map();
  const useMemory = config.storeDriver === "memory" || config.storeFile === ":memory:";
  let lastCleanupAt = null;

  function resolvedStoreFile() {
    return path.resolve(process.cwd(), config.storeFile);
  }

  function rebuildIndexes() {
    idempotencyIndex.clear();
    apiKeyHashIndex.clear();
    for (const proof of proofs.values()) {
      if (proof.idempotencyKey) {
        idempotencyIndex.set(proof.idempotencyKey, proof.id);
      }
    }
    for (const apiKey of apiKeys.values()) {
      apiKeyHashIndex.set(apiKey.keyHash, apiKey.id);
    }
  }

  function loadStore() {
    if (useMemory) return;
    const file = resolvedStoreFile();
    if (!fs.existsSync(file)) return;

    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const proof of parsed.proofs || []) {
      proofs.set(proof.id, proof);
    }
    for (const account of parsed.accounts || []) {
      accounts.set(account.id, account);
    }
    for (const apiKey of parsed.apiKeys || []) {
      apiKeys.set(apiKey.id, apiKey);
    }
    for (const webhook of parsed.webhooks || []) {
      webhooks.set(webhook.id, webhook);
    }
    for (const delivery of parsed.webhookDeliveries || []) {
      webhookDeliveries.set(delivery.id, delivery);
    }
    rebuildIndexes();
  }

  function persistStore() {
    if (useMemory) return;
    const file = resolvedStoreFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const payload = {
      version: 2,
      updatedAt: new Date().toISOString(),
      proofs: Array.from(proofs.values()),
      accounts: Array.from(accounts.values()),
      apiKeys: Array.from(apiKeys.values()),
      webhooks: Array.from(webhooks.values()),
      webhookDeliveries: Array.from(webhookDeliveries.values())
    };
    const tempFile = `${file}.tmp`;
    fs.writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`);
    fs.renameSync(tempFile, file);
  }

  async function pruneExpired(now = Date.now(), options = {}) {
    const persist = options.persist ?? true;
    if (config.proofRetentionMs <= 0) return { removedProofs: 0 };

    let removedProofs = 0;
    for (const proof of proofs.values()) {
      const createdAt = timestampMs(proof.createdAt || proof.timestamp);
      if (createdAt > 0 && now - createdAt > config.proofRetentionMs) {
        proofs.delete(proof.id);
        removedProofs += 1;
      }
    }

    if (removedProofs > 0) {
      rebuildIndexes();
      lastCleanupAt = new Date(now).toISOString();
      if (persist) persistStore();
    }

    return { removedProofs };
  }

  return {
    async init() {
      loadStore();
      await pruneExpired(Date.now(), { persist: true });
    },

    async createProof(proof) {
      await pruneExpired(Date.now(), { persist: false });
      proofs.set(proof.id, proof);
      if (proof.idempotencyKey) {
        idempotencyIndex.set(proof.idempotencyKey, proof.id);
      }
      persistStore();
      return proof;
    },

    async getProof(id) {
      return proofs.get(id);
    },

    async getProofByIdempotencyKey(key) {
      const id = idempotencyIndex.get(key);
      return id ? proofs.get(id) : undefined;
    },

    async listRecentProofs(limit = 20) {
      await pruneExpired(Date.now(), { persist: false });
      return Array.from(proofs.values())
        .sort((a, b) => timestampMs(b.createdAt || b.timestamp) - timestampMs(a.createdAt || a.timestamp))
        .slice(0, clampLimit(limit));
    },

    async searchProofs(filters = {}) {
      await pruneExpired(Date.now(), { persist: false });
      const q = String(filters.q || "").trim().toLowerCase();
      const limit = clampLimit(filters.limit, 20, 100);
      return Array.from(proofs.values())
        .filter((proof) => {
          if (filters.contentHash && proof.contentHash !== String(filters.contentHash).toLowerCase()) return false;
          if (filters.metadataHash && proof.metadataHash !== String(filters.metadataHash).toLowerCase()) return false;
          if (filters.accountId && proof.accountId !== filters.accountId) return false;
          if (filters.apiKeyId && proof.apiKeyId !== filters.apiKeyId) return false;
          if (filters.idempotencyKey && proof.idempotencyKey !== filters.idempotencyKey) return false;
          if (!q) return true;
          return [proof.id, proof.contentHash, proof.label, proof.metadataHash, proof.idempotencyKey, proof.accountId]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));
        })
        .sort((a, b) => timestampMs(b.createdAt || b.timestamp) - timestampMs(a.createdAt || a.timestamp))
        .slice(0, limit);
    },

    async resetForTests() {
      proofs.clear();
      idempotencyIndex.clear();
      accounts.clear();
      apiKeys.clear();
      apiKeyHashIndex.clear();
      webhooks.clear();
      webhookDeliveries.clear();
      lastCleanupAt = null;
      persistStore();
    },

    async stats() {
      return {
        driver: useMemory ? "memory" : "json",
        durable: !useMemory,
        storeFile: useMemory ? ":memory:" : resolvedStoreFile(),
        proofs: proofs.size,
        proofCount: proofs.size,
        accounts: accounts.size,
        apiKeys: apiKeys.size,
        webhooks: webhooks.size,
        webhookDeliveries: webhookDeliveries.size,
        lastCleanupAt,
        retention: {
          proofRetentionMs: config.proofRetentionMs
        }
      };
    },

    async createAccount(account) {
      accounts.set(account.id, account);
      persistStore();
      return account;
    },

    async listAccounts() {
      return Array.from(accounts.values()).sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    },

    async getAccount(id) {
      return accounts.get(id);
    },

    async createApiKey(apiKey) {
      apiKeys.set(apiKey.id, apiKey);
      apiKeyHashIndex.set(apiKey.keyHash, apiKey.id);
      persistStore();
      return apiKey;
    },

    async listApiKeys(accountId) {
      return Array.from(apiKeys.values())
        .filter((apiKey) => !accountId || apiKey.accountId === accountId)
        .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    },

    async getApiKey(id) {
      return apiKeys.get(id);
    },

    async getApiKeyByHash(keyHash) {
      const id = apiKeyHashIndex.get(keyHash);
      return id ? apiKeys.get(id) : undefined;
    },

    async touchApiKey(id, usedAt) {
      const apiKey = apiKeys.get(id);
      if (!apiKey) return undefined;
      const updated = { ...apiKey, lastUsedAt: usedAt };
      apiKeys.set(id, updated);
      persistStore();
      return updated;
    },

    async revokeApiKey(id, revokedAt) {
      const apiKey = apiKeys.get(id);
      if (!apiKey) return undefined;
      const updated = { ...apiKey, revokedAt, status: "revoked" };
      apiKeys.set(id, updated);
      persistStore();
      return updated;
    },

    async createWebhook(webhook) {
      webhooks.set(webhook.id, webhook);
      persistStore();
      return webhook;
    },

    async listWebhooks(accountId) {
      return Array.from(webhooks.values())
        .filter((webhook) => !accountId || webhook.accountId === accountId)
        .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
    },

    async getWebhook(id) {
      return webhooks.get(id);
    },

    async recordWebhookDelivery(delivery) {
      webhookDeliveries.set(delivery.id, delivery);
      persistStore();
      return delivery;
    },

    async updateWebhookDelivery(id, patch) {
      const delivery = webhookDeliveries.get(id);
      if (!delivery) return undefined;
      const updated = { ...delivery, ...patch, updatedAt: new Date().toISOString() };
      webhookDeliveries.set(id, updated);
      persistStore();
      return updated;
    },

    async listWebhookDeliveries(filters = {}) {
      const limit = clampLimit(filters.limit, 20, 100);
      return Array.from(webhookDeliveries.values())
        .filter((delivery) => {
          if (filters.accountId && delivery.accountId !== filters.accountId) return false;
          if (filters.webhookId && delivery.webhookId !== filters.webhookId) return false;
          return true;
        })
        .sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt))
        .slice(0, limit);
    },

    async close() {}
  };
}
