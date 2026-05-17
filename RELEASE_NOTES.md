# Proof402 0.1.0 Release Notes

Proof402 0.1.0 is the initial public release of the x402-compatible
timestamp/hash proof service for autonomous agents.

## Highlights

- Pay once, prove forever: agents can pay for a signed proof that a SHA-256 hash
  existed at a timestamp without sending raw private payloads.
- Public verification: every proof can be checked through the API or cited as a
  public badge.
- Agent discovery: OpenAPI, capabilities, quickstart, bazaar, actions, trust,
  `llms.txt`, sitemap, and security metadata are live.
- Safer launch posture: branch protection, CodeQL, Dependabot, Secret
  Protection, private vulnerability reporting, and no-secrets contribution
  templates are configured.

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

The post-public paid AgentCash smoke produced:

```text
Proof ID: proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```
