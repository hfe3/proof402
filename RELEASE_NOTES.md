# Proof402 0.1.25 Release Notes

Proof402 0.1.25 closes the post-launch optional work for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- Recorded the latest operator-approved paid AgentCash smoke evidence.
- Added `MONITORING.md` for external uptime checks, unpaid synthetic checks,
  Vercel log-drain setup, and alert routing.
- Added `Brand/external-publication.md` for account-bound social and directory
  publication.
- Added `ROADMAP.md` for dashboard, proof search, accounts, API keys, and
  webhook receipt follow-up work.
- Malformed JSON request bodies now return `400 invalid_json` instead of a
  generic internal error.
- No secrets, wallets, local stores, payment headers, or Vercel project state
  are included in the release.

## Production

```text
URL: https://proof402.vercel.app
Paid endpoint: POST /api/proof/notarize
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

The latest post-public paid AgentCash smoke remains:

```text
Proof ID: proof_47a6f27da15a71a27e17194d
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_47a6f27da15a71a27e17194d
Payment tx: 0x13e39f0989f293eb03db1869416d37ec1e8817aeb2769a5ce3d8b3c266ee3770
```
