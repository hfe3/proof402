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

export const proofRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["contentHash", "label", "idempotencyKey"],
  properties: {
    contentHash: {
      type: "string",
      pattern: "^sha256:[a-fA-F0-9]{64}$",
      description: "SHA-256 hash of the result or artifact. Do not send the raw payload."
    },
    label: {
      type: "string",
      minLength: 1,
      maxLength: config.maxLabelLength
    },
    metadata: {
      type: "object",
      additionalProperties: true,
      description: "Optional non-secret metadata. Proof402 stores and exposes only metadataHash and metadataKeys."
    },
    idempotencyKey: {
      type: "string",
      minLength: 1,
      maxLength: 160
    }
  }
};

export const proofResponseSchema = {
  type: "object",
  required: ["ok", "mode", "idempotentReplay", "proof", "links"],
  properties: {
    ok: { type: "boolean" },
    mode: { type: "string", enum: ["demo", "x402"] },
    idempotentReplay: { type: "boolean" },
    proof: {
      type: "object",
      required: ["id", "verified", "timestamp", "contentHash", "metadataHash", "signature"],
      properties: {
        id: { type: "string" },
        verified: { type: "boolean" },
        timestamp: { type: "string", format: "date-time" },
        contentHash: { type: "string" },
        label: { type: "string" },
        metadataHash: { type: "string" },
        signature: { type: "string" }
      }
    },
    links: {
      type: "object",
      properties: {
        proof: { type: "string" },
        verify: { type: "string" }
      }
    }
  }
};

const errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        details: { type: "object" }
      }
    }
  }
};

const accountSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    ownerLabel: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  }
};

const apiKeySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    name: { type: "string" },
    keyPrefix: { type: "string" },
    scopes: { type: "array", items: { type: "string" } },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    lastUsedAt: { type: ["string", "null"], format: "date-time" },
    revokedAt: { type: ["string", "null"], format: "date-time" }
  }
};

const webhookSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    accountId: { type: "string" },
    name: { type: "string" },
    url: { type: "string", format: "uri" },
    events: { type: "array", items: { type: "string" } },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  }
};

function abs(path) {
  return `${config.publicBaseUrl}${path}`;
}

function priceAmount() {
  return String(config.x402Price).replace(/^\$/, "");
}

function paymentInfo() {
  return {
    price: {
      mode: "fixed",
      amount: priceAmount(),
      currency: "USD"
    },
    protocols: [
      {
        x402: {
          version: 2,
          scheme: "exact",
          network: config.x402Network,
          payTo: config.payTo || null
        }
      }
    ]
  };
}

export function x402WellKnown() {
  return {
    version: 1,
    name: SERVICE.name,
    description: SERVICE.description,
    resources: [`POST ${abs(SERVICE.paidPath)}`],
    instructions:
      "Submit only a SHA-256 contentHash, label, optional non-secret metadata, and idempotencyKey. Satisfy the x402 Payment Required challenge, then verify the returned proof through /api/verify/proofs/{id}."
  };
}

