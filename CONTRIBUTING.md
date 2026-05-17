# Contributing to Proof402

Proof402 is a payment-enabled proof service. Contributions are welcome, but
public issues, pull requests, logs, and screenshots must never include live
secrets, payment headers, wallet material, database URLs, CDP credentials, or
raw private customer payloads.

## Local Setup

```powershell
cd D:\Agents_402\proof402
npm install
npm run dev:demo
```

Open `http://127.0.0.1:4022/health` to confirm the demo server is running.

## Required Checks

Run these before opening a pull request:

```powershell
npm test
npm run security:scan
npm run deploy:check -- http://127.0.0.1:4022
```

For production-facing changes, also verify the public deployment after merge:

```powershell
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

`smoke:x402` validates the unpaid payment challenge. A real paid smoke should
only be run with an explicit per-request max amount and operator approval.

## Pull Request Scope

- Keep changes small and focused.
- Do not commit `.env`, `.env.*`, `data/`, `.vercel/`, wallet folders, local
  AgentCash files, private keys, certificates, or payment automation state.
- Update tests when changing API behavior, proof signing, storage, x402
  handling, or public discovery metadata.
- Keep public examples non-secret and reproducible.

## Security Reports

Use GitHub private vulnerability reporting when available. Do not disclose
active vulnerabilities with exploit details in public issues.
