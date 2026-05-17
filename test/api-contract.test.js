import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { request } from "./helpers.js";
import { resetStoreForTests } from "../src/store.js";

test("capabilities document exposes Proof402 paid action", async () => {
  await resetStoreForTests();
  const { response, body } = await request("/api/capabilities");

  assert.equal(response.status, 200);
  assert.equal(body.name, "Proof402");
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
  assert.ok(body.links.status.endsWith("/api/status"));
  assert.ok(body.links.securityTxt.endsWith("/.well-known/security.txt"));
});

test("openapi document exposes proof routes", async () => {
  const { response, body } = await request("/openapi.json");

  assert.equal(response.status, 200);
  assert.equal(body.openapi, "3.1.0");
  assert.ok(body.paths["/api/proof/notarize"].post);
  assert.ok(body.paths["/api/proofs/recent"].get);
  assert.ok(body.paths["/api/proofs/{id}"].get);
  assert.ok(body.paths["/api/verify/proofs/{id}"].get);
  assert.ok(body.paths["/proof/{id}"].get);
  assert.ok(body.paths["/api/status"].get);
  assert.ok(body.components.schemas.ProofRequest);
  assert.ok(body.components.schemas.ProofResponse);
});

test("status document exposes safe launch metadata", async () => {
  await resetStoreForTests();
  const { response, body } = await request("/api/status");

  assert.equal(response.status, 200);
  assert.equal(body.service, "Proof402");
  assert.equal(body.repository.url, "https://github.com/hfe3/proof402");
  assert.equal(body.repository.visibility, "public");
  assert.equal(body.repository.license, "MIT");
  assert.equal(body.safety.rawPayloadStorage, false);
  assert.equal(body.safety.secretFilesCommitted, false);
  assert.equal(body.links.trust, "/api/trust");
  assert.equal(body.links.paidEndpoint, "/api/proof/notarize");
});

test("bazaar, quickstart, and action catalog expose agent discovery metadata", async () => {
  const bazaar = await request("/api/bazaar");
  assert.equal(bazaar.response.status, 200);
  assert.equal(bazaar.body.name, "Proof402");
  assert.equal(bazaar.body.resource.endsWith("/api/proof/notarize"), true);
  assert.equal(bazaar.body.payment.price, "$0.003");
  assert.ok(bazaar.body.discovery.qualitySignals.some((signal) => signal.includes("Demo mode")));

  const quickstart = await request("/api/quickstart");
  assert.equal(quickstart.response.status, 200);
  assert.equal(quickstart.body.payment.route.endsWith("/api/proof/notarize"), true);
  assert.equal(quickstart.body.minimalRequest.idempotencyKey, "proof-task-123");
  assert.ok(quickstart.body.callFlow.some((step) => step.includes("Hash")));

  const actions = await request("/api/actions");
  assert.equal(actions.response.status, 200);
  assert.equal(actions.body.activePrimitive.id, "proof.notarize");
  assert.ok(actions.body.templates.some((template) => template.id === "proof.agent_result_hash"));
  assert.ok(actions.body.discoveryKeywords.includes("public proof badge"));
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

  const securityTxt = await request("/.well-known/security.txt");
  assert.equal(securityTxt.response.status, 200);
  assert.ok(securityTxt.body.includes("Canonical: https://proof402.vercel.app/.well-known/security.txt"));

  const socialCard = await request("/proof402-social.svg");
  assert.equal(socialCard.response.status, 200);
  assert.ok(socialCard.body.includes("Proof402 social preview"));

  for (const path of [
    "/",
    "/agents",
    "/pricing",
    "/demo",
    "/actions",
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