export function publicCapabilities() {
  return {
    name: SERVICE.name,
    version: SERVICE.version,
    tagline: SERVICE.tagline,
    description: SERVICE.description,
    shortDescription: SERVICE.shortDescription,
    publicBaseUrl: config.publicBaseUrl,
    discoveryKeywords: DISCOVERY_KEYWORDS,
    tags: SERVICE_TAGS,
    agentPrompt: AGENT_PROMPT,
    agentInstructions: {
      callFlow: [
        "Hash your private result locally with SHA-256.",
        `POST the hash, label, metadata, and idempotencyKey to ${SERVICE.paidPath}.`,
        "If x402 is enabled, satisfy the 402 Payment Required challenge and retry with payment.",
        "Verify the returned proof through /api/verify/proofs/{id}.",
        "Cite /proof/{id} in reports instead of publishing raw payloads."
      ],
      useWhen: USE_WHEN,
      avoidWhen: AVOID_WHEN
    },
    x402: {
      enabled: config.x402Enabled,
      scheme: "exact",
      network: config.x402Network,
      price: config.x402Price,
      payTo: config.payTo || null,
      localMock: config.x402Mock
    },
    actions: [
      {
        id: SERVICE.paidActionId,
        method: "POST",
        path: SERVICE.paidPath,
        paid: true,
        price: config.x402Price,
        requestSchema: proofRequestSchema,
        responseSchema: proofResponseSchema,
        avoidWhen: AVOID_WHEN
      }
    ],
    actionCatalog: {
      path: "/api/actions"
    },
    quickstart: {
      path: "/api/quickstart"
    },
    verification: {
      proof: "/api/proofs/{id}",
      proofVerification: SERVICE.verifyPathTemplate,
      proofBadge: SERVICE.proofPathTemplate,
      recentProofs: "/api/proofs/recent"
    },
    product: {
      dashboard: "/dashboard",
      dashboardSummary: "/api/dashboard/summary",
      proofSearch: "/api/proofs/search",
      accounts: "/api/accounts",
      apiKeyHeader: "X-Proof402-Key",
      adminHeader: "X-Proof402-Admin-Key",
      webhookEvents: ["proof.created", "webhook.test"]
    },
    safety: {
      rawPayloadStorage: false,
      privateHeadersStored: false,
      metadataPublishedRaw: false,
      payloadSizeLimit: "128kb request body, metadata separately capped",
      maxMetadataBytes: config.maxMetadataBytes,
      idempotencyRequired: true,
      rateLimit: {
        enabled: config.rateLimitEnabled,
        windowMs: config.rateLimitWindowMs,
        maxRequests: config.rateLimitMaxRequests
      }
    },
    links: {
      home: abs("/"),
      agents: abs("/agents"),
      pricing: abs("/pricing"),
      demo: abs("/demo"),
      actions: abs("/actions"),
      marketplace: abs("/marketplace"),
      marketplaceJson: abs("/marketplace.json"),
      trust: abs("/trust"),
      proofs: abs("/proofs"),
      dashboard: abs("/dashboard"),
      llms: abs("/llms.txt"),
      openapi: abs("/openapi.json"),
      robots: abs("/robots.txt"),
      sitemap: abs("/sitemap.xml"),
      securityTxt: abs("/.well-known/security.txt"),
      bazaar: abs("/api/bazaar"),
      quickstart: abs("/api/quickstart"),
      actionCatalog: abs("/api/actions"),
      status: abs("/api/status"),
      proofSearch: abs("/api/proofs/search"),
      paidEndpoint: abs(SERVICE.paidPath)
    }
  };
}

