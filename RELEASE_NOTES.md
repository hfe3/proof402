# Proof402 0.1.26 Release Notes

Proof402 0.1.26 adds Better Stack production monitoring and a safe logging
fallback for the x402-compatible timestamp/hash proof service.

## Highlights

- Better Stack uptime monitors are configured for health, status, x402
  discovery, and unpaid `402` challenge checks.
- Better Stack Telemetry source `2446913` is configured for Proof402 logs.
- Vercel Log Drains are unavailable on the current Vercel team, so Proof402 now
  supports direct Better Stack HTTP logging via env vars.
- `/health` reports Better Stack logging state without exposing tokens.
- No secrets, wallets, local stores, source tokens, payment headers, or Vercel
  project state are included in the release.

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
