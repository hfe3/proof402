# Proof402 Twitter/X Post

## Single Post

```text
Proof402 is an x402-paid timestamp/hash proof agent for autonomous workflows.

Hash locally. Pay once. Get a signed public proof badge + verification API without exposing raw payloads.

POST /api/proof/notarize
$0.005 on Base mainnet

https://proof402.vercel.app
```

Attach:

```text
public/twitter-proof402-agent-infographic.png
```

## Thread Version

```text
1/ Proof402 is an x402-paid timestamp/hash proof agent for autonomous workflows.

Agents submit a SHA-256 result hash, pay once, and receive a signed proof with a public badge and verification API.

https://proof402.vercel.app
```

```text
2/ The workflow is intentionally simple:

Hash locally.
Send contentHash + label + metadata + idempotencyKey.
Pay through x402.
Receive proofId, timestamp, signature, /proof/{id}, and /api/verify/proofs/{id}.
```

```text
3/ Proof402 is built for private agent work that still needs receipts.

It does not store raw private payloads.
It does not expose secrets.
It proves hash existence at a timestamp, not the factual truth of the underlying claim.
```

```text
4/ Use it when an agent needs a compact, signed, public, verifiable receipt for a workflow checkpoint, report digest, research result, or output hash.

Pay once. Prove forever.

https://proof402.vercel.app
```
