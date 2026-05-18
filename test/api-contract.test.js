import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { request } from "./helpers.js";
import { resetStoreForTests } from "../src/store.js";

const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;

test("capabilities document exposes Proof402 paid action", async () => {
  await resetStoreForTests();
  const { response, body } = await request("/api/capabilities");

  assert.equal(response.status, 200);
  assert.equal(body.name, "Proof402");
  assert.equal(body.version, packageVersion);
  assert.equal(body.actions[0].id, "proof.notarize");
  assert.equal(body.actions[0].path, "/api/proof/notarize");
  assert.equal(body.actions[0].paid, true);
  assert.equal(body.quickstart.path, "/api/quickstart");
  assert.equal(body.actionCatalog.path, "/api/actions");
  assert.equal(body.verification.proofVerification, "/api/verify/proofs/{id}");
  assert.equal(body.safety.rawPayloadStorage, false);
  assert.ok(body.discoveryKeywords.includes("paid timestamp proof"));
  assert.ok(body.agentPrompt.includes("Use Proof402"));
  assert.ok(body.links.llms.endsWith("/llms.txt"));
  assert.ok(body.links.marketplace.endsWith("/marketplace"));
  assert.ok(body.links.marketplaceJson.endsWith("/marketplace.json"));
  assert.ok(body.links.status.endsWith("/api/status"));
  assert.ok(body.links.securityTxt.endsWith("/.well-known/security.txt"));
  assert.equal(body.product.dashboard, "/dashboard");
  assert.equal(body.product.proofSearch, "/api/proofs/search");
  assert.equal(body.product.apiKeyHeader, "X-Proof402-Key");
});

test("responses include baseline browser security headers", async () => {
  const { response } = await request("/health");

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.ok(response.headers.get("permissions-policy").includes("camera=()"));

  const csp = response.headers.get("content-security-policy");
  assert.ok(csp.includes("default-src 'self'"));
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
});

test("health exposes Better Stack state without secret values", async () => {
  const { response, body } = await request("/health");

  assert.equal(response.status, 200);
  assert.equal(body.observability.betterStack.enabled, false);
  assert.equal(body.observability.betterStack.sourceId, null);
  assert.equal(body.observability.betterStack.ingestHostConfigured, false);
  assert.equal(body.observability.betterStack.sourceTokenConfigured, false);
  assert.equal(body.observability.betterStack.sourceToken, undefined);
});

test("openapi document exposes proof routes", async () => {
  const { response, body } = await request("/openapi.json");

  assert.equal(response.status, 200);
  assert.equal(body.openapi, "3.1.0");
  assert.equal(body.info.version, packageVersion);
  assert.ok(body.paths["/api/proof/notarize"].post);
  assert.ok(body.paths["/api/proofs/recent"].get);
  assert.ok(body.paths["/api/proofs/{id}"].get);
  assert.ok(body.paths["/api/verify/proofs/{id}"].get);
  assert.ok(body.paths["/proof/{id}"].get);
  assert.ok(body.paths["/marketplace"].get);
  assert.ok(body.paths["/marketplace.json"].get);
  assert.ok(body.paths["/api/status"].get);
  assert.ok(body.paths["/dashboard"].get);
  assert.ok(body.paths["/api/dashboard/summary"].get);
  assert.ok(body.paths["/api/proofs/search"].get);
  assert.ok(body.paths["/api/accounts"].get);
  assert.ok(body.paths["/api/accounts/{id}/api-keys"].post);
  assert.ok(body.paths["/api/accounts/{id}/webhooks"].post);
  assert.ok(body.paths["/.well-known/x402"].get);
  const paymentInfo = body.paths["/api/proof/notarize"].post["x-payment-info"];
  assert.equal(paymentInfo.price.mode, "fixed");
  assert.equal(paymentInfo.price.currency, "USD");
  assert.ok(paymentInfo.protocols.some((protocol) => protocol.x402?.network === "eip155:84532"));
  assert.ok(body.components.schemas.ProofRequest);
  assert.ok(body.components.schemas.ProofResponse);
});

