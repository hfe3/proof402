const baseUrl = normalizeBaseUrl(process.argv[2]);
const expectX402 = process.argv.includes("--expect-x402");

if (!baseUrl) {
  console.error("Usage: npm run deploy:check -- <base-url> [--expect-x402]");
  process.exit(1);
}

const sampleRequest = {
  contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  label: "deploy check hash",
  metadata: {
    script: "deploy-check"
  },
  idempotencyKey: `deploy-check-${Date.now()}`
};

const checks = [
  ["/health", "json"],
  ["/api/capabilities", "json"],
  ["/api/bazaar", "json"],
  ["/api/quickstart", "json"],
  ["/api/actions", "json"],
  ["/api/trust", "json"],
  ["/api/status", "json"],
  ["/openapi.json", "json"],
  ["/llms.txt", "text"],
  ["/robots.txt", "text"],
  ["/sitemap.xml", "text"],
  ["/.well-known/security.txt", "text"],
  ["/", "text"],
  ["/agents", "text"],
  ["/pricing", "text"],
  ["/demo", "text"],
  ["/actions", "text"],
  ["/trust", "text"],
  ["/proofs", "text"]
];

try {
  for (const [path, kind] of checks) {
    await checkGet(path, kind);
  }

  if (expectX402) {
    const response = await fetch(`${baseUrl}/api/proof/notarize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sampleRequest)
    });
    assert(response.status === 402, `expected unpaid proof route to return 402, got ${response.status}`);
  } else {
    const proofResponse = await fetch(`${baseUrl}/api/proof/notarize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sampleRequest)
    });
    assert(proofResponse.ok, `proof route returned ${proofResponse.status}`);
    const proofBody = await proofResponse.json();
    assert(proofBody.proof?.id, "proof response missing proof.id");

    const verifyResponse = await fetch(`${baseUrl}${proofBody.links.verify}`);
    assert(verifyResponse.ok, `verify route returned ${verifyResponse.status}`);
    const verifyBody = await verifyResponse.json();
    assert(verifyBody.verified === true, "verify route did not confirm proof");

    const pageResponse = await fetch(`${baseUrl}${proofBody.links.proof}`);
    assert(pageResponse.ok, `proof badge page returned ${pageResponse.status}`);
  }

  console.log(`deploy-check passed for ${baseUrl}${expectX402 ? " with --expect-x402" : ""}`);
} catch (error) {
  console.error(`deploy-check failed: ${error.message}`);
  process.exit(1);
}

async function checkGet(path, kind) {
  const response = await fetch(`${baseUrl}${path}`);
  assert(response.ok, `${path} returned ${response.status}`);
  if (kind === "json") {
    await response.json();
  } else {
    const text = await response.text();
    assert(text.length > 0, `${path} returned empty text`);
  }
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).replace(/\/+$/, "");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
