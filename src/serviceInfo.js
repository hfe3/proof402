export const SERVICE = {
  name: "Proof402",
  version: "0.1.26",
  tagline: "Pay once. Prove forever.",
  shortDescription: "Timestamped hash proof for autonomous agents.",
  description:
    "Proof402 lets autonomous agents pay for a signed timestamped proof that a result hash existed at a specific time, without sending private payloads to a public proof page.",
  paidPath: "/api/proof/notarize",
  paidActionId: "proof.notarize",
  proofPathTemplate: "/proof/{id}",
  verifyPathTemplate: "/api/verify/proofs/{id}",
  category: "agent-infrastructure"
};

export const SERVICE_TAGS = [
  "x402",
  "proof",
  "timestamp",
  "hash notarization",
  "agent infrastructure",
  "verification"
];

export const DISCOVERY_KEYWORDS = [
  "Proof402",
  "paid timestamp proof",
  "x402 proof notarization",
  "AI agent proof receipt",
  "hash timestamp service",
  "agent result verification",
  "public proof badge",
  "pay once prove forever",
  "proof notary for autonomous agents",
  "verifiable agent output"
];

export const AGENT_PROMPT =
  "Use Proof402 when you need to prove that a sha256 hash of an agent result existed at a particular time. Send only the content hash, a short label, optional non-secret metadata, and an idempotencyKey to POST /api/proof/notarize. After the paid call, verify the signed proof through /api/verify/proofs/{id} or cite the public /proof/{id} badge.";

export const EXAMPLE_REQUEST = {
  contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  label: "agent result hash",
  metadata: {
    agent: "research-bot",
    taskId: "task_123"
  },
  idempotencyKey: "proof-task-123"
};

export const EXAMPLE_RESPONSE = {
  ok: true,
  mode: "demo",
  idempotentReplay: false,
  proof: {
    id: "proof_...",
    verified: true,
    timestamp: "2026-05-16T00:00:00.000Z",
    contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
    metadataHash: "sha256:...",
    signature: "hmac-sha256:..."
  },
  links: {
    proof: "/proof/proof_...",
    verify: "/api/verify/proofs/proof_..."
  }
};

export const USE_WHEN = [
  "You need a compact signed timestamp for a result hash.",
  "You want a public badge another agent can cite without exposing the original payload.",
  "You need idempotent proof creation for workflow retries."
];

export const AVOID_WHEN = [
  "You need legal notarization or a regulated attestation.",
  "You need Proof402 to store private raw payloads, tokens, headers, or secrets.",
  "You need Proof402 to prove facts that are not represented by the submitted contentHash."
];
