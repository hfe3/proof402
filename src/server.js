import { fileURLToPath } from "node:url";
import express from "express";
import { config, assertProductionConfig, publicSourceControl, runtimeSummary } from "./config.js";
import { publicActionCatalog, publicQuickstart } from "./actionCatalog.js";
import { publicBazaarMetadata } from "./bazaar.js";
import { openApiSpec, publicCapabilities, x402WellKnown } from "./apiContract.js";
import { ApiError, errorBody } from "./errors.js";
import { logEvent, observabilitySummary, recordMetric, requestLogger } from "./observability.js";
import { proofLinks, publicProof } from "./proofService.js";
import { createRateLimiter } from "./rateLimit.js";
import { securityHeaders } from "./securityHeaders.js";
import { buildStatusSummary, buildTrustSummary } from "./trustSummary.js";
import { maybeInstallX402 } from "./x402.js";
import { getProof, initStore, listRecentProofs, storeStats } from "./store.js";
import { notarizeProof } from "./proofService.js";
import { verifyProof } from "./proofCrypto.js";

assertProductionConfig();
await initStore();
logEvent("info", "service.starting", runtimeSummary());

export const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(requestLogger);
app.use(express.static("public", { extensions: ["html"] }));

app.get(["/security.txt", "/.well-known/security.txt"], (_req, res) => {
  res.type("text/plain").sendFile("security.txt", { root: "public" });
});

app.get("/.well-known/x402", (_req, res) => {
  res.json(x402WellKnown());
});

app.get("/health", async (_req, res, next) => {
  try {
    res.json({
      ok: true,
      service: config.serviceName,
      version: config.version,
      profile: config.profile,
      x402Enabled: config.x402Enabled,
      x402Mock: config.x402Mock,
      network: config.x402Network,
      price: config.x402Price,
      publicBaseUrl: config.publicBaseUrl,
      sourceControl: publicSourceControl(),
      store: await storeStats(),
      observability: observabilitySummary(),
      rateLimit: {
        enabled: config.rateLimitEnabled,
        windowMs: config.rateLimitWindowMs,
        maxRequests: config.rateLimitMaxRequests
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/capabilities", (_req, res) => {
  res.json(publicCapabilities());
});

app.get("/api/bazaar", (_req, res) => {
  res.json(publicBazaarMetadata());
});

app.get("/api/quickstart", (_req, res) => {
  res.json(publicQuickstart());
});

app.get("/api/actions", (_req, res) => {
  res.json(publicActionCatalog());
});

app.get("/api/trust", async (_req, res, next) => {
  try {
    res.json(
      await buildTrustSummary({
        storeStats,
        listRecentProofs
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/status", async (_req, res, next) => {
  try {
    res.json(
      await buildStatusSummary({
        storeStats
      })
    );
  } catch (error) {
    next(error);
  }
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec());
});

app.get("/proof/:id", (_req, res) => {
  res.sendFile("proof.html", { root: "public" });
});

app.get("/api/proofs/recent", async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(Number.parseInt(req.query.limit, 10) || 10, 50));
    const proofs = await listRecentProofs(limit);
    res.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      service: config.serviceName,
      limit,
      redactionPolicy: {
        rawPayloads: "never published",
        metadata: "metadataHash and metadataKeys only",
        signatures: "truncated in recent public feeds; full signature is available on direct proof and verify endpoints"
      },
      proofs: proofs.map((proof) => ({
        proof: publicProof(proof, { includeSignature: false, direct: false }),
        links: proofLinks(proof.id)
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/proofs/:id", async (req, res, next) => {
  try {
    const proof = await getProof(req.params.id);
    if (!proof) {
      throw new ApiError(404, "not_found", "Proof not found.", { id: req.params.id });
    }

    res.json({
      ok: true,
      proof: publicProof(proof, { includeSignature: true, direct: true }),
      links: proofLinks(proof.id)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/verify/proofs/:id", async (req, res, next) => {
  try {
    const proof = await getProof(req.params.id);
    if (!proof) {
      throw new ApiError(404, "not_found", "Proof not found.", { id: req.params.id });
    }

    res.json({
      ok: true,
      verified: verifyProof(proof),
      proof: publicProof(proof, { includeSignature: true, direct: true }),
      checks: {
        signature: "hmac-sha256",
        canonicalPayload: "proof402.proof.v1",
        signedFields: ["proofId", "timestamp", "contentHash", "label", "metadataHash", "idempotencyKey"]
      },
      links: proofLinks(proof.id)
    });
  } catch (error) {
    next(error);
  }
});

await maybeInstallX402(app);

app.use(express.json({ limit: "128kb" }));
app.use(createRateLimiter(config));

app.post("/api/proof/notarize", async (req, res, next) => {
  try {
    const result = await notarizeProof(req.body || {});
    recordMetric("proof.created_or_replayed");
    if (result.idempotentReplay) recordMetric("proof.idempotent_replay");

    res.json({
      ok: true,
      mode: config.x402Enabled ? "x402" : "demo",
      idempotentReplay: result.idempotentReplay,
      proof: publicProof(result.proof, { includeSignature: true, direct: true }),
      links: proofLinks(result.proof.id)
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, _res, next) => {
  next(new ApiError(404, "not_found", "Route not found.", { method: req.method, path: req.path }));
});

app.use((error, _req, res, _next) => {
  const normalizedError = normalizeExpressError(error);
  const status = normalizedError instanceof ApiError ? normalizedError.status : 500;
  if (!(normalizedError instanceof ApiError)) {
    logEvent("error", "http.unhandled_error", { message: error.message, stack: error.stack });
  }
  res.status(status).json(errorBody(normalizedError));
});

function normalizeExpressError(error) {
  if (error instanceof SyntaxError && error.status === 400 && error.type === "entity.parse.failed") {
    return new ApiError(400, "invalid_json", "Request body must be valid JSON.", {});
  }

  return error;
}

export function startServer() {
  const server = app.listen(config.port, config.host, () => {
    logEvent("info", "service.ready", {
      url: `http://${config.host}:${config.port}`,
      publicBaseUrl: config.publicBaseUrl
    });
  });
  return server;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  startServer();
}
