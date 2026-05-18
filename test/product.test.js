import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { request, requestJson } from "./helpers.js";
import { resetStoreForTests } from "../src/store.js";

const adminHeaders = {
  "x-proof402-admin-key": "test-proof402-admin-key-with-enough-length"
};

const proofBody = {
  contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  label: "product proof search",
  metadata: {
    product: "dashboard"
  },
  idempotencyKey: "product-proof-search-001"
};

test("admin accounts create API keys and associate proofs", async () => {
  await resetStoreForTests();

  const denied = await requestJson("/api/accounts", {
    method: "POST",
    body: JSON.stringify({ name: "Denied" })
  });
  assert.equal(denied.response.status, 401);
  assert.equal(denied.body.error.code, "admin_unauthorized");

  const account = await requestJson("/api/accounts", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: "Research agents", ownerLabel: "operator" })
  });
  assert.equal(account.response.status, 201);
  assert.equal(account.body.account.name, "Research agents");

  const key = await requestJson(`/api/accounts/${account.body.account.id}/api-keys`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: "Research bot key" })
  });
  assert.equal(key.response.status, 201);
  assert.match(key.body.rawKey, /^p402_/);
  assert.equal(key.body.apiKey.keyHash, undefined);

  const proof = await requestJson("/api/proof/notarize", {
    method: "POST",
    headers: {
      "x-proof402-key": key.body.rawKey
    },
    body: JSON.stringify(proofBody)
  });
  assert.equal(proof.response.status, 200);
  assert.equal(proof.body.account.id, account.body.account.id);
  assert.equal(proof.body.proof.accountId, account.body.account.id);

  const search = await request(
    `/api/proofs/search?accountId=${account.body.account.id}&apiKeyId=${key.body.apiKey.id}&idempotencyKey=${proofBody.idempotencyKey}&q=product`
  );
  assert.equal(search.response.status, 200);
  assert.equal(search.body.proofs.length, 1);
  assert.equal(search.body.query.apiKeyId, key.body.apiKey.id);
  assert.equal(search.body.query.idempotencyKey, proofBody.idempotencyKey);
  assert.equal(search.body.proofs[0].accountId, account.body.account.id);

  const snapshot = await request(`/api/accounts/${account.body.account.id}`, {
    headers: adminHeaders
  });
  assert.equal(snapshot.response.status, 200);
  assert.equal(snapshot.body.apiKeys[0].lastUsedAt !== null, true);
  assert.equal(snapshot.body.apiKeys[0].keyHash, undefined);

  const revoked = await requestJson(`/api/api-keys/${key.body.apiKey.id}/revoke`, {
    method: "POST",
    headers: adminHeaders,
    body: "{}"
  });
  assert.equal(revoked.response.status, 200);
  assert.equal(revoked.body.apiKey.status, "revoked");

  const rejected = await requestJson("/api/proof/notarize", {
    method: "POST",
    headers: {
      "x-proof402-key": key.body.rawKey
    },
    body: JSON.stringify({ ...proofBody, idempotencyKey: "product-proof-search-002" })
  });
  assert.equal(rejected.response.status, 401);
  assert.equal(rejected.body.error.code, "api_key_invalid");
});

test("webhook receipts sign and record delivery attempts", async () => {
  await resetStoreForTests();
  const received = [];
  const receiver = http.createServer(async (req, res) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    await once(req, "end");
    received.push({ headers: req.headers, body: JSON.parse(body) });
    res.writeHead(204).end();
  });
  receiver.listen(0, "127.0.0.1");
  await once(receiver, "listening");

  try {
    const { port } = receiver.address();
    const account = await requestJson("/api/accounts", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ name: "Webhook account" })
    });
    const webhook = await requestJson(`/api/accounts/${account.body.account.id}/webhooks`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        name: "Local receipt sink",
        url: `http://127.0.0.1:${port}/webhook`,
        events: ["proof.created", "webhook.test"]
      })
    });

    assert.equal(webhook.response.status, 201);
    assert.match(webhook.body.signingSecret, /^whsec_/);
    assert.equal(webhook.body.webhook.url, `http://127.0.0.1:${port}/webhook`);

    const delivery = await requestJson(`/api/webhooks/${webhook.body.webhook.id}/test`, {
      method: "POST",
      headers: adminHeaders,
      body: "{}"
    });
    assert.equal(delivery.response.status, 200);
    assert.equal(delivery.body.delivery.status, "delivered");
    assert.equal(delivery.body.delivery.statusCode, 204);
    assert.equal(received.length, 1);
    assert.equal(received[0].headers["x-proof402-event"], "webhook.test");
    assert.match(received[0].headers["x-proof402-signature"], /^hmac-sha256:/);
    assert.equal(received[0].body.event, "webhook.test");

    const key = await requestJson(`/api/accounts/${account.body.account.id}/api-keys`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({ name: "Webhook proof key" })
    });
    const proof = await requestJson("/api/proof/notarize", {
      method: "POST",
      headers: {
        "x-proof402-key": key.body.rawKey
      },
      body: JSON.stringify({ ...proofBody, idempotencyKey: "webhook-proof-created-001" })
    });
    assert.equal(proof.response.status, 200);
    assert.equal(proof.body.webhooks.attempted, 1);
    assert.equal(received.length, 2);
    assert.equal(received[1].headers["x-proof402-event"], "proof.created");
    assert.equal(received[1].body.proof.id, proof.body.proof.id);
  } finally {
    await new Promise((resolve, reject) => receiver.close((error) => (error ? reject(error) : resolve())));
  }
});
