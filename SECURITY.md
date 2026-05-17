# Security Policy

Proof402 is a payment-enabled proof service. Treat payment configuration,
receipt signing secrets, database URLs, CDP credentials, wallet files, and
AgentCash account data as private operational material.

## Supported Versions

Only the current `main` branch and the active Vercel deployment are supported.
The public GitHub repository is supported together with the active production
deployment.

## Reporting a Vulnerability

Report vulnerabilities through GitHub Security Advisories when available, or
through the established operator channel. Do not include live secrets, wallet
private keys, CDP keys, database URLs, x402 payment headers, or raw private
customer payloads in an issue, pull request, commit, screenshot, or log excerpt.

## Secret Handling

- Never commit `.env`, `.env.*`, `data/`, `.vercel/`, wallet directories, private
  keys, certificates, AgentCash account files, or payment canary state.
- Keep `RECEIPT_SECRET` stable and private. When rotating it, issue a new
  `RECEIPT_KEY_ID` and preserve verification for older proofs through
  `RECEIPT_PREVIOUS_SECRETS`.
- Store production values only in Vercel Environment Variables or another
  managed secret store.
- Redact x402 payment headers and private request metadata from logs.
- GitHub Secret Protection is enabled for the public repository, but local
  `npm run security:scan` remains the release gate for tracked files.

## GitHub Security Controls

- Private vulnerability reporting is enabled.
- Dependency graph, Dependabot alerts, Dependabot security updates, and grouped
  security updates are enabled.
- Dependabot version updates are configured in `.github/dependabot.yml`.
- CodeQL code scanning is configured in `.github/workflows/codeql.yml`.
- The `main` branch has a classic protection rule; force pushes and branch
  deletions are not allowed by default.

## Release Verification

Run these checks before release changes and after any public deployment update:

```powershell
git status --short --ignored
npm test
npm run security:scan
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

`smoke:x402` validates the unpaid payment challenge. For a full paid smoke, use
AgentCash or another x402-capable buyer wallet with a strict per-request max
amount, then verify the returned proof through `/api/verify/proofs/{id}`.

Then confirm that tracked files contain no secret material.
