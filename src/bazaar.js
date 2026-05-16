import { config } from "./config.js";
import {
  AGENT_PROMPT,
  AVOID_WHEN,
  DISCOVERY_KEYWORDS,
  EXAMPLE_REQUEST,
  EXAMPLE_RESPONSE,
  SERVICE,
  SERVICE_TAGS,
  USE_WHEN
} from "./serviceInfo.js";
import { proofRequestSchema, proofResponseSchema } from "./apiContract.js";

function abs(path) {
  return `${config.publicBaseUrl}${path}`;
}

export function proofRouteConfig() {
  return {
    "POST /api/proof/notarize": {
      accepts: [
        {
          scheme: "exact",
          price: config.x402Price,
          network: config.x402Network,
          payTo: config.payTo || "0xYourReceivingWallet"
        }
      ],
      description:
        "Paid timestamp/hash notarization for autonomous agents. The caller submits a SHA-256 content hash, optional non-secret metadata, and an idempotency key. Proof402 returns a signed timestamped proof and public verification links without storing raw payloads.",
      mimeType: "application/json",
      serviceName: SERVICE.name,
      tags: SERVICE_TAGS,
      input: EXAMPLE_REQUEST,
      output: EXAMPLE_RESPONSE
    }
  };
}

export function publicBazaarMetadata() {
  return {
    name: SERVICE.name,
    tagline: SERVICE.tagline,
    description: SERVICE.description,
    category: SERVICE.category,
    tags: SERVICE_TAGS,
    discoveryKeywords: DISCOVERY_KEYWORDS,
    agentPrompt: AGENT_PROMPT,
    resource: abs(SERVICE.paidPath),
    x402Enabled: config.x402Enabled,
    payment: {
      scheme: "exact",
      price: config.x402Price,
      network: config.x402Network,
      payTo: config.payTo || null
    },
    discovery: {
      searchQueries: DISCOVERY_KEYWORDS,
      qualitySignals: [
        "Unpaid proof route returns 402 Payment Required when x402 is enabled",
        "Demo mode is explicit and does not claim real payment settlement",
        "OpenAPI 3.1 contract is available",
        "Agent-readable capabilities document is available",
        "Machine-readable action catalog is available",
        "Compact quickstart endpoint is available",
        "Public proof badge pages are available",
        "Recent public proofs redact broad-feed signatures",
        "Proofs sign contentHash and metadataHash instead of exposing raw payloads",
        "Postgres storage path is configured for production without requiring local deploy"
      ],
      inputExample: EXAMPLE_REQUEST,
      outputExample: EXAMPLE_RESPONSE,
      inputSchema: proofRequestSchema,
      outputSchema: proofResponseSchema,
      useWhen: USE_WHEN,
      avoidWhen: AVOID_WHEN
    },
    routeConfig: proofRouteConfig(),
    links: {
      home: abs("/"),
      quickstart: abs("/api/quickstart"),
      actions: abs("/api/actions"),
      capabilities: abs("/api/capabilities"),
      trust: abs("/api/trust"),
      openapi: abs("/openapi.json"),
      llms: abs("/llms.txt"),
      proofBadge: abs(SERVICE.proofPathTemplate),
      verify: abs(SERVICE.verifyPathTemplate)
    }
  };
}
