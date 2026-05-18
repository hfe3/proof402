# Proof402 0.1.18 Release Notes

Proof402 0.1.18 is a CI-stability patch for production attestation metadata in the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- Kept public-safe source-control metadata on `/health`, `/api/status`, and
  `/api/trust`.
- Limited published commit SHA metadata to Vercel runtime commit data so local
  tests and GitHub Actions do not accidentally report CI-only `GITHUB_SHA`.
- `npm run release:check` still requires production to report the same Vercel
  commit SHA as the local release tag before the release is considered verified.
- The check remains unpaid: it does not settle a payment or create a new proof.

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
