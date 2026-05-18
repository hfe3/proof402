# Proof402 0.1.22 Release Notes

Proof402 0.1.22 is a public launch-pack documentation patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- Added `Brand/social-launch-pack.md` with public-safe posts, directory copy,
  reply copy, and launch links.
- Synchronized brand metadata with `GET /.well-known/x402` after the AgentCash
  discovery patch.
- Kept launch language explicit: timestamped hash proof, not legal
  notarization or factual-truth attestation.
- The checks remain unpaid: they do not settle a payment or create a new proof.

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
Proof ID: proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```
