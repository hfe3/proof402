# Proof402 Operations Runbook

Use this runbook for routine production checks, release verification, incident
triage, rollback decisions, and receipt-secret rotation. Keep live secrets,
wallet files, payment headers, database URLs, and private payloads out of this
file, issues, pull requests, logs, screenshots, and release notes.

## Production Facts

```text
Origin: https://proof402.vercel.app
GitHub: https://github.com/hfe3/proof402
Paid endpoint: POST /api/proof/notarize
Network: Base mainnet, eip155:8453
Price: $0.005
Storage: Postgres
```

## Routine Verification

Run from `D:\Agents_402\proof402`:

```powershell
git status --short --ignored
npm run verify:local
npm run verify:production
npm run monitor:production
```

`smoke:x402` is unpaid. It checks the `402 Payment Required` challenge and does
not settle a payment. Run a real paid smoke only after explicit operator
approval for the maximum spend.

For local demo work, `local:doctor` verifies that the running `4022` service is
from the current checkout. If it reports a stale version, stop the old local
process or start the current checkout on another `PORT` and matching
`PUBLIC_BASE_URL`.

After a tag, GitHub Release, CI run, and production deployment are in place,
run the post-release gate:

```powershell
npm run release:check
```

`monitor:production` is a lightweight read-only monitor for scheduled and manual
post-launch checks. It verifies production metadata, OpenAPI paid discovery,
`/.well-known/x402`, recent proof feed availability, and the unpaid x402
challenge. It does not settle a payment or create a proof.

For monitoring outside GitHub Actions, use `MONITORING.md`. External monitors
should use read-only endpoints and unpaid 402 challenge checks unless the
operator explicitly approves a spend-bearing synthetic transaction.

## Release Verification

Before tagging:

- Confirm `CHANGELOG.md` has the intended release entry.
- Confirm `RELEASE_NOTES.md` matches the tag being prepared.
- Run `npm run version:check` to confirm package, runtime, marketplace JSON,
  brand docs, changelog, release notes, and launch checklist share the same
  version.
- Run `npm run local:doctor -- http://127.0.0.1:4022` before trusting local
  demo results.
- Prefer `npm run verify:local` and `npm run verify:production` when preparing
  releases; they run the routine command bundle in a fixed order.
- Run the routine verification commands above.
- Confirm `git status --short --ignored` shows only expected ignored local
  files such as `.env`, `.vercel/`, `data/`, `node_modules/`, and logs.

After pushing:

- Confirm Vercel production is `READY`.
- Confirm GitHub Actions CI and CodeQL are `success`.
- Confirm live `/health`, `/api/capabilities`, `/openapi.json`, and
  `/marketplace.json` report the new version; `/health` and `/api/status`
  should also expose the deployed Git commit SHA.
- Confirm `npm run deploy:check` passes the baseline security-header checks for
  `/health` and the public home page.
- Confirm `npm run monitor:production` passes without payment.
- Publish the GitHub Release for the tag and verify it is not a draft.
- Run `npm run release:check` after the release exists. It checks the clean
  `main` checkout, current tag, GitHub Release, required GitHub Actions and
  CodeQL check-runs, production commit metadata, and production runtime
  metadata without settling a payment.
- If ADS profile 48 is used, close only the temporary tab opened for the check
  and confirm no temporary `about:blank`, release, commit, or Actions tab
  remains.

## Incident Triage

Start with read-only checks:

```powershell
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
npx agentcash discover https://proof402.vercel.app --format json
npm run monitor:production
```

Then inspect:

- Vercel deployment state and runtime logs.
- GitHub Actions and CodeQL status for the latest `main` commit.
- `/health` for profile, x402, store, observability, and rate-limit state.
- `/api/status` and `/api/trust` for public configuration summaries.
- `/api/proofs/recent` for proof-feed availability without exposing raw
  payloads.

Do not paste payment headers, secrets, database URLs, wallet material, raw
payloads, or private metadata into public issues or chats.

## Rollback

Prefer fixing forward for documentation-only issues. For production-impacting
regressions, rollback through Vercel to the last known good production
deployment, then verify:

```powershell
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
npx agentcash discover https://proof402.vercel.app --format json
```

After rollback, open a follow-up issue or commit with:

- The bad deployment id.
- The restored deployment id.
- The verification commands that passed.
- A redacted description of the failure.

## Receipt Secret Rotation

`RECEIPT_SECRET` signs new proofs. Do not rotate it casually.

When rotation is required:

- Generate a new long random `RECEIPT_SECRET` outside the repository.
- Set a new `RECEIPT_KEY_ID`.
- Move the previous key into `RECEIPT_PREVIOUS_SECRETS` using the format
  `old-key-id:old-secret,older-key-id:older-secret`.
- Store all values only in Vercel Environment Variables or another managed
  secret store.
- Redeploy production.
- Verify an old proof and a new proof through `/api/verify/proofs/{id}`.

Never commit real receipt secrets or previous-secret values.

## Paid Smoke

Paid smoke is optional and spend-bearing. Use it only when the operator approves
the maximum amount for that specific run. After paid smoke, record only public
proof id, verify URL, proof URL, tx hash, network, price, and timestamp. Do not
record wallet secrets, payment headers, or private request payloads.

Latest operator-approved paid smoke:

```text
Proof: proof_47a6f27da15a71a27e17194d
Verify: https://proof402.vercel.app/api/verify/proofs/proof_47a6f27da15a71a27e17194d
Proof page: https://proof402.vercel.app/proof/proof_47a6f27da15a71a27e17194d
Transaction: 0x13e39f0989f293eb03db1869416d37ec1e8817aeb2769a5ce3d8b3c266ee3770
Network: Base mainnet
Price: $0.005
Timestamp: 2026-05-18T04:33:14.619Z
```
