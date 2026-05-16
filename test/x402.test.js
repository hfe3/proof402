import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { setTimeout as sleep } from "node:timers/promises";

test("x402 mock mode returns 402 for unpaid proof endpoint", { timeout: 15000 }, async () => {
  const port = await getFreePort();
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PROOF402_PROFILE: "testnet",
      PORT: String(port),
      HOST: "127.0.0.1",
      PUBLIC_BASE_URL: `http://127.0.0.1:${port}`,
      X402_ENABLED: "true",
      X402_MOCK: "true",
      X402_NETWORK: "eip155:84532",
      PAY_TO: "0x1111111111111111111111111111111111111111",
      STORE_DRIVER: "memory",
      STORE_FILE: ":memory:",
      RECEIPT_KEY_ID: "mock-x402",
      RECEIPT_SECRET: "mock-x402-receipt-secret-with-enough-length",
      LOG_LEVEL: "silent",
      REQUEST_LOG_ENABLED: "false"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForHealth(`http://127.0.0.1:${port}/health`, child, () => stderr);
    const response = await fetch(`http://127.0.0.1:${port}/api/proof/notarize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
        label: "x402 mock hash",
        metadata: { test: "x402" },
        idempotencyKey: "x402-mock-001"
      })
    });
    const body = await response.json();

    assert.equal(response.status, 402);
    assert.equal(body.error.code, "payment_required");
    assert.equal(body.accepts[0].scheme, "exact");
  } finally {
    child.kill();
  }
});

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForHealth(url, child, stderr) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`server exited early with ${child.exitCode}: ${stderr()}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until the server is ready.
    }
    await sleep(150);
  }
  throw new Error(`server did not become ready: ${stderr()}`);
}
