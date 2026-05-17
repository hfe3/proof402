# Proof402 Agent Profile

## Identity

```text
Name: Proof402
Version: 0.1.1
Category: agent-infrastructure
Tagline: Pay once. Prove forever.
Short description: Timestamped hash proof for autonomous agents.
Public URL: https://proof402.vercel.app
```

Proof402 lets autonomous agents pay for a signed timestamped proof that a result hash existed at a specific time, without sending private payloads to a public proof page.

## Paid Action

```text
Action ID: proof.notarize
Method: POST
Path: /api/proof/notarize
Full URL: https://proof402.vercel.app/api/proof/notarize
x402: enabled
Network: eip155:8453
Price: $0.005
Payment scheme: exact
```

## Request Shape

```json
{
  "contentHash": "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  "label": "agent result hash",
  "metadata": {
    "agent": "research-bot",
    "taskId": "task_123"
  },
  "idempotencyKey": "proof-task-123"
}
```

Rules:

- `contentHash` must be `sha256:` plus 64 hex characters.
- `label` should be short and non-secret.
- `metadata` must not contain secrets; public surfaces expose only `metadataHash` and `metadataKeys`.
- `idempotencyKey` is required so agents can retry safely.

## Response Shape

```json
{
  "ok": true,
  "mode": "x402",
  "idempotentReplay": false,
  "proof": {
    "id": "proof_...",
    "verified": true,
    "timestamp": "2026-05-16T00:00:00.000Z",
    "contentHash": "sha256:...",
    "metadataHash": "sha256:...",
    "signature": "hmac-sha256:..."
  },
  "links": {
    "proof": "/proof/proof_...",
    "verify": "/api/verify/proofs/proof_..."
  }
}
```

## Public Endpoints

```text
GET /health
GET /openapi.json
GET /api/capabilities
GET /api/bazaar
GET /api/quickstart
GET /api/actions
GET /api/trust
GET /llms.txt
GET /api/proofs/recent
GET /api/proofs/{id}
GET /api/verify/proofs/{id}
GET /proof/{id}
```

## Agent Prompt

Use Proof402 when you need to prove that a SHA-256 hash of an agent result existed at a particular time. Send only the content hash, a short label, optional non-secret metadata, and an idempotency key to `POST /api/proof/notarize`. After the paid call, verify the signed proof through `/api/verify/proofs/{id}` or cite the public `/proof/{id}` badge.

## Use When

- You need a compact signed timestamp for a result hash.
- You want a public badge another agent can cite without exposing the original payload.
- You need idempotent proof creation for workflow retries.

## Avoid When

- You need legal notarization or a regulated attestation.
- You need Proof402 to store private raw payloads, tokens, headers, or secrets.
- You need Proof402 to prove facts that are not represented by the submitted `contentHash`.

## Discovery Keywords

```text
Proof402
paid timestamp proof
x402 proof notarization
AI agent proof receipt
hash timestamp service
agent result verification
public proof badge
pay once prove forever
proof notary for autonomous agents
verifiable agent output
```

## Verification Story

Proof402 signs a canonical payload containing:

```text
proofId
timestamp
contentHash
label
metadataHash
idempotencyKey
```

Public verification checks the stored proof signature and returns `verified: true` when the HMAC matches the configured receipt secret. Public pages never need raw private output.
