# Proof402 0.1.3 Release Notes

Proof402 0.1.3 is a marketplace discovery metadata patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- OpenAPI now lists `/marketplace` and `/marketplace.json`, so external
  discovery clients can find the public-safe listing surfaces directly.
- `/api/capabilities` now exposes `links.marketplace` and
  `links.marketplaceJson`.
- Version consistency: runtime health, capabilities, OpenAPI metadata,
  marketplace JSON, package metadata, and brand docs now report `0.1.3`.
- Verification: AgentCash discovery sees the marketplace endpoints, production
  deploy-check passes, unpaid x402 smoke passes, local tests pass, and secret
  scanning passes.

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
