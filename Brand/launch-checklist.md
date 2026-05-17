# Proof402 Brand Launch Checklist

## Before GitHub

- Confirm `.env`, `data/`, `.vercel/`, wallet files, key files, and local payment automation are ignored.
- Commit `Brand/` docs and public-safe assets only.
- Do not commit generated local proof store data.
- Do not commit screenshots containing secrets, dashboard tokens, or database URLs.

## Before Marketplace Listing

- Confirm public URL: `https://proof402.vercel.app`.
- Confirm `/api/capabilities`, `/api/bazaar`, `/api/quickstart`, `/api/actions`, and `/llms.txt` load.
- Confirm unpaid `POST /api/proof/notarize` returns `402 Payment Required`.
- Confirm copy says "timestamped hash proof", not "legal notarization".
- Confirm examples use fake hashes and non-secret metadata.
- Use `Brand/marketplace-listing.md` as the public-safe listing source.
- Check `https://proof402.vercel.app/marketplace` and `https://proof402.vercel.app/marketplace.json`.
- Use SVG assets from `Brand/` first; export PNG copies only when a directory requires bitmap uploads.

## Before Social Announcement

- Use the line: `Pay once. Prove forever.`
- Link to `https://proof402.vercel.app`.
- Mention that Proof402 hashes private results locally and publishes proof badges.
- Avoid implying Proof402 stores private payloads.

## Before New Visual Work

- Use colors from `Brand/design-tokens.css`.
- Use the SVG mark from `Brand/proof402-mark.svg`.
- Keep UI quiet, precise, and information-dense.
- Do not use neon crypto visuals, gradient-only hero art, or oversized decorative cards.

## Current Verification Commands

```powershell
cd D:\Agents_402\proof402
npm test
npm run deploy:check -- https://proof402.vercel.app --expect-x402
npm run smoke:x402 -- https://proof402.vercel.app
```
