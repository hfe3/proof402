import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const args = process.argv.slice(2);
const baseUrl = normalizeBaseUrl(args.find((arg) => !arg.startsWith("--")) || "https://proof402.vercel.app");
const expectedVersion = valueFor("--expect-version") || packageJson.version;

const sampleRequest = {
  contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  label: "production monitor hash",
  metadata: {
    script: "production-monitor"
  },
  idempotencyKey: `production-monitor-${Date.now()}`
};

try {
  const [health, status, openapi, x402WellKnown, recentProofs] = await Promise.all([
    fetchJson("/health"),
    fetchJson("/api/status"),
    fetchJson("/openapi.json"),
    fetchJson("/.well-known/x402"),
    fetchJson("/api/proofs/recent?limit=5")
  ]);

  checkHealth(health);
  checkStatus(status);
  checkOpenApi(openapi);
  checkWellKnown(x402WellKnown);
  checkRecentProofs(recentProofs);
  const challenge = await checkUnpaidChallenge();

  console.log(
    JSON.stringify(
      {
        ok: true,
        service: health.service,
        version: health.version,
        profile: health.profile,
        sourceCommit: short(health.sourceControl?.commitSha),
        paidEndpoint: "/api/proof/notarize",
        challenge
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(`production-monitor failed: ${error.message}`);
  process.exit(1);
}

function checkHealth(health) {
  assert(health.ok === true, "/health ok must be true");
  assert(health.service === "Proof402", `/health service mismatch: ${health.service}`);
  assert(health.version === expectedVersion, `/health version ${health.version}, expected ${expectedVersion}`);
  assert(health.profile === "mainnet", `/health expected mainnet, got ${health.profile}`);
  assert(health.x402Enabled === true, "/health expected x402Enabled=true");
  assert(health.network === "eip155:8453", `/health network mismatch: ${health.network}`);
  assert(health.price === "$0.005", `/health price mismatch: ${health.price}`);
  assert(health.sourceControl?.repository === "hfe3/proof402", "/health sourceControl repository mismatch");
  assert(/^[a-f0-9]{40}$/i.test(health.sourceControl?.commitSha || ""), "/health missing git commit SHA");
  assert(health.store?.driver === "postgres", `/health store driver mismatch: ${health.store?.driver}`);
  assert(health.rateLimit?.enabled === true, "/health expected rate limit enabled");
}

function checkStatus(status) {
  assert(status.version === expectedVersion, `/api/status version ${status.version}, expected ${expectedVersion}`);
  assert(status.repository?.visibility === "public", "/api/status repository visibility must be public");
  assert(status.repository?.license === "MIT", "/api/status license mismatch");
  assert(status.paidAction?.x402Enabled === true, "/api/status paid action expected x402 enabled");
  assert(status.paidAction?.network === "eip155:8453", "/api/status paid action network mismatch");
  assert(status.paidAction?.price === "$0.005", "/api/status paid action price mismatch");
  assert(status.safety?.secretFilesCommitted === false, "/api/status secretFilesCommitted must be false");
}

function checkOpenApi(openapi) {
  const paidOperation = openapi.paths?.["/api/proof/notarize"]?.post;
  const paymentInfo = paidOperation?.["x-payment-info"];
  assert(openapi.info?.version === expectedVersion, `/openapi.json version ${openapi.info?.version}, expected ${expectedVersion}`);
  assert(paymentInfo?.price?.mode === "fixed", "/openapi.json x-payment-info price mode mismatch");
  assert(paymentInfo?.price?.amount === "0.005", "/openapi.json x-payment-info amount mismatch");
  assert(paymentInfo?.price?.currency === "USD", "/openapi.json x-payment-info currency mismatch");
  assert(
    paymentInfo?.protocols?.some((protocol) => protocol.x402?.network === "eip155:8453"),
    "/openapi.json x-payment-info missing Base mainnet x402 protocol"
  );
}

function checkWellKnown(x402WellKnown) {
  assert(x402WellKnown.name === "Proof402", "/.well-known/x402 name mismatch");
  assert(
    x402WellKnown.resources?.includes(`POST ${baseUrl}/api/proof/notarize`),
    "/.well-known/x402 missing paid proof resource"
  );
}

function checkRecentProofs(recentProofs) {
  assert(recentProofs.ok === true, "/api/proofs/recent ok must be true");
  assert(Array.isArray(recentProofs.proofs), "/api/proofs/recent proofs must be an array");
}

async function checkUnpaidChallenge() {
  const response = await fetch(`${baseUrl}/api/proof/notarize`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sampleRequest)
  });

  assert(response.status === 402, `unpaid proof route expected 402, got ${response.status}`);
  const paymentRequired = response.headers.get("payment-required");
  assert(paymentRequired, "402 response missing payment-required header");
  const decoded = JSON.parse(Buffer.from(paymentRequired, "base64url").toString("utf8"));
  const accept = decoded.accepts?.find((item) => item.network === "eip155:8453");
  assert(decoded.x402Version === 2, `payment-required x402Version mismatch: ${decoded.x402Version}`);
  assert(accept, "payment-required accepts missing Base mainnet entry");
  assert(accept.amount === "5000", `payment-required amount mismatch: ${accept.amount}`);
  assert(/^0x[a-fA-F0-9]{40}$/.test(accept.payTo || ""), "payment-required payTo missing public EVM address");
  return {
    status: response.status,
    x402Version: decoded.x402Version,
    network: accept.network,
    amount: accept.amount,
    payToConfigured: true
  };
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `${path} returned ${response.status}: ${body.error?.message || response.statusText}`);
  return body;
}

function valueFor(name) {
  const prefix = `${name}=`;
  const exactIndex = args.indexOf(name);
  if (exactIndex !== -1) return args[exactIndex + 1] || "";
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || "";
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function short(value) {
  return value ? String(value).slice(0, 12) : null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
