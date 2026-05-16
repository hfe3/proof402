import { config } from "./config.js";
import { AVOID_WHEN, DISCOVERY_KEYWORDS, EXAMPLE_REQUEST, SERVICE, USE_WHEN } from "./serviceInfo.js";

function abs(path) {
  return `${config.publicBaseUrl}${path}`;
}

export function publicActionCatalog() {
  return {
    ok: true,
    service: SERVICE.name,
    generatedAt: new Date().toISOString(),
    activePrimitive: {
      id: SERVICE.paidActionId,
      method: "POST",
      path: SERVICE.paidPath,
      paid: true,
      price: config.x402Price,
      network: config.x402Network
    },
    categories: ["proof", "timestamp", "audit", "workflow"],
    templates: [
      {
        id: "proof.agent_result_hash",
        status: "ready",
        category: "proof",
        title: "Timestamp an agent result hash",
        description: "Create a signed proof that an autonomous agent result hash existed at a specific time.",
        tags: ["agent-result", "hash", "timestamp"],
        searchPhrases: ["prove my agent result", "timestamp result hash", "x402 proof receipt"],
        paidRoute: SERVICE.paidPath,
        exampleRequest: EXAMPLE_REQUEST,
        buyerValue: "The buyer gets a public proof badge and verification endpoint without exposing private output.",
        verification: [SERVICE.verifyPathTemplate, SERVICE.proofPathTemplate]
      },
      {
        id: "proof.workflow_checkpoint",
        status: "ready",
        category: "workflow",
        title: "Mark a workflow checkpoint",
        description: "Record a signed timestamp for a workflow checkpoint hash before continuing a multi-agent task.",
        tags: ["workflow", "checkpoint", "audit"],
        searchPhrases: ["workflow checkpoint proof", "agent audit timestamp", "prove checkpoint hash"],
        paidRoute: SERVICE.paidPath,
        exampleRequest: {
          ...EXAMPLE_REQUEST,
          label: "workflow checkpoint hash",
          idempotencyKey: "workflow-42-checkpoint-3"
        },
        buyerValue: "The caller can retry safely and cite the checkpoint badge later.",
        verification: [SERVICE.verifyPathTemplate, SERVICE.proofPathTemplate]
      },
      {
        id: "proof.report_digest",
        status: "ready",
        category: "audit",
        title: "Timestamp a report digest",
        description: "Create a proof for the SHA-256 digest of a report before sharing or publishing it.",
        tags: ["report", "digest", "audit"],
        searchPhrases: ["report digest proof", "timestamp report hash", "signed proof badge"],
        paidRoute: SERVICE.paidPath,
        exampleRequest: {
          ...EXAMPLE_REQUEST,
          label: "report digest",
          idempotencyKey: "report-2026-05-16-digest"
        },
        buyerValue: "The buyer proves the report digest existed before later edits or distribution.",
        verification: [SERVICE.verifyPathTemplate, SERVICE.proofPathTemplate]
      }
    ],
    policyModes: [
      {
        id: "demo-local",
        status: config.x402Enabled ? "inactive" : "active",
        description: "Local development mode. No real payment is required."
      },
      {
        id: "x402-exact",
        status: config.x402Enabled ? "active" : "configured-not-active",
        description: "Exact x402 payment challenge on the paid proof endpoint."
      }
    ],
    snippets: [
      {
        id: "create-proof-fetch",
        language: "javascript",
        code: `await fetch("${abs(SERVICE.paidPath)}", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(${JSON.stringify(EXAMPLE_REQUEST)}) });`
      },
      {
        id: "verify-proof-fetch",
        language: "javascript",
        code: `await fetch("${abs("/api/verify/proofs/proof_...")}").then((r) => r.json());`
      }
    ],
    discoveryKeywords: DISCOVERY_KEYWORDS,
    useWhen: USE_WHEN,
    avoidWhen: AVOID_WHEN,
    links: {
      quickstart: abs("/api/quickstart"),
      capabilities: abs("/api/capabilities"),
      bazaar: abs("/api/bazaar"),
      trust: abs("/api/trust"),
      proofs: abs("/proofs"),
      openapi: abs("/openapi.json")
    }
  };
}

export function publicQuickstart() {
  return {
    ok: true,
    service: SERVICE.name,
    purpose: SERVICE.shortDescription,
    recommendedUse: "Use Proof402 when an agent needs a signed timestamp for a SHA-256 hash and a public verification link.",
    payment: {
      required: true,
      activeNow: config.x402Enabled,
      scheme: "exact",
      network: config.x402Network,
      price: config.x402Price,
      route: abs(SERVICE.paidPath)
    },
    minimalRequest: EXAMPLE_REQUEST,
    callFlow: [
      "Hash the sensitive payload locally. Do not send raw payloads to Proof402.",
      `POST JSON to ${abs(SERVICE.paidPath)}.`,
      "In demo mode you receive a proof immediately; in x402 mode satisfy the 402 challenge and retry.",
      "Read links.verify to verify the HMAC signature and links.proof for the public badge."
    ],
    decisionRules: {
      useWhen: USE_WHEN,
      avoidWhen: AVOID_WHEN
    },
    limits: {
      requestBody: "128kb",
      maxMetadataBytes: config.maxMetadataBytes,
      maxLabelLength: config.maxLabelLength,
      idempotencyRequired: true
    },
    snippets: [
      {
        id: "minimal-curl",
        language: "bash",
        code: `curl -s -X POST ${abs(SERVICE.paidPath)} -H "content-type: application/json" -d '${JSON.stringify(EXAMPLE_REQUEST)}'`
      }
    ],
    verify: {
      proofApi: abs("/api/proofs/{id}"),
      verifyApi: abs(SERVICE.verifyPathTemplate),
      proofBadge: abs(SERVICE.proofPathTemplate)
    },
    nextDiscoverySteps: [
      abs("/api/capabilities"),
      abs("/api/actions"),
      abs("/api/bazaar"),
      abs("/openapi.json"),
      abs("/llms.txt")
    ]
  };
}
