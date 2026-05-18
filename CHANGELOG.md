# Changelog

All notable Proof402 changes are documented here.

## Unreleased

No unreleased changes yet.

## 0.1.23 - 2026-05-18

### Added

- Added `npm run monitor:production` for lightweight read-only post-launch
  checks.
- Added a scheduled GitHub Actions production monitor workflow.

## 0.1.22 - 2026-05-18

### Added

- Added `Brand/social-launch-pack.md` with public-safe announcement, directory,
  and reply copy.

### Changed

- Synchronized brand metadata and asset docs with `GET /.well-known/x402`.

## 0.1.21 - 2026-05-18

### Added

- Added OpenAPI `x-payment-info` metadata for the paid proof route so AgentCash
  can classify `POST /api/proof/notarize` as paid from discovery.
- Added `GET /.well-known/x402` as an x402 discovery fallback.

### Changed

- Expanded deploy and release checks to verify paid discovery metadata.

## 0.1.20 - 2026-05-18

### Changed

- Added Vercel platform headers so static public pages and API routes share the
  same security-header baseline in production.

## 0.1.19 - 2026-05-18

### Added

- Added baseline browser security headers for API and public-page responses.
- Hardened `npm run deploy:check` to verify CSP, frame denial, MIME sniffing
  protection, removal of `X-Powered-By`, referrer policy, permissions policy,
  and HSTS on HTTPS.

## 0.1.18 - 2026-05-18

### Changed

- Limited published source-control commit SHA metadata to Vercel runtime commit
  data so local and GitHub Actions test runs stay deterministic while
  production commit attestation remains strict.

## 0.1.17 - 2026-05-18

### Added

- Added public-safe source-control metadata to health, status, and trust
  responses.
- Hardened `npm run release:check` to require production source-control commit
  metadata to match the local release commit.

## 0.1.16 - 2026-05-18

### Changed

- Hardened `npm run release:check` to require both the GitHub Actions local
  smoke check and the CodeQL `Analyze JavaScript` check before a release is
  considered verified.

## 0.1.15 - 2026-05-18

### Added

- Added `npm run release:check` for post-release verification of the clean
  `main` checkout, current tag, GitHub Release, required GitHub check-runs, and
  live production metadata without settling a payment.

## 0.1.14 - 2026-05-18

### Added

- Added `npm run version:check` to enforce release-version consistency across
  package metadata, runtime config, marketplace metadata, brand docs, changelog,
  release notes, and launch checklist.

## 0.1.13 - 2026-05-18

### Added

- Added `npm run verify:local` and `npm run verify:production` operator bundles
  for repeatable local and production release verification.

## 0.1.12 - 2026-05-18

### Changed

- Added `npm run local:doctor` and `npm audit --omit=dev` to the GitHub Actions
  CI gate, PR checklist, and bug-report verification prompts.

## 0.1.11 - 2026-05-18

### Added

- Added `npm run local:doctor` to detect stale local Proof402 servers before
  trusting default-port demo checks.

## 0.1.10 - 2026-05-17

### Changed

- Hardened `npm run deploy:check` to validate production discovery metadata,
  version consistency, x402/mainnet settings, marketplace safety fields,
  repository status, and `security.txt`/sitemap contents.

## 0.1.9 - 2026-05-17

### Added

- Added `CODE_OF_CONDUCT.md` and linked it from contributor and launch docs for
  public community-health hardening.

## 0.1.8 - 2026-05-17

### Added

- Added `OPERATIONS.md` with production verification, release checks, incident
  triage, rollback, receipt-secret rotation, paid-smoke, and ADS browser
  hygiene guidance.

## 0.1.7 - 2026-05-17

### Changed

- Documented receipt key rotation, Postgres SSL, facilitator, rate limiting,
  retention, metadata, label, and logging environment variables.

## 0.1.6 - 2026-05-17

### Changed

- Updated launch checklist repository visibility wording now that the canonical
  GitHub repository is public.

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
