# Proof402 Brand Folder

Date: 2026-05-16

This folder is the brand and agent-information source for Proof402. It is safe to share publicly: it contains no `.env`, wallet private keys, database credentials, CDP secrets, or payment automation files.

## Contents

- `agent-profile.md` - product, agent, API, discovery, and verification facts.
- `brand-guide.md` - visual identity, color, typography, layout, logo usage, and tone.
- `messaging.md` - copy blocks, marketplace text, social snippets, and buyer-facing language.
- `design-tokens.css` - CSS variables and utility tokens for future brand surfaces.
- `brand-card.json` - machine-readable brand and agent facts.
- `asset-index.md` - where assets live and how to use them.
- `launch-checklist.md` - brand/design checklist before GitHub, Vercel, or marketplace publication.
- `proof402-mark.svg` - local copy of the current Proof402 mark.
- `proof402-wordmark.svg` - wordmark for listings and README-style surfaces.
- `proof402-marketplace-banner.svg` - public-safe marketplace banner.
- `proof402-proof-badge-example.svg` - fake proof badge example for directories.
- `marketplace-listing.md` - copy, fields, links, assets, and safety language for marketplace submissions.

## Current Public Service

```text
Name: Proof402
Tagline: Pay once. Prove forever.
Public URL: https://proof402.vercel.app
Version: 0.1.17
Profile: mainnet
x402: enabled
Network: eip155:8453
Price: $0.005
Store: postgres
Paid endpoint: POST /api/proof/notarize
Verification: GET /api/verify/proofs/{id}
Proof badge: GET /proof/{id}
```

## Non-Negotiables

- Do not publish secrets, raw payloads, private headers, wallet keys, CDP keys, database URLs, or full `.env` values.
- Do not call Proof402 legal notarization.
- Do not imply Proof402 stores raw private content.
- Do not claim a proof verifies facts beyond the submitted `contentHash`.
- Do not use brand language that makes Proof402 sound speculative, casino-like, or hype-driven.

## One-Line Brand Essence

Proof402 is a calm infrastructure primitive for autonomous agents: hash locally, prove publicly, cite forever.
