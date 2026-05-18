import crypto from "node:crypto";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
import { canonicalJson, createId, sha256Hex, sha256Json, signProofPayload } from "./proofCrypto.js";
import { proofLinks, publicProof } from "./proofService.js";
import {
  createAccount,
  createApiKey,
  createWebhook,
  getAccount,
  getApiKey,
  getApiKeyByHash,
  getWebhook,
  listAccounts,
  listApiKeys,
  listRecentProofs,
  listWebhookDeliveries,
  listWebhooks,
  recordWebhookDelivery,
  revokeApiKey,
  searchProofs,
  storeStats,
  touchApiKey,
  updateWebhookDelivery
} from "./store.js";

const API_KEY_HEADER = "x-proof402-key";
const ADMIN_KEY_HEADER = "x-proof402-admin-key";
const DEFAULT_WEBHOOK_EVENTS = ["proof.created"];

function nowIso() {
  return new Date().toISOString();
}

function safeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function assertName(value, field = "name") {
  const name = safeString(value);
  if (!name || name.length > 120) {
    throw new ApiError(400, "invalid_input", `${field} must be 1-120 characters.`, { [field]: "invalid" });
  }
  return name;
}

function hashApiKey(rawKey) {
  return sha256Hex(`proof402.api-key.v1:${rawKey}`);
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function assertAdmin(req) {
  if (!config.adminApiKey) {
    throw new ApiError(503, "admin_disabled", "Admin API is disabled until PROOF402_ADMIN_KEY is configured.", {});
  }

  const provided = req.get(ADMIN_KEY_HEADER) || "";
  if (!timingSafeEqualString(provided, config.adminApiKey)) {
    throw new ApiError(401, "admin_unauthorized", "Valid X-Proof402-Admin-Key header is required.", {});
  }
}

export function requireAdmin(req, _res, next) {
  try {
    assertAdmin(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function attachApiKeyContext(req, _res, next) {
  try {
    const rawKey = safeString(req.get(API_KEY_HEADER));
    if (!rawKey) return next();

    const apiKey = await getApiKeyByHash(hashApiKey(rawKey));
    if (!apiKey || apiKey.revokedAt || apiKey.status === "revoked") {
      throw new ApiError(401, "api_key_invalid", "X-Proof402-Key is invalid or revoked.", {});
    }

    const account = await getAccount(apiKey.accountId);
    if (!account || account.status !== "active") {
      throw new ApiError(401, "account_inactive", "API key account is not active.", {});
    }

    const usedAt = nowIso();
    await touchApiKey(apiKey.id, usedAt);
    req.proof402Auth = {
      accountId: account.id,
      apiKeyId: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes || [],
      account: publicAccount(account)
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function createAccountFromInput(input = {}) {
  const createdAt = nowIso();
  const account = {
    id: createId("acct"),
    name: assertName(input.name || "Proof402 account"),
    ownerLabel: safeString(input.ownerLabel || input.owner || "operator").slice(0, 120),
    status: "active",
    createdAt,
    updatedAt: createdAt
  };
  return createAccount(account);
}

export async function createApiKeyForAccount(accountId, input = {}) {
  const account = await getAccount(accountId);
  if (!account) throw new ApiError(404, "not_found", "Account not found.", { accountId });
  if (account.status !== "active") {
    throw new ApiError(409, "account_inactive", "Cannot create API keys for an inactive account.", { accountId });
  }

  const rawKey = `p402_${crypto.randomBytes(24).toString("base64url")}`;
  const createdAt = nowIso();
  const apiKey = {
    id: createId("key"),
    accountId,
    name: assertName(input.name || "Default API key"),
    keyHash: hashApiKey(rawKey),
    keyPrefix: rawKey.slice(0, 12),
    scopes: Array.isArray(input.scopes) && input.scopes.length ? input.scopes.slice(0, 20) : ["proof:create"],
    status: "active",
    createdAt,
    lastUsedAt: null,
    revokedAt: null
  };

  await createApiKey(apiKey);
  return { apiKey, rawKey };
}

export async function createWebhookForAccount(accountId, input = {}) {
  const account = await getAccount(accountId);
  if (!account) throw new ApiError(404, "not_found", "Account not found.", { accountId });

  const url = validateWebhookUrl(input.url);
  const createdAt = nowIso();
  const webhook = {
    id: createId("wh"),
    accountId,
    name: assertName(input.name || "Proof receipt webhook"),
    url,
    events: normalizeEvents(input.events),
    status: "active",
    createdAt,
    updatedAt: createdAt
  };

  await createWebhook(webhook);
  return {
    webhook,
    signingSecret: webhookSigningSecret(webhook.id)
  };
}

export async function dashboardSummary() {
  const stats = await storeStats();
  const recent = await listRecentProofs(10);
  return {
    ok: true,
    generatedAt: nowIso(),
    service: config.serviceName,
    version: config.version,
    product: {
      dashboard: true,
      proofSearch: true,
      accounts: true,
      apiKeys: true,
      webhookReceipts: true,
      postgresReady: true
    },
    counts: {
      proofs: stats.proofCount ?? stats.proofs ?? 0,
      accounts: stats.accounts ?? 0,
      apiKeys: stats.apiKeys ?? 0,
      webhooks: stats.webhooks ?? 0,
      webhookDeliveries: stats.webhookDeliveries ?? 0
    },
    storage: stats,
    recentProofs: recent.map((proof) => ({
      proof: publicProof(proof, { includeSignature: false, direct: false }),
      accountId: proof.accountId || null,
      links: proofLinks(proof.id)
    })),
    links: {
      dashboard: "/dashboard",
      search: "/api/proofs/search",
      accounts: "/api/accounts",
      openapi: "/openapi.json"
    }
  };
}

export async function searchPublicProofs(filters = {}) {
  const proofs = await searchProofs(filters);
  return {
    ok: true,
    generatedAt: nowIso(),
    query: {
      q: filters.q || null,
      contentHash: filters.contentHash || null,
      metadataHash: filters.metadataHash || null,
      accountId: filters.accountId || null,
      apiKeyId: filters.apiKeyId || null,
      idempotencyKey: filters.idempotencyKey || null,
      limit: Number.parseInt(filters.limit, 10) || 20
    },
    proofs: proofs.map((proof) => ({
      proof: publicProof(proof, { includeSignature: false, direct: false }),
      accountId: proof.accountId || null,
      links: proofLinks(proof.id)
    }))
  };
}

export async function listPublicAccounts() {
  return (await listAccounts()).map(publicAccount);
}

export async function accountSnapshot(accountId) {
  const account = await getAccount(accountId);
  if (!account) throw new ApiError(404, "not_found", "Account not found.", { accountId });
  return {
    account: publicAccount(account),
    apiKeys: (await listApiKeys(accountId)).map(publicApiKey),
    webhooks: (await listWebhooks(accountId)).map(publicWebhook),
    deliveries: (await listWebhookDeliveries({ accountId, limit: 25 })).map(publicWebhookDelivery)
  };
}

export async function revokeApiKeyById(id) {
  const apiKey = await getApiKey(id);
  if (!apiKey) throw new ApiError(404, "not_found", "API key not found.", { id });
  return publicApiKey(await revokeApiKey(id, nowIso()));
}

export async function testWebhookById(id, fetchImpl = fetch) {
  const webhook = await getWebhook(id);
  if (!webhook) throw new ApiError(404, "not_found", "Webhook not found.", { id });
  const payload = {
    event: "webhook.test",
    generatedAt: nowIso(),
    accountId: webhook.accountId,
    message: "Proof402 webhook test"
  };
  return deliverWebhook(webhook, "webhook.test", payload, fetchImpl);
}

export async function dispatchProofCreatedWebhooks(proof, fetchImpl = fetch) {
  if (!proof?.accountId) return [];
  const webhooks = (await listWebhooks(proof.accountId)).filter(
    (webhook) => webhook.status === "active" && webhook.events.includes("proof.created")
  );
  return Promise.all(
    webhooks.map((webhook) =>
      deliverWebhook(
        webhook,
        "proof.created",
        {
          event: "proof.created",
          generatedAt: nowIso(),
          accountId: proof.accountId,
          proof: publicProof(proof, { includeSignature: true, direct: true }),
          links: proofLinks(proof.id, config.publicBaseUrl)
        },
        fetchImpl
      )
    )
  );
}

export async function deliverWebhook(webhook, eventType, payload, fetchImpl = fetch) {
  const createdAt = nowIso();
  const delivery = await recordWebhookDelivery({
    id: createId("deliv"),
    webhookId: webhook.id,
    accountId: webhook.accountId,
    eventType,
    status: "pending",
    attempt: 1,
    payloadHash: sha256Json(payload),
    createdAt,
    updatedAt: createdAt
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signWebhook(webhook.id, timestamp, payload);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.webhookTimeoutMs);

  try {
    const response = await fetchImpl(webhook.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "user-agent": `Proof402/${config.version}`,
        "x-proof402-event": eventType,
        "x-proof402-delivery": delivery.id,
        "x-proof402-timestamp": timestamp,
        "x-proof402-signature": signature
      },
      body: JSON.stringify(payload)
    });
    const delivered = response.status >= 200 && response.status < 300;
    return updateWebhookDelivery(delivery.id, {
      status: delivered ? "delivered" : "failed",
      statusCode: response.status,
      deliveredAt: delivered ? nowIso() : null,
      error: delivered ? null : `HTTP ${response.status}`
    });
  } catch (error) {
    return updateWebhookDelivery(delivery.id, {
      status: "failed",
      error: error.name === "AbortError" ? "timeout" : error.message
    });
  } finally {
    clearTimeout(timer);
  }
}

export function publicAccount(account) {
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    ownerLabel: account.ownerLabel || null,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

export function publicApiKey(apiKey) {
  if (!apiKey) return null;
  return {
    id: apiKey.id,
    accountId: apiKey.accountId,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes || [],
    status: apiKey.status,
    createdAt: apiKey.createdAt,
    lastUsedAt: apiKey.lastUsedAt || null,
    revokedAt: apiKey.revokedAt || null
  };
}

export function publicWebhook(webhook) {
  if (!webhook) return null;
  return {
    id: webhook.id,
    accountId: webhook.accountId,
    name: webhook.name,
    url: webhook.url,
    events: webhook.events,
    status: webhook.status,
    createdAt: webhook.createdAt,
    updatedAt: webhook.updatedAt
  };
}

export function publicWebhookDelivery(delivery) {
  if (!delivery) return null;
  return {
    id: delivery.id,
    accountId: delivery.accountId,
    webhookId: delivery.webhookId,
    eventType: delivery.eventType,
    status: delivery.status,
    attempt: delivery.attempt,
    statusCode: delivery.statusCode || null,
    payloadHash: delivery.payloadHash,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt || null,
    deliveredAt: delivery.deliveredAt || null,
    error: delivery.error || null
  };
}

function validateWebhookUrl(value) {
  const raw = safeString(value);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ApiError(400, "invalid_input", "webhook url must be a valid absolute URL.", { url: "invalid" });
  }

  const hostname = parsed.hostname.toLowerCase();
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  if (parsed.protocol !== "https:" && !(config.profile !== "mainnet" && parsed.protocol === "http:" && local)) {
    throw new ApiError(400, "invalid_input", "webhook url must use https.", { url: "https_required" });
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  return parsed.toString();
}

function normalizeEvents(events) {
  if (events === undefined) return DEFAULT_WEBHOOK_EVENTS;
  if (!Array.isArray(events)) {
    throw new ApiError(400, "invalid_input", "events must be an array.", { events: "invalid" });
  }
  const allowed = new Set(["proof.created", "webhook.test"]);
  const normalized = events.map((event) => safeString(event)).filter((event) => allowed.has(event));
  return normalized.length ? Array.from(new Set(normalized)) : DEFAULT_WEBHOOK_EVENTS;
}

function webhookSigningSecret(webhookId) {
  return `whsec_${crypto
    .createHmac("sha256", config.receiptSecret)
    .update(`proof402.webhook.secret.v1:${webhookId}`)
    .digest("base64url")}`;
}

function signWebhook(webhookId, timestamp, payload) {
  const secret = webhookSigningSecret(webhookId);
  return signProofPayload(
    {
      version: "proof402.webhook.v1",
      timestamp,
      payload: canonicalJson(payload)
    },
    secret
  );
}
