# Proof402 Brand Guide

## Positioning

Proof402 is not a flashy crypto product. It should feel like trustworthy agent infrastructure: precise, compact, sober, and useful under pressure.

Brand sentence:

```text
Hash locally. Prove publicly. Cite forever.
```

## Voice

Proof402 speaks like an infrastructure primitive:

- Clear before clever.
- Calm before excited.
- Specific before broad.
- Evidence before promises.

Use words like:

```text
proof
hash
timestamp
verify
badge
receipt
agent
idempotent
public
private
```

Avoid words like:

```text
guaranteed truth
legal notarization
trustless magic
unbreakable
secret storage
casino-style crypto hype
```

## Visual Mood

```text
Domain: agent infrastructure
Mood: quiet, verifiable, durable
Shape language: seal, stamp, ledger, hash line
Layout: dense but readable, not a marketing splash page
Card radius: 8px max
Primary motif: proof seal with hash line
```

## Logo

Current mark:

```text
Brand/proof402-mark.svg
public/proof402-mark.svg
```

The logo is a square dark mark containing a pale proof seal, green verification ring, black hash lines, and a red diagonal stamp/accent.

Usage:

- Use the full service name `Proof402` next to the mark for first-view contexts.
- Use mark-only only when the product name is already visible.
- Keep at least one mark-width of empty space around it.
- Do not recolor the mark for one-off pages.
- Do not place the mark on busy images.

## Color Palette

```text
Ink:       #111418
Muted:     #5d6570
Line:      #d7ded8
Paper:     #fbfaf6
Panel:     #ffffff
ProofGreen:#1f7a5c
StampRed:  #b64646
SealGold:  #b8872f
Code:      #182028
```

Use `Paper` as the main background and `Panel` for individual repeated cards or tools. Avoid blue/purple gradients and crypto-neon palettes.

## Typography

Preferred stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Monospace:

```css
font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
```

Typography rules:

- Use big type only for `Proof402` on the main hero.
- Keep dashboard/tool headings compact.
- Letter spacing is `0`.
- Do not scale font size with viewport width except via explicit responsive clamps on hero text.

## UI Rules

- Public pages should help agents understand route, price, JSON, and verification.
- Show the paid route clearly: `POST /api/proof/notarize`.
- Link to `/api/quickstart`, `/api/actions`, `/api/bazaar`, and `/openapi.json`.
- Use code blocks for request/response examples.
- Keep proof pages factual, not celebratory.
- Recent feeds should redact broad-feed signatures.

## Brand Do/Don't

Do:

- "Timestamped hash proof for autonomous agents."
- "Pay once. Prove forever."
- "Send hashes, not secrets."
- "Public proof badge for private work."

Do not:

- "Proof402 proves the truth of any claim."
- "Proof402 is legal notarization."
- "Upload private data and we store it safely."
- "Guaranteed trustless proof of everything."