test("status document exposes safe launch metadata", async () => {
  await resetStoreForTests();
  const { response, body } = await request("/api/status");

  assert.equal(response.status, 200);
  assert.equal(body.service, "Proof402");
  assert.equal(body.version, packageVersion);
  assert.equal(body.repository.url, "https://github.com/hfe3/proof402");
  assert.equal(body.repository.visibility, "public");
  assert.equal(body.repository.license, "MIT");
  assert.equal(body.sourceControl.provider, "local");
  assert.equal(body.sourceControl.repository, "hfe3/proof402");
  assert.equal(body.sourceControl.commitSha, null);
  assert.equal(body.safety.rawPayloadStorage, false);
  assert.equal(body.safety.secretFilesCommitted, false);
  assert.equal(body.links.trust, "/api/trust");
  assert.equal(body.links.marketplace, "/marketplace");
  assert.equal(body.links.marketplaceJson, "/marketplace.json");
  assert.equal(body.links.securityTxt, "/.well-known/security.txt");
  assert.equal(body.links.paidEndpoint, "/api/proof/notarize");
  assert.equal(body.links.dashboard, "/dashboard");
  assert.equal(body.links.proofSearch, "/api/proofs/search");
  assert.equal(body.product.dashboard, true);
  assert.equal(body.safety.rawApiKeysStored, false);
  assert.equal(body.safety.webhookPayloadBodiesStored, false);
});

test("malformed JSON returns structured invalid_json error", async () => {
  const { response, body } = await request("/api/proof/notarize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{contentHash:x}"
  });

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "invalid_json");
  assert.equal(body.error.message, "Request body must be valid JSON.");
});

test("bazaar, quickstart, and action catalog expose agent discovery metadata", async () => {
  const bazaar = await request("/api/bazaar");
  assert.equal(bazaar.response.status, 200);
  assert.equal(bazaar.body.name, "Proof402");
  assert.equal(bazaar.body.resource.endsWith("/api/proof/notarize"), true);
  assert.equal(bazaar.body.payment.price, "$0.003");
  assert.ok(bazaar.body.discovery.qualitySignals.some((signal) => signal.includes("Demo mode")));
  assert.ok(bazaar.body.discovery.qualitySignals.some((signal) => signal.includes("marketplace listing")));
  assert.ok(bazaar.body.links.marketplace.endsWith("/marketplace"));
  assert.ok(bazaar.body.links.marketplaceJson.endsWith("/marketplace.json"));

  const quickstart = await request("/api/quickstart");
  assert.equal(quickstart.response.status, 200);
  assert.equal(quickstart.body.payment.route.endsWith("/api/proof/notarize"), true);
  assert.equal(quickstart.body.minimalRequest.idempotencyKey, "proof-task-123");
  assert.ok(quickstart.body.callFlow.some((step) => step.includes("Hash")));
  assert.ok(quickstart.body.nextDiscoverySteps.some((step) => step.endsWith("/marketplace")));

  const actions = await request("/api/actions");
  assert.equal(actions.response.status, 200);
  assert.equal(actions.body.activePrimitive.id, "proof.notarize");
  assert.ok(actions.body.templates.some((template) => template.id === "proof.agent_result_hash"));
  assert.ok(actions.body.discoveryKeywords.includes("public proof badge"));
  assert.ok(actions.body.links.marketplace.endsWith("/marketplace"));
  assert.ok(actions.body.links.status.endsWith("/api/status"));

  const trust = await request("/api/trust");
  assert.equal(trust.response.status, 200);
  assert.equal(trust.body.sourceControl.repository, "hfe3/proof402");
  assert.equal(trust.body.links.marketplace, "/marketplace");
  assert.equal(trust.body.links.marketplaceJson, "/marketplace.json");
});

