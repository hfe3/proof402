# Proof402 Monitoring Runbook

Use this file when configuring monitoring outside GitHub Actions. The built-in
GitHub scheduled monitor remains useful, but it is not a 24/7 uptime system and
should not be the only production signal.

## Goals

- Detect production downtime quickly.
- Detect x402 discovery regressions without spending money.
- Detect paid-route settlement failures through explicitly approved paid smoke
  only.
- Keep logs useful while avoiding secrets, payment headers, wallet data, raw
  payloads, and private metadata values.

## External Uptime Monitors

Create these monitors in an external uptime service such as Better Stack,
Checkly, UptimeRobot, Datadog Synthetic Monitoring, or another operator-owned
system.

### Health

```text
Name: Proof402 health
Method: GET
URL: https://proof402.vercel.app/health
Expected status: 200
Expected JSON:
  ok=true
  service=Proof402
  profile=mainnet
  x402Enabled=true
  network=eip155:8453
  price=$0.005
Frequency: 1 minute to 5 minutes
Alert after: 2 failed checks
```

### Public Status

```text
Name: Proof402 public status
Method: GET
URL: https://proof402.vercel.app/api/status
Expected status: 200
Expected JSON:
  repository.visibility=public
  repository.url=https://github.com/hfe3/proof402
  sourceControl.repository=hfe3/proof402
Frequency: 5 minutes
Alert after: 2 failed checks
```

### x402 Discovery

```text
Name: Proof402 x402 discovery
Method: GET
URL: https://proof402.vercel.app/.well-known/x402
Expected status: 200
Expected text: POST https://proof402.vercel.app/api/proof/notarize
Frequency: 5 minutes
Alert after: 2 failed checks
```

### Unpaid Challenge

This check confirms the paid route still returns a valid x402 challenge. It
must not include a payment header.

```text
Name: Proof402 unpaid x402 challenge
Method: POST
URL: https://proof402.vercel.app/api/proof/notarize
Headers:
  content-type: application/json
Body:
  {"contentHash":"sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc","label":"external unpaid monitor","metadata":{"monitor":"external"},"idempotencyKey":"external-unpaid-monitor"}
Expected status: 402
Expected body or header: x402 payment requirement
Frequency: 5 minutes to 15 minutes
Alert after: 2 failed checks
```

Do not configure the unpaid challenge monitor with wallet credentials or an
`X-PAYMENT` header.

### Recent Proof Feed

```text
Name: Proof402 recent proofs
Method: GET
URL: https://proof402.vercel.app/api/proofs/recent?limit=5
Expected status: 200
Expected JSON:
  ok=true
  redactionPolicy.rawPayloads=never published
Frequency: 5 minutes
Alert after: 3 failed checks
```

### Dashboard Summary

```text
Name: Proof402 dashboard summary
Method: GET
URL: https://proof402.vercel.app/api/dashboard/summary
Expected status: 200
Expected JSON:
  ok=true
  product.dashboard=true
  product.proofSearch=true
Frequency: 5 minutes
Alert after: 3 failed checks
```

Do not configure external uptime monitors with `X-Proof402-Admin-Key`,
`X-Proof402-Key`, wallet credentials, or payment headers.

## Paid Synthetic Checks

Paid synthetic checks are spend-bearing. Use them only when an operator
explicitly approves the amount, wallet, and schedule.

Recommended default:

```text
Schedule: manual only
Max amount: $0.005 per request
Network: Base mainnet
Evidence to record: proof id, proof URL, verify URL, transaction hash, timestamp
Never record: wallet secrets, payment headers, private payloads, database URLs
```

Latest operator-approved paid smoke evidence:

```text
Proof: proof_47a6f27da15a71a27e17194d
Verify: https://proof402.vercel.app/api/verify/proofs/proof_47a6f27da15a71a27e17194d
Proof page: https://proof402.vercel.app/proof/proof_47a6f27da15a71a27e17194d
Transaction: 0x13e39f0989f293eb03db1869416d37ec1e8817aeb2769a5ce3d8b3c266ee3770
Network: Base mainnet
Price: $0.005
Timestamp: 2026-05-18T04:33:14.619Z
```

## Vercel Logs

Proof402 already emits structured JSON logs for request status and unhandled
errors. Runtime logs are available through Vercel:

```powershell
npx vercel logs https://proof402.vercel.app --since 30m --expand
npx vercel logs https://proof402.vercel.app --status-code 500 --since 1h --expand
```

If configuring a Vercel Log Drain, send logs to an operator-owned sink such as
Better Stack, Datadog, Axiom, New Relic, or another managed log destination.

Current Better Stack setup:

```text
Uptime team: t544694
Monitors:
  Proof402 health
  Proof402 status API
  Proof402 x402 discovery
  Proof402 unpaid x402 challenge
Telemetry source: Proof402 Vercel HTTP logs
Telemetry source id: 2446913
Ingest host: s2446913.eu-fsn-3.betterstackdata.com
Vercel Log Drain: unavailable on the current Vercel team; Vercel returned 403.
Fallback: direct Better Stack HTTP logging via BETTER_STACK_LOGS_ENABLED=true.
```

Enable the direct logging fallback with Vercel environment variables:

```text
BETTER_STACK_LOGS_ENABLED=true
BETTER_STACK_INGEST_HOST=s2446913.eu-fsn-3.betterstackdata.com
BETTER_STACK_SOURCE_ID=2446913
BETTER_STACK_SOURCE_TOKEN=<Better Stack source token>
```

Log-drain rules:

- Do not log request bodies for paid proof creation.
- Do not log `X-PAYMENT`, `payment-required`, authorization headers, cookies,
  wallet material, or private metadata values.
- Do not log `X-Proof402-Admin-Key`, raw `X-Proof402-Key` values, webhook
  signing secrets, or raw webhook payload bodies.
- Keep proof ids, public verification URLs, status codes, durations, versions,
  and commit SHAs.
- Alert on repeated `5xx`, repeated `402` discovery failures, store connection
  errors, and facilitator boundary errors.

## Incident Response

When an external monitor alerts:

```powershell
npm run monitor:production
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npx agentcash discover https://proof402.vercel.app --format json
npx vercel logs https://proof402.vercel.app --since 30m --expand
```

Escalate to rollback only when production behavior is broken for users or paid
settlement is failing after the route handler succeeds. For malformed client
JSON, the expected response is `400 invalid_json`, not an incident.
