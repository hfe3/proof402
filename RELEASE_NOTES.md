# Proof402 0.2.0 Release Notes

Proof402 0.2.0 adds the first product layer on top of the already-working
x402-compatible timestamp/hash proof primitive: dashboard, proof search,
accounts, API keys, and signed webhook receipts.

## Highlights

- Public dashboard at `/dashboard` with read-only proof search.
- `GET /api/dashboard/summary` and `GET /api/proofs/search` for agent/operator
  discovery.
- Admin-protected accounts and one-time API key creation.
- API-key authenticated proof creation through `X-Proof402-Key`.
- Signed webhook receipts for `proof.created` and `webhook.test`.
- Webhook delivery history stores status, payload hashes, and response metadata,
  not private payload bodies.
- Postgres-ready schema paths for proof search, accounts, API keys, webhooks,
  and delivery history.
- No secrets, wallets, local stores, API key raw values, webhook signing
  secrets, payment headers, or Vercel project state are included in the release.

## Production

```text
URL: https://proof402.vercel.app
Paid endpoint: POST /api/proof/notarize
Dashboard: GET /dashboard
Proof search: GET /api/proofs/search
Network: Base mainnet, eip155:8453
Price: $0.005
```

## Verification

```powershell
npm test
npm run security:scan
npm run version:check
npm audit --omit=dev
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
npm run release:check
npx agentcash discover https://proof402.vercel.app --format json
```

The latest paid AgentCash smoke before this release remains:

```text
Proof ID: proof_47a6f27da15a71a27e17194d
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_47a6f27da15a71a27e17194d
Payment tx: 0x13e39f0989f293eb03db1869416d37ec1e8817aeb2769a5ce3d8b3c266ee3770
```
