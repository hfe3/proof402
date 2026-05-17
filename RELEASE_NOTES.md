# Proof402 0.1.4 Release Notes

Proof402 0.1.4 is a discovery consistency patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- `/api/bazaar`, `/api/actions`, `/api/quickstart`, `/api/trust`, and
  `/api/status` now consistently point agents to the marketplace page,
  marketplace JSON, status summary, llms.txt, and public safety files.
- README and brand listing metadata now include `/marketplace`,
  `/marketplace.json`, `/api/status`, `robots.txt`, `sitemap.xml`, and
  `security.txt` where useful for marketplace and directory crawlers.
- Version consistency: runtime health, capabilities, OpenAPI metadata,
  marketplace JSON, package metadata, and brand docs now report `0.1.4`.
- Verification: production deploy-check passes, unpaid x402 smoke passes,
  local tests pass, dependency audit passes, and secret scanning passes.

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
```

The latest post-public paid AgentCash smoke remains:

```text
Proof ID: proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```
