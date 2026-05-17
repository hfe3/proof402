import { config } from "./config.js";
import { AVOID_WHEN, SERVICE, USE_WHEN } from "./serviceInfo.js";

export async function buildTrustSummary({ storeStats, listRecentProofs }) {
  const stats = await storeStats();
  const recent = await listRecentProofs(10);

  return {
    ok: true,
    service: SERVICE.name,
    generatedAt: new Date().toISOString(),
    profile: config.profile,
    x402: {
      enabled: config.x402Enabled,
      mock: config.x402Mock,
      network: config.x402Network,
      price: config.x402Price,
      payToConfigured: Boolean(config.payTo)
    },
    storage: stats,
    proofModel: {
      signs: ["proofId", "timestamp", "contentHash", "label", "metadataHash", "idempotencyKey"],
      doesNotStorePublicly: ["raw request body", "raw metadata values", "tokens", "headers", "wallet secrets"],
      publicBadge: "/proof/{id}",
      verification: "/api/verify/proofs/{id}"
    },
    recentProofCount: recent.length,
    safety: {
      useWhen: USE_WHEN,
      avoidWhen: AVOID_WHEN,
      noSecretLogging: true,
      idempotencyRequired: true,
      metadataHashOnly: true
    },
    productionReadiness: {
      localMvp: true,
      repository: {
        url: "https://github.com/hfe3/proof402",
        visibility: "private_until_launch",
        ciConfigured: true
      },
      deployment: {
        publicBaseUrl: config.publicBaseUrl,
        vercelConfigured: config.publicBaseUrl.includes("vercel.app"),
        activeMainnet: config.profile === "mainnet" && config.x402Enabled && config.x402Network === "eip155:8453"
      },
      operatorChecks: {
        localTests: "npm test",
        deploymentCheck: "npm run deploy:check -- https://proof402.vercel.app --expect-x402",
        paidSmoke: "npm run smoke:x402 -- https://proof402.vercel.app"
      },
      note: "Repository remains private until final public-launch review."
    }
  };
}

export async function buildStatusSummary({ storeStats }) {
  const stats = await storeStats();

  return {
    ok: true,
    service: SERVICE.name,
    generatedAt: new Date().toISOString(),
    version: SERVICE.version,
    publicBaseUrl: config.publicBaseUrl,
    profile: config.profile,
    paidAction: {
      method: "POST",
      path: SERVICE.paidPath,
      price: config.x402Price,
      x402Enabled: config.x402Enabled,
      x402Mock: config.x402Mock,
      network: config.x402Network,
      payToConfigured: Boolean(config.payTo)
    },
    storage: {
      driver: stats.driver,
      durable: stats.durable,
      proofCount: stats.proofCount
    },
    repository: {
      url: "https://github.com/hfe3/proof402",
      visibility: "private_until_launch",
      ci: "/.github/workflows/ci.yml",
      license: "MIT"
    },
    safety: {
      rawPayloadStorage: false,
      metadataPublishedRaw: false,
      secretFilesCommitted: false,
      rateLimitEnabled: config.rateLimitEnabled
    },
    links: {
      health: "/health",
      trust: "/api/trust",
      capabilities: "/api/capabilities",
      openapi: "/openapi.json",
      paidEndpoint: SERVICE.paidPath
    }
  };
}
