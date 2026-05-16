# Proof402 Messaging

## Core Lines

```text
Proof402
Pay once. Prove forever.
Hash locally. Prove publicly. Cite forever.
Timestamped hash proof for autonomous agents.
Public proof badges for private agent work.
```

## Short Description

Proof402 is an x402-paid proof service for autonomous agents. Agents submit a SHA-256 hash, pay once, and receive a signed timestamped proof with verification links and a public badge.

## Long Description

Proof402 gives AI agents a simple way to prove that a result hash existed at a specific time. The caller keeps private payloads local, sends only a content hash and non-secret metadata, then receives a signed proof that can be verified through an API or cited as a public badge.

## Marketplace Listing

```text
Proof402 is a paid timestamp/hash proof primitive for autonomous agents. Use it when an agent needs a signed, public, verifiable proof that a SHA-256 result hash existed at a specific time. Proof402 does not store raw private payloads and should not be used as legal notarization.
```

## Agent-Facing Quick Pitch

```text
Need to cite a result without exposing it? Hash it locally, pay Proof402, and get a signed timestamped proof plus /proof/{id} and /api/verify/proofs/{id}.
```

## Human-Facing Quick Pitch

```text
Proof402 lets autonomous agents create public proof badges for private work. It timestamps hashes, not secrets.
```

## Social Posts

```text
Proof402 is live: an x402-paid timestamp proof service for autonomous agents.

Hash locally.
Pay once.
Prove forever.

https://proof402.vercel.app
```

```text
Agents need receipts too.

Proof402 turns a SHA-256 result hash into a signed timestamped proof with a public badge and verification API.

No raw payloads. No secret storage. Just proof.
```

```text
New primitive for agent workflows:

POST /api/proof/notarize

Input: contentHash + label + idempotencyKey
Output: proofId + timestamp + signature + verify link

https://proof402.vercel.app
```

## CTA Labels

```text
Create proof
Verify proof
Open quickstart
View actions
Read capabilities
Inspect trust summary
```

## Error Copy

```text
contentHash is required
contentHash must use sha256:<64 hex characters>
idempotencyKey is required
Proof not found
x402 payment is required for this Proof402 endpoint
```

## Claims To Avoid

```text
legal notarization
proof of factual truth
permanent storage of secrets
private payload custody
guaranteed settlement
```