export function openApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: SERVICE.name,
      version: SERVICE.version,
      description: SERVICE.description
    },
    servers: [
      {
        url: config.publicBaseUrl
      }
    ],
    paths: {
      "/health": {
        get: {
          summary: "Runtime health and mode summary",
          responses: {
            "200": { description: "Health response" }
          }
        }
      },
      "/api/capabilities": {
        get: {
          summary: "Machine-readable service capabilities",
          responses: {
            "200": { description: "Capabilities response" }
          }
        }
      },
      "/api/bazaar": {
        get: {
          summary: "Bazaar/x402 discovery metadata",
          responses: {
            "200": { description: "Bazaar metadata" }
          }
        }
      },
      "/api/quickstart": {
        get: {
          summary: "Compact agent quickstart",
          responses: {
            "200": { description: "Quickstart response" }
          }
        }
      },
      "/api/actions": {
        get: {
          summary: "Action templates for agent task matching",
          responses: {
            "200": { description: "Action catalog response" }
          }
        }
      },
      "/api/trust": {
        get: {
          summary: "Public trust summary",
          responses: {
            "200": { description: "Trust response" }
          }
        }
      },
      "/api/status": {
        get: {
          summary: "Public launch and runtime status summary",
          responses: {
            "200": { description: "Status response" }
          }
        }
      },
      "/api/dashboard/summary": {
        get: {
          summary: "Product dashboard summary",
          responses: {
            "200": { description: "Dashboard summary" }
          }
        }
      },
      [SERVICE.paidPath]: {
        post: {
          summary: "Create or replay a timestamped proof for a SHA-256 hash",
          "x-payment-info": paymentInfo(),
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: proofRequestSchema,
                example: EXAMPLE_REQUEST
              }
            }
          },
          responses: {
            "200": {
              description: "Proof created or replayed",
              content: {
                "application/json": {
                  schema: proofResponseSchema,
                  example: EXAMPLE_RESPONSE
                }
              }
            },
            "400": {
              description: "Invalid proof request",
              content: {
                "application/json": {
                  schema: errorSchema
                }
              }
            },
            "402": {
              description: "Payment required when x402 is enabled",
              content: {
                "application/json": {
                  schema: errorSchema
                }
              }
            }
          }
        }
      },
      "/api/proofs/recent": {
        get: {
          summary: "Recent public proofs with redacted signatures",
          responses: {
            "200": { description: "Recent proof summaries" }
          }
        }
      },
      "/api/proofs/search": {
        get: {
          summary: "Search public proofs by id, hash, label, metadata hash, or account",
          parameters: [
            { name: "q", in: "query", schema: { type: "string" } },
            { name: "contentHash", in: "query", schema: { type: "string" } },
            { name: "metadataHash", in: "query", schema: { type: "string" } },
            { name: "accountId", in: "query", schema: { type: "string" } },
            { name: "idempotencyKey", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }
          ],
          responses: {
            "200": { description: "Search result" }
          }
        }
      },
      "/api/proofs/{id}": {
        get: {
          summary: "Public proof document",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Proof document" },
            "404": { description: "Proof not found" }
          }
        }
      },
      "/api/verify/proofs/{id}": {
        get: {
          summary: "Verify stored proof signature",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Verification report" },
            "404": { description: "Proof not found" }
          }
        }
      },
      "/proof/{id}": {
        get: {
          summary: "Public proof badge page",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Proof badge HTML" }
          }
        }
      },
      "/marketplace": {
        get: {
          summary: "Public-safe marketplace listing kit page",
          responses: {
            "200": { description: "Marketplace listing HTML" }
          }
        }
      },
      "/marketplace.json": {
        get: {
          summary: "Machine-readable marketplace listing kit",
          responses: {
            "200": { description: "Marketplace listing JSON" }
          }
        }
      },
      "/dashboard": {
        get: {
          summary: "Product dashboard UI",
          responses: {
            "200": { description: "Dashboard HTML" }
          }
        }
      },
      "/api/accounts": {
        get: {
          summary: "List accounts",
          security: [{ AdminKey: [] }],
          responses: {
            "200": { description: "Account list" },
            "401": { description: "Admin key required" }
          }
        },
        post: {
          summary: "Create an account",
          security: [{ AdminKey: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    ownerLabel: { type: "string" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Account created" },
            "401": { description: "Admin key required" }
          }
        }
      },
      "/api/accounts/{id}/api-keys": {
        get: {
          summary: "List account API keys",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Redacted API key list" }
          }
        },
        post: {
          summary: "Create an API key for an account",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "201": { description: "API key created; raw key returned once" }
          }
        }
      },
      "/api/accounts/{id}/webhooks": {
        get: {
          summary: "List account webhooks and recent deliveries",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Webhook list" }
          }
        },
        post: {
          summary: "Create a webhook receipt sink",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "201": { description: "Webhook created; signing secret returned once" }
          }
        }
      },
      "/api/api-keys/{id}/revoke": {
        post: {
          summary: "Revoke an API key",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "API key revoked" }
          }
        }
      },
      "/api/webhooks/{id}/test": {
        post: {
          summary: "Send a signed webhook test event",
          security: [{ AdminKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Webhook test delivery recorded" }
          }
        }
      },
      "/llms.txt": {
        get: {
          summary: "Plain-text guidance for LLM and agent crawlers",
          responses: {
            "200": { description: "LLM guidance" }
          }
        }
      },
      "/.well-known/x402": {
        get: {
          summary: "x402 well-known discovery document",
          responses: {
            "200": { description: "x402 discovery document" }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        AdminKey: {
          type: "apiKey",
          in: "header",
          name: "X-Proof402-Admin-Key"
        },
        Proof402Key: {
          type: "apiKey",
          in: "header",
          name: "X-Proof402-Key"
        }
      },
      schemas: {
        ProofRequest: proofRequestSchema,
        ProofResponse: proofResponseSchema,
        ErrorResponse: errorSchema,
        Account: accountSchema,
        ApiKey: apiKeySchema,
        Webhook: webhookSchema
      }
    }
  };
}
