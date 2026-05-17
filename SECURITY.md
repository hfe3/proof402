# Security Policy

Proof402 is a payment-enabled proof service. Treat payment configuration,
receipt signing secrets, database URLs, CDP credentials, wallet files, and
AgentCash account data as private operational material.

## Supported Versions

Only the current `main` branch and the active Vercel deployment are supported.
The repository remains private until the launch checklist is complete.

## Reporting a Vulnerability

While the repository is private, report vulnerabilities directly to the
repository owner through the private GitHub repository or the established
operator channel. Do not include live secrets, wallet private keys, CDP keys,
database URLs, x402 payment headers, or raw private customer payloads in an
issue, pull request, commit, screenshot, or log excerpt.

For public launch, enable GitHub private vulnerability reporting or publish a
dedicated security contact before making the repository public.

## Secret Handling

- Never commit `.env`, `.env.*`, `data/`, `.vercel/`, wallet directories, private
  keys, certificates, AgentCash account files, or payment canary state.
- Keep `RECEIPT_SECRET` stable and private. When rotating it, issue a new
  `RECEIPT_KEY_ID` and preserve verification for older proofs through
  `RECEIPT_PREVIOUS_SECRETS`.
- Store production values only in Vercel Environment Variables or another
  managed secret store.
- Redact x402 payment headers and private request metadata from logs.

## Verification Before Public Release

Run these checks before changing repository visibility to public:

```powershell
git status --short --ignored
npm test
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

`smoke:x402` validates the unpaid payment challenge. For a full paid smoke, use
AgentCash or another x402-capable buyer wallet with a strict per-request max
amount, then verify the returned proof through `/api/verify/proofs/{id}`.

Then confirm that tracked files contain no secret material.
