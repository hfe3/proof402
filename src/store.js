import { config } from "./config.js";
import { createJsonStore } from "./stores/jsonStore.js";
import { createPostgresStore } from "./stores/postgresStore.js";

let store = null;
let initialized = false;

function createConfiguredStore() {
  if (config.storeDriver === "postgres") {
    return createPostgresStore(config);
  }
  return createJsonStore(config);
}

export async function initStore() {
  if (!store) {
    store = createConfiguredStore();
  }
  if (initialized) return store;
  await store.init();
  initialized = true;
  return store;
}

async function activeStore() {
  return initStore();
}

export async function createProof(proof) {
  return (await activeStore()).createProof(proof);
}

export async function searchProofs(filters = {}) {
  return (await activeStore()).searchProofs(filters);
}

export async function getProof(id) {
  return (await activeStore()).getProof(id);
}

export async function getProofByIdempotencyKey(key) {
  return (await activeStore()).getProofByIdempotencyKey(key);
}

export async function listRecentProofs(limit) {
  return (await activeStore()).listRecentProofs(limit);
}

export async function resetStoreForTests() {
  return (await activeStore()).resetForTests();
}

export async function storeStats() {
  return (await activeStore()).stats();
}

export async function createAccount(account) {
  return (await activeStore()).createAccount(account);
}

export async function listAccounts() {
  return (await activeStore()).listAccounts();
}

export async function getAccount(id) {
  return (await activeStore()).getAccount(id);
}

export async function createApiKey(apiKey) {
  return (await activeStore()).createApiKey(apiKey);
}

export async function listApiKeys(accountId) {
  return (await activeStore()).listApiKeys(accountId);
}

export async function getApiKey(id) {
  return (await activeStore()).getApiKey(id);
}

export async function getApiKeyByHash(keyHash) {
  return (await activeStore()).getApiKeyByHash(keyHash);
}

export async function touchApiKey(id, usedAt) {
  return (await activeStore()).touchApiKey(id, usedAt);
}

export async function revokeApiKey(id, revokedAt) {
  return (await activeStore()).revokeApiKey(id, revokedAt);
}

export async function createWebhook(webhook) {
  return (await activeStore()).createWebhook(webhook);
}

export async function listWebhooks(accountId) {
  return (await activeStore()).listWebhooks(accountId);
}

export async function getWebhook(id) {
  return (await activeStore()).getWebhook(id);
}

export async function recordWebhookDelivery(delivery) {
  return (await activeStore()).recordWebhookDelivery(delivery);
}

export async function updateWebhookDelivery(id, patch) {
  return (await activeStore()).updateWebhookDelivery(id, patch);
}

export async function listWebhookDeliveries(filters = {}) {
  return (await activeStore()).listWebhookDeliveries(filters);
}

export async function closeStore() {
  if (store && initialized) {
    await store.close();
  }
  initialized = false;
  store = null;
}
