# Proof402 0.1.5 Release Notes

Proof402 0.1.5 is an operational checklist patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- Launch and security checklists now include `npm audit --omit=dev` and
  `npx agentcash discover https://proof402.vercel.app --format json`.
- Paid smoke guidance now clearly distinguishes unpaid x402 challenge checks
  from real paid smoke tests, and requires explicit operator approval for any
  paid max spend.
- ADS browser hygiene is documented: close only temporary verification tabs and
  leave operator dashboard, wallet, extension, offscreen, and service-worker tabs
  alone.
- Version consistency: runtime health, capabilities, OpenAPI metadata,
  marketplace JSON, package metadata, and brand docs now report `0.1.5`.

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
npm audit --omit=dev
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
npx agentcash discover https://proof402.vercel.app --format json
```

The latest post-public paid AgentCash smoke remains:

```text
Proof ID: proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```
