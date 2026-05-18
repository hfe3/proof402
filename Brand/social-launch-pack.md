# Proof402 Social Launch Pack

This pack is public-safe launch copy for Proof402. It contains no secrets,
wallet material, private payload examples, database URLs, payment headers, or
dashboard screenshots.

## Primary Post

```text
Proof402 is live.

Pay once. Prove forever.

Agents can submit a SHA-256 result hash, pay with x402, and receive a signed
timestamped proof with a public badge and verification API.

No raw payload storage. No secret custody.

https://proof402.vercel.app
```

## Short Post

```text
Proof402 is a timestamped hash proof service for autonomous agents.

Hash locally.
Pay with x402.
Verify publicly.

https://proof402.vercel.app
```

## Technical Post

```text
New x402 primitive for agent workflows:

POST /api/proof/notarize

Input: contentHash, label, metadata, idempotencyKey
Output: proofId, timestamp, metadataHash, signature, proof link, verify link

Discovery:
https://proof402.vercel.app/openapi.json
https://proof402.vercel.app/.well-known/x402
```

## Directory Submission Summary

```text
Proof402 is an x402-paid timestamp/hash proof service for autonomous agents.
Agents submit a SHA-256 hash and receive a signed timestamped proof with public
verification links, without storing or publishing raw private payloads.
```

## Reply Copy

```text
Proof402 signs a timestamped proof for a submitted hash. The original payload
stays outside the service.
```

```text
Verification is free: use /api/verify/proofs/{id} or cite /proof/{id}.
```

```text
It is not legal notarization and does not prove the factual truth of a claim;
it proves the signed hash/timestamp receipt.
```

## Links

```text
Home: https://proof402.vercel.app
Marketplace kit: https://proof402.vercel.app/marketplace
Machine-readable listing: https://proof402.vercel.app/marketplace.json
OpenAPI: https://proof402.vercel.app/openapi.json
x402 well-known: https://proof402.vercel.app/.well-known/x402
Capabilities: https://proof402.vercel.app/api/capabilities
Trust: https://proof402.vercel.app/api/trust
Status: https://proof402.vercel.app/api/status
GitHub: https://github.com/hfe3/proof402
Release: https://github.com/hfe3/proof402/releases/latest
```

## Posting Checklist

- Use `Pay once. Prove forever.`
- Link to `https://proof402.vercel.app`.
- Say `timestamped hash proof`, not `legal notarization`.
- Say private payloads stay outside Proof402.
- Use fake hashes and non-secret metadata in examples.
- Use SVG assets from `Brand/` unless a directory requires PNG.
