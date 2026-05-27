# Proof402 0.2.1 Release Notes

Proof402 0.2.1 is a production evidence refresh and maintenance release for
the already-working x402-compatible timestamp/hash proof primitive. It keeps the
paid proof route, dashboard, proof search, accounts, API keys, webhook receipts,
price, and Base mainnet configuration unchanged.

## Highlights

- Refreshed the production dependency lockfile through `npm audit fix`.
- Updated `viem`, `ws`, `qs`, and `ox` transitive dependency versions to clear
  the production `npm audit --omit=dev` advisories.
- Rechecked public production discovery surfaces, unpaid x402 challenge smoke,
  and AgentCash discovery metadata before updating public evidence references.
- No secrets, wallets, local stores, API key raw values, webhook signing
  secrets, payment headers, or Vercel project state are included in this
  release.

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
