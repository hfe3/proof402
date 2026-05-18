# Proof402 Roadmap

This roadmap is public and intentionally high level. It does not include
private customer data, wallet material, deployment secrets, or internal account
credentials.

## Now

- Keep the mainnet x402 proof primitive stable.
- Keep public discovery healthy:
  - `GET /openapi.json`
  - `GET /.well-known/x402`
  - `GET /marketplace.json`
  - `GET /llms.txt`
- Keep proof creation idempotent and verification public.
- Keep paid smoke manual unless an operator explicitly approves spend-bearing
  automation.

## Next Product Version

### Dashboard

- Recent proof explorer with filters by label, timestamp, metadata keys, and
  verification status.
- Direct links to proof badge pages and verify API responses.
- Redaction-first UI that never asks for raw private payloads.

### Proof Search

- Search by proof id, content hash, metadata hash, label, and timestamp range.
- Public-safe export of proof evidence.
- Pagination and stable sort order for larger proof sets.

### Accounts And API Keys

- Optional account layer for teams and agents.
- API keys scoped to proof creation, verification, and admin operations.
- Rate limits per account or key.
- Public docs that make clear API keys are not wallet keys.

### Webhook Receipts

- Optional webhook delivery after a proof is created.
- Signed webhook payloads.
- Retry schedule with idempotent delivery ids.
- Webhook test endpoint and delivery logs.

## Later

- SDK examples for JavaScript and Python agents.
- Batch proof creation for agent runs that produce multiple result hashes.
- Public trust dashboard with release, monitor, and paid-smoke evidence.
- Optional owner-controlled custom domains.
- OpenTelemetry integration if request volume justifies trace-level debugging.

## Non-Goals

- Proof402 is not legal notarization.
- Proof402 does not prove the factual truth of the underlying claim.
- Proof402 should not store raw private payloads.
- Proof402 should not require private keys from API callers.

## Release Gates

Every product version should pass:

```powershell
npm run verify:local
npm run verify:production
npm run monitor:production
npm run release:check
```

Paid smoke remains optional and requires explicit max-spend approval.
