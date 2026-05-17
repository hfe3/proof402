# Changelog

All notable Proof402 changes are documented here.

## Unreleased

No unreleased changes yet.

## 0.1.5 - 2026-05-17

### Changed

- Updated launch and security checklists for the current release, dependency
  audit, AgentCash discovery, ADS browser hygiene, and explicit paid-smoke
  approval.

## 0.1.4 - 2026-05-17

### Changed

- Propagated marketplace and status discovery links across bazaar, actions,
  trust/status summaries, README, and brand listing metadata.

## 0.1.3 - 2026-05-17

### Added

- Added `/marketplace` and `/marketplace.json` to OpenAPI and capabilities
  discovery metadata.

## 0.1.2 - 2026-05-17

### Changed

- Updated GitHub Actions maintenance dependencies:
  - `actions/checkout` from `v4` to `v6`
  - `actions/setup-node` from `v4` to `v6`

### Added

- Added a public-safe marketplace listing kit and SVG assets in `Brand/`.
- Added public marketplace discovery surfaces: `/marketplace`, `/marketplace.json`, and public SVG listing assets.

## 0.1.1 - 2026-05-17

### Added

- Registered the production Proof402 origin with AgentCash discovery and added
  it to the local AgentCash origins list for agent-client context.
- Documented AgentCash discovery and x402 payment probing in the README and
  launch checklist.
- Added Open Graph/Twitter metadata and a social preview image for public pages.

### Fixed

- Updated static pricing and `llms.txt` production metadata from the local
  `$0.003` default to the live `$0.005` production price.

## 0.1.0 - 2026-05-17

Initial public release.

### Added

- x402-compatible paid notarization endpoint: `POST /api/proof/notarize`.
- Public proof pages and verification endpoints:
  - `GET /proof/{id}`
  - `GET /api/proofs/{id}`
  - `GET /api/verify/proofs/{id}`
  - `GET /api/proofs/recent`
- Free discovery endpoints for agents, OpenAPI clients, and trust review:
  - `GET /health`
  - `GET /openapi.json`
  - `GET /api/capabilities`
  - `GET /api/bazaar`
  - `GET /api/quickstart`
  - `GET /api/actions`
  - `GET /api/trust`
  - `GET /api/status`
  - `GET /llms.txt`
  - `GET /robots.txt`
  - `GET /sitemap.xml`
  - `GET /.well-known/security.txt`
- Signed proof receipts with canonical JSON hashing, `metadataHash`, and HMAC
  verification.
- Idempotent proof creation through `idempotencyKey`.
- Local JSON storage, memory storage for tests, and production Postgres path.
- Demo, testnet, and mainnet config profiles.
- Public pages for the service, agents, pricing, demo, actions, trust, recent
  proofs, and proof badges.
- Local verification scripts:
  - `npm test`
  - `npm run security:scan`
  - `npm run deploy:check`
  - `npm run smoke:x402`
- GitHub Actions CI, CodeQL scanning, Dependabot config, branch protection, and
  community issue/PR templates.

### Launch Verification

- Production URL: `https://proof402.vercel.app`
- Price: `$0.005`
- Network: Base mainnet, `eip155:8453`
- Latest post-public paid AgentCash smoke:
  - Proof: `proof_d8cfab2c1413f0f173967641`
  - Verify: `https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641`
  - Transaction: `0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e`
