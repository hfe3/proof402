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

Paid AgentCash smoke test:

```text
Proof ID: proof_c45f0b2e3f679172078e19d5
Proof page: https://proof402.vercel.app/proof/proof_c45f0b2e3f679172078e19d5
Verify API: https://proof402.vercel.app/api/verify/proofs/proof_c45f0b2e3f679172078e19d5
Payment tx: 0x6e6f35d1b7a3cfb2cba75a13305e9e68f619d59cd78ecde523e54deef40216c6
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
GET /llms.txt
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

## Verification

```powershell
npm test
npm run deploy:check -- http://127.0.0.1:4022
```

When testing an x402-protected deployment:

```powershell
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```

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
