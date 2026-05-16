import test from "node:test";
import assert from "node:assert/strict";
import { notarizeProof } from "../src/proofService.js";
import { getProof, getProofByIdempotencyKey, listRecentProofs, resetStoreForTests, storeStats } from "../src/store.js";
import { verifyProof } from "../src/proofCrypto.js";

test("store saves proofs, idempotency index, and stats", async () => {
  await resetStoreForTests();
  const result = await notarizeProof({
    contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
    label: "store test hash",
    metadata: { test: "store" },
    idempotencyKey: "store-test-001"
  });

  const byId = await getProof(result.proof.id);
  const byKey = await getProofByIdempotencyKey("store-test-001");
  const recent = await listRecentProofs(10);
  const stats = await storeStats();

  assert.equal(byId.id, result.proof.id);
  assert.equal(byKey.id, result.proof.id);
  assert.equal(recent.length, 1);
  assert.equal(stats.driver, "memory");
  assert.equal(stats.proofs, 1);
  assert.equal(verifyProof(byId), true);
});
