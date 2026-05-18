import { readFileSync } from "node:fs";

const baseUrl = normalizeBaseUrl(process.argv[2]);
const expectX402 = process.argv.includes("--expect-x402");
const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

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
  ["/marketplace.json", "json"],
  ["/llms.txt", "text"],
  ["/robots.txt", "text"],
  ["/sitemap.xml", "text"],
  ["/.well-known/security.txt", "text"],
  ["/", "text"],
  ["/agents", "text"],
  ["/pricing", "text"],
  ["/demo", "text"],
  ["/actions", "text"],
  ["/marketplace", "text"],
  ["/trust", "text"],
  ["/proofs", "text"]
];

try {
  const results = new Map();
  for (const [path, kind] of checks) {
    results.set(path, await checkGet(path, kind));
  }

  checkDiscoveryDocuments(results);

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
  if (path === "/health" || path === "/") {
    checkSecurityHeaders(response, path);
  }
  if (kind === "json") {
    return response.json();
  }
  const text = await response.text();
  assert(text.length > 0, `${path} returned empty text`);
  return text;
}

function checkSecurityHeaders(response, path) {
  const csp = response.headers.get("content-security-policy") || "";
  assert(response.headers.get("x-content-type-options") === "nosniff", `${path} missing X-Content-Type-Options`);
  assert(!response.headers.has("x-powered-by"), `${path} must not expose X-Powered-By`);
  assert(response.headers.get("x-frame-options") === "DENY", `${path} missing X-Frame-Options`);
  assert(
    response.headers.get("referrer-policy") === "strict-origin-when-cross-origin",
    `${path} missing Referrer-Policy`
  );
  assert(csp.includes("default-src 'self'"), `${path} missing CSP default-src`);
  assert(csp.includes("frame-ancestors 'none'"), `${path} CSP missing frame-ancestors`);
  assert(response.headers.get("permissions-policy")?.includes("camera=()"), `${path} missing Permissions-Policy`);
  if (baseUrl.startsWith("https://")) {
    assert(response.headers.get("strict-transport-security")?.includes("max-age=31536000"), `${path} missing HSTS`);
  }
}

function checkDiscoveryDocuments(results) {
  const health = results.get("/health");
  assert(health.service === "Proof402", "/health service mismatch");
  assert(health.version === packageVersion, `/health version mismatch: expected ${packageVersion}, got ${health.version}`);
  assert(health.sourceControl?.repository === "hfe3/proof402", "/health sourceControl repository mismatch");

  if (expectX402) {
    assert(health.profile === "mainnet", `/health expected profile=mainnet, got ${health.profile}`);
    assert(health.x402Enabled === true, "/health expected x402Enabled=true");
    assert(health.network === "eip155:8453", `/health network mismatch: ${health.network}`);
    assert(health.price === "$0.005", `/health price mismatch: ${health.price}`);
    assert(/^[a-f0-9]{40}$/i.test(health.sourceControl?.commitSha || ""), "/health missing Vercel git commit SHA");
  }

  const capabilities = results.get("/api/capabilities");
  assert(capabilities.name === "Proof402", "/api/capabilities name mismatch");
  assert(capabilities.version === packageVersion, "/api/capabilities version mismatch");
  assert(capabilities.actions?.some((action) => action.path === "/api/proof/notarize" && action.paid === true), "/api/capabilities missing paid proof action");

  const status = results.get("/api/status");
  assert(status.version === packageVersion, "/api/status version mismatch");
  assert(status.repository?.url === "https://github.com/hfe3/proof402", "/api/status repository URL mismatch");
  assert(status.repository?.visibility === "public", "/api/status repository visibility mismatch");
  assert(status.sourceControl?.repository === "hfe3/proof402", "/api/status sourceControl repository mismatch");
  assert(status.links?.securityTxt === "/.well-known/security.txt", "/api/status missing security.txt link");

  const trust = results.get("/api/trust");
  assert(trust.service === "Proof402", "/api/trust service mismatch");
  assert(trust.sourceControl?.repository === "hfe3/proof402", "/api/trust sourceControl repository mismatch");
  if (expectX402) {
    assert(trust.x402?.enabled === true, "/api/trust expected x402.enabled=true");
    assert(trust.x402?.network === "eip155:8453", `/api/trust network mismatch: ${trust.x402?.network}`);
    assert(trust.x402?.price === "$0.005", `/api/trust price mismatch: ${trust.x402?.price}`);
    assert(trust.sourceControl?.commitSha === health.sourceControl?.commitSha, "/api/trust sourceControl commit mismatch");
  }

  const openapi = results.get("/openapi.json");
  assert(openapi.info?.version === packageVersion, "/openapi.json version mismatch");
  assert(openapi.paths?.["/api/proof/notarize"]?.post, "/openapi.json missing paid proof route");
  assert(openapi.paths?.["/marketplace.json"]?.get, "/openapi.json missing marketplace JSON route");

  const marketplace = results.get("/marketplace.json");
  assert(marketplace.version === packageVersion, "/marketplace.json version mismatch");
  assert(marketplace.paidAction?.path === "/api/proof/notarize", "/marketplace.json paid action mismatch");
  assert(marketplace.x402?.price === "$0.005", `/marketplace.json price mismatch: ${marketplace.x402?.price}`);
  assert(marketplace.safety?.rawPayloadStorage === false, "/marketplace.json raw payload storage must be false");

  const securityTxt = results.get("/.well-known/security.txt");
  assert(securityTxt.includes("Canonical: https://proof402.vercel.app/.well-known/security.txt"), "security.txt missing canonical URL");
  assert(/^Expires: \d{4}-\d{2}-\d{2}T/m.test(securityTxt), "security.txt missing RFC-style Expires field");

  const robots = results.get("/robots.txt");
  assert(robots.includes("Sitemap: https://proof402.vercel.app/sitemap.xml"), "robots.txt missing sitemap");

  const sitemap = results.get("/sitemap.xml");
  for (const url of [
    "https://proof402.vercel.app/marketplace",
    "https://proof402.vercel.app/marketplace.json",
    "https://proof402.vercel.app/openapi.json",
    "https://proof402.vercel.app/api/status"
  ]) {
    assert(sitemap.includes(url), `sitemap.xml missing ${url}`);
  }
}

function normalizeBaseUrl(value) {
  if (!value) return "";
  return String(value).replace(/\/+$/, "");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
