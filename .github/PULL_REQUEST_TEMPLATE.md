## Summary

Describe the change and why it is needed.

## Verification

- [ ] `npm test`
- [ ] `npm run local:doctor -- http://127.0.0.1:4022`
- [ ] `npm run security:scan`
- [ ] `npm audit --omit=dev`
- [ ] `npm run deploy:check -- http://127.0.0.1:4022`
- [ ] Production-facing change: `npm run deploy:check -- https://proof402.vercel.app --expect-x402`
- [ ] Production-facing x402 change: unpaid `npm run smoke:x402 -- https://proof402.vercel.app`

## Safety

- [ ] No `.env`, wallet material, payment headers, database URLs, CDP secrets, or private payloads are included.
- [ ] Public examples use fake hashes and non-secret metadata.
- [ ] API, storage, proof signing, or x402 behavior changes include tests.
