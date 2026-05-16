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
  const useMemory = config.storeDriver === "memory" || config.storeFile === ":memory:";
  let lastCleanupAt = null;

  function resolvedStoreFile() {
    return path.resolve(process.cwd(), config.storeFile);
  }

  function rebuildIndexes() {
    idempotencyIndex.clear();
    for (const proof of proofs.values()) {
      if (proof.idempotencyKey) {
        idempotencyIndex.set(proof.idempotencyKey, proof.id);
      }
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
    rebuildIndexes();
  }

  function persistStore() {
    if (useMemory) return;
    const file = resolvedStoreFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });

    const payload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      proofs: Array.from(proofs.values())
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

    async resetForTests() {
      proofs.clear();
      idempotencyIndex.clear();
      lastCleanupAt = null;
      persistStore();
    },

    async stats() {
      return {
        driver: useMemory ? "memory" : "json",
        durable: !useMemory,
        storeFile: useMemory ? ":memory:" : resolvedStoreFile(),
        proofs: proofs.size,
        lastCleanupAt,
        retention: {
          proofRetentionMs: config.proofRetentionMs
        }
      };
    },

    async close() {}
  };
}
