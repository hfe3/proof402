# Proof402 Marketplace Listing Kit

This file is a public-safe listing source for marketplaces, agent directories,
and x402 discovery catalogs. It contains no secrets, wallet material, database
URLs, dashboard screenshots, or private payload examples.

## Listing Fields

```text
Name: Proof402
Version: 0.1.5
Tagline: Pay once. Prove forever.
Category: agent-infrastructure
Short description: Timestamped hash proof for autonomous agents.
Public URL: https://proof402.vercel.app
Paid action: POST /api/proof/notarize
Price: $0.005
Network: Base mainnet, eip155:8453
Payment scheme: exact
Verification API: GET /api/verify/proofs/{id}
Proof badge: GET /proof/{id}
```

## Listing Description

Proof402 is a paid timestamp/hash proof primitive for autonomous agents. Use it
when an agent needs a signed, public, verifiable proof that a SHA-256 result hash
existed at a specific time. Proof402 does not store raw private payloads and
should not be used as legal notarization.

## Buyer Value

- Agents can cite a durable public proof badge without revealing the original
  private result.
- Workflows can retry safely with `idempotencyKey`.
- Other agents and humans can verify the proof through a free API endpoint.
- Discovery endpoints are free, machine-readable, and safe to crawl.

## Public Discovery URLs

```text
https://proof402.vercel.app/health
https://proof402.vercel.app/openapi.json
https://proof402.vercel.app/api/capabilities
https://proof402.vercel.app/api/bazaar
https://proof402.vercel.app/api/quickstart
https://proof402.vercel.app/api/actions
https://proof402.vercel.app/api/trust
https://proof402.vercel.app/api/status
https://proof402.vercel.app/llms.txt
https://proof402.vercel.app/marketplace
https://proof402.vercel.app/marketplace.json
https://proof402.vercel.app/robots.txt
https://proof402.vercel.app/sitemap.xml
https://proof402.vercel.app/.well-known/security.txt
```

## API Example

Request:

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

Response shape:

```json
{
  "ok": true,
  "mode": "x402",
  "idempotentReplay": false,
  "proof": {
    "id": "proof_...",
    "verified": true,
    "timestamp": "2026-05-17T00:00:00.000Z",
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

## Assets

```text
Brand/proof402-mark.svg
Brand/proof402-wordmark.svg
Brand/proof402-marketplace-banner.svg
Brand/proof402-proof-badge-example.svg
public/proof402-social.svg
```

## Safety Copy

Use:

```text
Proof402 timestamps hashes, not private payloads.
Proof402 creates signed proof receipts for submitted content hashes.
Proof402 verification confirms the stored proof signature and timestamp payload.
```

Avoid:

```text
Proof402 stores your secrets.
Proof402 is legal notarization.
Proof402 proves the factual truth of a claim.
```
