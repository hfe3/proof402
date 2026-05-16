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

export async function closeStore() {
  if (store && initialized) {
    await store.close();
  }
  initialized = false;
  store = null;
}
