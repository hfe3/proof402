# Proof402 External Publication Tracker

Use this tracker for account-bound launch work. The copy is safe for public
posting, but actual posting must be done from the operator-owned account for
each destination.

## Current Public Evidence

```text
Home: https://proof402.vercel.app
GitHub: https://github.com/hfe3/proof402
Release: https://github.com/hfe3/proof402/releases/latest
Marketplace kit: https://proof402.vercel.app/marketplace
Machine-readable listing: https://proof402.vercel.app/marketplace.json
OpenAPI: https://proof402.vercel.app/openapi.json
x402 discovery: https://proof402.vercel.app/.well-known/x402
Trust: https://proof402.vercel.app/api/trust
Status: https://proof402.vercel.app/api/status
Proof example: https://proof402.vercel.app/proof/proof_47a6f27da15a71a27e17194d
Verify example: https://proof402.vercel.app/api/verify/proofs/proof_47a6f27da15a71a27e17194d
```

Latest operator-approved paid smoke:

```text
Proof: proof_47a6f27da15a71a27e17194d
Transaction: 0x13e39f0989f293eb03db1869416d37ec1e8817aeb2769a5ce3d8b3c266ee3770
Network: Base mainnet
Price: $0.005
Timestamp: 2026-05-18T04:33:14.619Z
```

## Submission Queue

| Destination | Status | Link or Action |
| --- | --- | --- |
| GitHub public repository | Done | https://github.com/hfe3/proof402 |
| GitHub latest release | Done | https://github.com/hfe3/proof402/releases/latest |
| Production site | Done | https://proof402.vercel.app |
| AgentCash discovery | Done | `npx agentcash discover https://proof402.vercel.app` |
| x402 well-known discovery | Done | https://proof402.vercel.app/.well-known/x402 |
| Marketplace listing page | Done | https://proof402.vercel.app/marketplace |
| Machine-readable marketplace JSON | Done | https://proof402.vercel.app/marketplace.json |
| Operator social post | Operator action | Use `Brand/social-launch-pack.md` primary post |
| Technical social post | Operator action | Use `Brand/social-launch-pack.md` technical post |
| Directory submission | Operator action | Use the summary below |
| External uptime service | Operator action | Configure `MONITORING.md` checks |
| Vercel Log Drain | Operator action | Configure in Vercel project settings |

## Directory Submission Fields

```text
Name: Proof402
Tagline: Pay once. Prove forever.
Category: agent infrastructure
URL: https://proof402.vercel.app
GitHub: https://github.com/hfe3/proof402
Paid route: POST /api/proof/notarize
Price: $0.005
Network: Base mainnet, eip155:8453
Description: Proof402 is an x402-paid timestamp/hash proof service for autonomous agents. Agents submit a SHA-256 hash and receive a signed timestamped proof with public verification links, without storing or publishing raw private payloads.
```

## Primary Post

```text
Proof402 is live.

Pay once. Prove forever.

Agents can submit a SHA-256 result hash, pay with x402, and receive a signed
timestamped proof with a public badge and verification API.

No raw payload storage. No secret custody.

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

Example proof:
https://proof402.vercel.app/proof/proof_47a6f27da15a71a27e17194d
```

## Safety Checklist

- Do not publish wallet secrets, payment headers, private payloads, `.env`
  values, database URLs, CDP keys, or dashboard screenshots.
- Say `timestamped hash proof`, not legal notarization.
- Say Proof402 proves hash existence at a timestamp, not factual truth.
- Use public proof links and fake or non-secret metadata examples.
- Use `Brand/` SVG assets or the PNG mockups in `public/` when a directory
  asks for images.