test("llms.txt and public pages load", async () => {
  const llms = await request("/llms.txt");
  assert.equal(llms.response.status, 200);
  assert.ok(llms.body.includes("Proof402"));
  assert.ok(llms.body.includes("POST /api/proof/notarize"));

  const localLlms = readFileSync("public/llms.txt", "utf8");
  assert.ok(localLlms.includes("Production URL"));
  assert.ok(localLlms.includes("https://proof402.vercel.app"));
  assert.ok(localLlms.includes("$0.005"));

  const robots = await request("/robots.txt");
  assert.equal(robots.response.status, 200);
  assert.ok(robots.body.includes("Sitemap: https://proof402.vercel.app/sitemap.xml"));

  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.response.status, 200);
  assert.ok(sitemap.body.includes("https://proof402.vercel.app/api/status"));
  assert.ok(sitemap.body.includes("https://proof402.vercel.app/marketplace"));
  assert.ok(sitemap.body.includes("https://proof402.vercel.app/dashboard"));
  assert.ok(sitemap.body.includes("https://proof402.vercel.app/api/proofs/search"));

  const marketplaceJson = await request("/marketplace.json");
  assert.equal(marketplaceJson.response.status, 200);
  assert.equal(marketplaceJson.body.name, "Proof402");
  assert.equal(marketplaceJson.body.version, packageVersion);
  assert.equal(marketplaceJson.body.paidAction.path, "/api/proof/notarize");
  assert.equal(marketplaceJson.body.x402.price, "$0.005");
  assert.equal(marketplaceJson.body.safety.rawPayloadStorage, false);
  assert.equal(marketplaceJson.body.discovery.status, "https://proof402.vercel.app/api/status");
  assert.equal(marketplaceJson.body.discovery.securityTxt, "https://proof402.vercel.app/.well-known/security.txt");
  assert.equal(marketplaceJson.body.discovery.x402WellKnown, "https://proof402.vercel.app/.well-known/x402");
  assert.equal(marketplaceJson.body.discovery.dashboard, "https://proof402.vercel.app/dashboard");
  assert.equal(marketplaceJson.body.product.apiKeyHeader, "X-Proof402-Key");

  const securityTxt = await request("/.well-known/security.txt");
  assert.equal(securityTxt.response.status, 200);
  assert.ok(securityTxt.body.includes("Canonical: https://proof402.vercel.app/.well-known/security.txt"));
  assert.match(securityTxt.body, /^Expires: \d{4}-\d{2}-\d{2}T/m);

  const x402WellKnown = await request("/.well-known/x402");
  assert.equal(x402WellKnown.response.status, 200);
  assert.equal(x402WellKnown.body.name, "Proof402");
  assert.ok(x402WellKnown.body.resources.includes("POST http://127.0.0.1:4022/api/proof/notarize"));

  const socialCard = await request("/proof402-social.svg");
  assert.equal(socialCard.response.status, 200);
  assert.ok(socialCard.body.includes("Proof402 social preview"));

  for (const [assetPath, marker] of [
    ["/proof402-wordmark.svg", "Proof402 wordmark"],
    ["/proof402-marketplace-banner.svg", "Proof402 marketplace banner"],
    ["/proof402-proof-badge-example.svg", "Proof402 proof badge example"]
  ]) {
    const asset = await request(assetPath);
    assert.equal(asset.response.status, 200, `${assetPath} should load`);
    assert.ok(asset.body.includes(marker), `${assetPath} should include title`);
  }

  for (const path of [
    "/",
    "/agents",
    "/pricing",
    "/demo",
    "/actions",
    "/marketplace",
    "/dashboard",
    "/trust",
    "/proofs",
    "/proof/proof_missing",
    "/landing-mockups.html"
  ]) {
    const page = await request(path);
    assert.equal(page.response.status, 200, `${path} should load`);
    assert.ok(String(page.body).includes("Proof402"), `${path} should mention Proof402`);
    assert.ok(String(page.body).includes('meta property="og:title"'), `${path} should include Open Graph title`);
    assert.ok(String(page.body).includes('meta name="twitter:card"'), `${path} should include Twitter card metadata`);
  }
});
