# Proof402 Launch Checklist

Use this checklist before changing the GitHub repository from private to public.

## Current State

- GitHub repository: `https://github.com/hfe3/proof402`
- Repository visibility: private until final launch approval
- Production URL: `https://proof402.vercel.app`
- Paid endpoint: `POST /api/proof/notarize`
- Price: `$0.005`
- Network: Base mainnet, `eip155:8453`
- Storage: Postgres in production, JSON store for local demo
- License: MIT
- GitHub Actions: latest `main` CI run must be green before public launch
- Vercel GitHub integration: connected to `hfe3/proof402`; production deploys
  are triggered from pushes to `main`
- Latest paid AgentCash smoke: `proof_d5ca3894148e3c1dc73fd028`,
  transaction `0x6fcd55aec9f442e0b65815fb1f76c13b0e5213e75c00e61612ddd01f9f1e0b66`

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
- `SECURITY.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` are present.
- The README links to the production URL, paid endpoint, proof example, verify
  endpoint, and security policy.
- Repository is still private until this checklist is complete.

## Vercel Review

- `https://proof402.vercel.app/health` reports `profile=mainnet` and
  `x402Enabled=true`.
- `https://proof402.vercel.app/api/status` reports repository visibility as
  `private_until_launch`.
- Environment Variables are configured in Vercel, not committed to GitHub.
- Add the GitHub Login Connection in Vercel:
  `https://vercel.com/account/settings/login-connections`
- Install or configure the Vercel GitHub App so it has access to the private
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
