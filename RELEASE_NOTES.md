# Proof402 0.1.6 Release Notes

Proof402 0.1.6 is a launch checklist wording patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- The root launch checklist now reflects the live GitHub state: the canonical
  `hfe3/proof402` repository is public.
- The old "make public" instructions are now framed as guidance only for a
  future private fork or rebuild, not for ordinary Proof402 release work.
- Version consistency: runtime health, capabilities, OpenAPI metadata,
  marketplace JSON, package metadata, and brand docs now report `0.1.6`.

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
