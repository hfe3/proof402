# Proof402 Launch Checklist

Use this checklist for the public launch and post-launch verification.

## Current State

- GitHub repository: `https://github.com/hfe3/proof402`
- Repository visibility: public after final launch approval
- Production URL: `https://proof402.vercel.app`
- Paid endpoint: `POST /api/proof/notarize`
- Price: `$0.005`
- Network: Base mainnet, `eip155:8453`
- Storage: Postgres in production, JSON store for local demo
- License: MIT
- GitHub Actions: latest `main` CI run must be green before and after public launch
- Branch protection: classic `main` rule enabled; force pushes and branch
  deletions are not allowed by default
- GitHub security: private vulnerability reporting, dependency graph,
  Dependabot alerts, Dependabot security updates, grouped security updates, and
  Secret Protection are enabled
- Dependabot version updates: configured in `.github/dependabot.yml`
- Code scanning: CodeQL workflow configured in `.github/workflows/codeql.yml`
- Community health: `CONTRIBUTING.md`, pull request template, and issue
  templates are configured with no-secrets guidance
- Release: `CHANGELOG.md`, `RELEASE_NOTES.md`, `v0.1.2` tag are prepared
- AgentCash discovery: production origin registered and added locally; paid
  endpoint probes as x402 on Base mainnet for `5000` micro-USDC
- Public sharing metadata: Open Graph/Twitter tags and `proof402-social.svg`
  are configured on public pages
- Vercel GitHub integration: connected to `hfe3/proof402`; production deploys
  are triggered from pushes to `main`
- Latest post-public paid AgentCash smoke: `proof_d8cfab2c1413f0f173967641`,
  transaction `0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e`

## Required Checks

Run locally from `D:\Agents_402\proof402`:

```powershell
git status --short --ignored
npm test
npm run security:scan
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

Then run one real paid smoke through AgentCash or another x402-capable buyer
wallet with a strict per-request max amount. Verify the returned proof through:

```text
GET https://proof402.vercel.app/api/verify/proofs/{id}
GET https://proof402.vercel.app/proof/{id}
```

## Secret Review

Confirm none of these are tracked by Git:

- `.env`, `.env.*` except committed examples
- `data/`
- `.vercel/`
- `node_modules/`
- wallet directories or AgentCash account files
- private keys, certificates, tokens, CDP secrets, database URLs
- local canary or settlement automation state

Production secrets must stay only in Vercel Environment Variables or another
managed secret store.

## GitHub Review

- GitHub Actions CI is green on `main`.
- Branch protection is enabled for `main`.
- `SECURITY.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` are present.
- `CONTRIBUTING.md`, issue templates, and pull request template are present.
- `CHANGELOG.md` and `RELEASE_NOTES.md` are present before tagging a public
  release.
- `npx agentcash discover https://proof402.vercel.app` finds the OpenAPI
  surface, and `agentcash check` with a valid body reports payment required for
  `POST /api/proof/notarize`.
- Static public pages, `llms.txt`, and pricing copy match the production
  `$0.005` price.
- The README links to the production URL, paid endpoint, proof example, verify
  endpoint, and security policy.
- Repository visibility is public only after this checklist is complete.

## Vercel Review

- `https://proof402.vercel.app/health` reports `profile=mainnet` and
  `x402Enabled=true`.
- `https://proof402.vercel.app/api/status` reports repository visibility as
  `public`.
- Environment Variables are configured in Vercel, not committed to GitHub.
- Add the GitHub Login Connection in Vercel:
  `https://vercel.com/account/settings/login-connections`
- Install or configure the Vercel GitHub App so it has access to the
  `hfe3/proof402` repository. Verify in GitHub:
  `https://github.com/hfe3/proof402/settings/installations`
- Confirm this project is connected to the repository:

```powershell
npx vercel git connect git@github.com:hfe3/proof402.git
```

- Push a harmless docs commit and confirm the Vercel deployment is triggered by
  GitHub rather than by a manual `vercel deploy`.

## Make Public

Only after every item above is complete:

1. Open GitHub repository settings.
2. Go to `Settings` -> `General` -> `Danger Zone`.
3. Use `Change repository visibility`.
4. Confirm `Make public`.
5. Re-run the required checks and paid smoke once after visibility changes.
