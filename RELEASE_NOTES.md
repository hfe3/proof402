# Proof402 0.1.7 Release Notes

Proof402 0.1.7 is an environment documentation patch for the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- `.env.example` now documents receipt key rotation through
  `RECEIPT_PREVIOUS_SECRETS`.
- Production env docs now include Postgres SSL, facilitator URL, receipt key ID,
  retention, metadata and label limits, rate limiting, and logging controls.
- Security guidance now states the `RECEIPT_PREVIOUS_SECRETS` format and keeps
  old receipt secrets in managed environment variables only.
- Version consistency: runtime health, capabilities, OpenAPI metadata,
  marketplace JSON, package metadata, and brand docs now report `0.1.7`.

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
