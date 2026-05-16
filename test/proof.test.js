import test from "node:test";
import assert from "node:assert/strict";
import { request, requestJson } from "./helpers.js";
import { resetStoreForTests } from "../src/store.js";

const sample = {
  contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  label: "agent result hash",
  metadata: {
    agent: "research-bot",
    taskId: "task_123"
  },
  idempotencyKey: "proof-test-001"
};

test("notarize proof creates a verifiable public proof", async () => {
  await resetStoreForTests();
  const created = await requestJson("/api/proof/notarize", {
    method: "POST",
    body: JSON.stringify(sample)
  });

  assert.equal(created.response.status, 200);
  assert.equal(created.body.ok, true);
  assert.equal(created.body.mode, "demo");
  assert.equal(created.body.idempotentReplay, false);
  assert.match(created.body.proof.id, /^proof_/);
  assert.equal(created.body.proof.verified, true);
  assert.equal(created.body.proof.contentHash, sample.contentHash);
  assert.match(created.body.proof.metadataHash, /^sha256:/);
  assert.match(created.body.proof.signature, /^hmac-sha256:/);
  assert.equal(created.body.links.verify, `/api/verify/proofs/${created.body.proof.id}`);

  const proof = await request(created.body.links.proof);
  assert.equal(proof.response.status, 200);

  const verify = await request(created.body.links.verify);
  assert.equal(verify.response.status, 200);
  assert.equal(verify.body.verified, true);
  assert.equal(verify.body.proof.id, created.body.proof.id);
});

test("idempotency key replays the same proof", async () => {
  await resetStoreForTests();
  const first = await requestJson("/api/proof/notarize", {
    method: "POST",
    body: JSON.stringify(sample)
  });
  const second = await requestJson("/api/proof/notarize", {
    method: "POST",
    body: JSON.stringify({
      ...sample,
      label: "changed label ignored by idempotency"
    })
  });

  assert.equal(first.response.status, 200);
  assert.equal(second.response.status, 200);
  assert.equal(second.body.idempotentReplay, true);
  assert.equal(second.body.proof.id, first.body.proof.id);
  assert.equal(second.body.proof.label, first.body.proof.label);
});

test("invalid input returns structured error", async () => {
  await resetStoreForTests();
  const invalid = await requestJson("/api/proof/notarize", {
    method: "POST",
    body: JSON.stringify({
      contentHash: "not-a-hash",
      label: "",
      metadata: [],
      idempotencyKey: ""
    })
  });

  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, "invalid_input");
  assert.ok(invalid.body.error.details.contentHash);
});

test("recent proofs feed redacts broad-feed signatures", async () => {
  await resetStoreForTests();
  const created = await requestJson("/api/proof/notarize", {
    method: "POST",
    body: JSON.stringify({
      ...sample,
      idempotencyKey: "proof-test-recent"
    })
  });
  assert.equal(created.response.status, 200);

  const recent = await request("/api/proofs/recent");
  assert.equal(recent.response.status, 200);
  assert.equal(recent.body.proofs.length, 1);
  assert.equal(recent.body.proofs[0].proof.id, created.body.proof.id);
  assert.ok(recent.body.proofs[0].proof.signature.endsWith("..."));
});
