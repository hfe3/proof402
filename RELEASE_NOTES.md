# Proof402 0.1.1 Release Notes

Proof402 0.1.1 is a post-launch discovery and public-sharing patch for the
x402-compatible timestamp/hash proof service for autonomous agents.

## Highlights

- AgentCash discovery: the production origin is registered and added to the
  local AgentCash origins list for agent-client context.
- Public sharing: public pages now include Open Graph/Twitter metadata and the
  `proof402-social.svg` preview image.
- Price consistency: static pricing pages and `llms.txt` now match the live
  production price of `$0.005`.
- Launch posture: CI, CodeQL, Vercel deploy-check, unpaid x402 smoke, and local
  secret scanning pass on the release commit.

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
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

The latest post-public paid AgentCash smoke produced:

```text
Proof ID: proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```
