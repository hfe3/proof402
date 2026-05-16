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
      githubPushed: false,
      vercelDeployed: false,
      mainnetSmokePassed: false,
      note: "Local MVP is intentionally separate from GitHub and production deploy."
    }
  };
}
