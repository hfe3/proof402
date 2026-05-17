# Proof402

Proof402 is an x402-compatible timestamp/hash proof service for autonomous agents.

It creates a signed proof that a SHA-256 hash existed at a specific time. The service stores and publishes the hash, label, metadata hash, metadata keys, timestamp, and signature. It does not store or publish raw private payloads, headers, tokens, wallet secrets, or full metadata values.

## Local Run

```powershell
cd D:\Agents_402\proof402
npm install
npm run dev:demo
```

Open:

```text
http://127.0.0.1:4022/
http://127.0.0.1:4022/demo
http://127.0.0.1:4022/api/quickstart
```

## Production

```text
URL: https://proof402.vercel.app
Profile: mainnet
Network: eip155:8453
x402: enabled
Price: $0.005
Storage: Postgres
Paid endpoint: POST https://proof402.vercel.app/api/proof/notarize
```

Latest post-public paid AgentCash smoke test:

```text
Proof ID: proof_d8cfab2c1413f0f173967641
Proof page: https://proof402.vercel.app/proof/proof_d8cfab2c1413f0f173967641
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_d8cfab2c1413f0f173967641
Payment tx: 0x873efda606100f78e7464c6b66604c6dacb4f29fc39de6646e67f2e8bc1a9c7e
```

## Paid Primitive

```text
POST /api/proof/notarize
```

Request:

```json
{
  "contentHash": "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
  "label": "agent result hash",
  "metadata": {
    "agent": "research-bot",
    "taskId": "task_123"
  },
  "idempotencyKey": "proof-task-123"
}
```

Response:

```json
{
  "ok": true,
  "mode": "demo",
  "idempotentReplay": false,
  "proof": {
    "id": "proof_...",
    "verified": true,
    "timestamp": "2026-05-16T00:00:00.000Z",
    "contentHash": "sha256:...",
    "metadataHash": "sha256:...",
    "signature": "hmac-sha256:..."
  },
  "links": {
    "proof": "/proof/proof_...",
    "verify": "/api/verify/proofs/proof_..."
  }
}
```

## Free Endpoints

```text
GET /health
GET /openapi.json
GET /api/capabilities
GET /api/bazaar
GET /api/quickstart
GET /api/actions
GET /api/trust
GET /api/status
GET /llms.txt
GET /robots.txt
GET /sitemap.xml
GET /.well-known/security.txt
GET /api/proofs/recent
GET /api/proofs/{id}
GET /api/verify/proofs/{id}
GET /proof/{id}
```

## Profiles

Demo:

```powershell
npm run dev:demo
```

Testnet config path:

```powershell
$env:PAY_TO="0xYourReceivingWallet"
$env:RECEIPT_SECRET="replace-with-a-long-random-secret"
npm run dev:testnet
```

Mainnet config path:

```powershell
$env:PAY_TO="0xYourReceivingWallet"
$env:DATABASE_URL="postgres://..."
$env:RECEIPT_SECRET="replace-with-a-long-random-secret"
$env:CDP_API_KEY_ID="..."
$env:CDP_API_KEY_SECRET="..."
npm run dev:mainnet
```

Mainnet is deployed at `https://proof402.vercel.app`.

## Repository

```text
GitHub: https://github.com/hfe3/proof402
Visibility: public
License: MIT
CI: GitHub Actions runs npm ci, npm test, local demo smoke, and deploy-check
```

Release history is tracked in `CHANGELOG.md`. The public `0.1.0` release notes
are in `RELEASE_NOTES.md`.

## Verification

```powershell
npm test
npm run security:scan
npm run deploy:check -- http://127.0.0.1:4022
```

When testing an x402-protected deployment:

```powershell
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

`smoke:x402` validates the unpaid 402 challenge. A real paid smoke should be
run through AgentCash or another x402-capable buyer wallet with a strict
per-request max amount.

## AgentCash Discovery

Proof402 is discoverable through AgentCash from the production origin:

```powershell
npx agentcash discover https://proof402.vercel.app
npx agentcash check https://proof402.vercel.app/api/proof/notarize -m POST -b '{...}'
```

The production paid endpoint probes as x402 on Base mainnet (`eip155:8453`) for
`5000` micro-USDC (`$0.005`). The origin has also been added to the local
AgentCash origins list; restart the AgentCash MCP server for that local client
entry to appear in model context.

## Required Production Env Vars

```text
NODE_ENV=production
PROOF402_PROFILE=mainnet
PUBLIC_BASE_URL=https://proof402.vercel.app
X402_ENABLED=true
X402_NETWORK=eip155:8453
X402_PRICE=$0.005
PAY_TO=0x...
STORE_DRIVER=postgres
DATABASE_URL=postgres://...
RECEIPT_SECRET=...
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
```

## Local-only Files

Do not commit:

```text
.env
.env.local
.env.demo
.env.testnet
.env.mainnet
data/
wallets/
AgentCash account files
CDP secrets
private keys
payment canary automation
```

## Security

See `SECURITY.md` before reporting vulnerabilities. Do not include live
secrets, wallet material, payment headers, database URLs, or private payloads
in GitHub issues, commits, logs, or screenshots.

## Contributing

See `CONTRIBUTING.md` before opening issues or pull requests. Public reports
must use fake hashes and non-secret metadata only.

## License

Proof402 is licensed under the MIT License. See `LICENSE` and
`THIRD_PARTY_NOTICES.md`.
