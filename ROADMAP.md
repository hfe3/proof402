# Proof402 Roadmap

This roadmap is public and intentionally high level. It does not include
private customer data, wallet material, deployment secrets, or internal account
credentials.

## Now

- Keep the mainnet x402 proof primitive stable.
- Keep the v0.2 dashboard and proof search stable:
  - `GET /dashboard`
  - `GET /api/dashboard/summary`
  - `GET /api/proofs/search`
- Keep account-scoped API keys and webhook receipts admin-only.
- Keep public discovery healthy:
  - `GET /openapi.json`
  - `GET /.well-known/x402`
  - `GET /marketplace.json`
  - `GET /llms.txt`
- Keep proof creation idempotent and verification public.
- Keep paid smoke manual unless an operator explicitly approves spend-bearing
  automation.

## Current Product Version: 0.2.0

### Dashboard

- Recent proof explorer with filters by proof id, label, content hash, metadata
  hash, account id, API key id, and idempotency key.
- Direct links to proof badge pages and verify API responses.
- Redaction-first UI that never asks for raw private payloads.

### Proof Search

- Search by proof id, content hash, metadata hash, label, account id, API key
  id, and idempotency key.
- Public-safe proof evidence responses.
- Stable created-time ordering with bounded limits.

### Accounts And API Keys

- Optional account layer for teams and agents.
- API keys scoped to proof creation context through `X-Proof402-Key`.
- Raw API keys shown once and stored only as hashes.
- Admin operations protected by `X-Proof402-Admin-Key`.
- Public docs that make clear API keys are not wallet keys.

### Webhook Receipts

- Optional webhook delivery after a proof is created.
- Signed webhook payloads.
- Webhook test endpoint and delivery logs.
- Delivery history stores payload hashes and response metadata, not raw private
  payload bodies.

## Next Product Version

- Dashboard auth and operator sessions.
- Per-key rate limits and quotas.
- Webhook retry queue with scheduled backoff.
- Pagination cursors for larger proof/account datasets.
- SDK examples for JavaScript and Python agents.

## Later

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
