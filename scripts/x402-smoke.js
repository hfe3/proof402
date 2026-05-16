const baseUrl = process.argv[2]?.replace(/\/+$/, "");

if (!baseUrl) {
  console.error("Usage: npm run smoke:x402 -- <base-url>");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/proof/notarize`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    contentHash: "sha256:7b3d0f0f7c847c28f20b8c17d38b4f0c7df3da7d8ddfb979a9dd4f9f1f2a35cc",
    label: "x402 smoke hash",
    metadata: { script: "x402-smoke" },
    idempotencyKey: `x402-smoke-${Date.now()}`
  })
});

if (response.status !== 402) {
  const text = await response.text();
  console.error(`Expected 402 Payment Required, got ${response.status}: ${text}`);
  process.exit(1);
}

const text = await response.text();
let body = {};
try {
  body = text ? JSON.parse(text) : {};
} catch {
  body = {};
}

const paymentRequired = response.headers.get("payment-required");
if (!body.accepts && !body.error && !paymentRequired) {
  console.error("402 response did not include x402 challenge details in JSON body or payment-required header.");
  process.exit(1);
}

if (paymentRequired) {
  const decoded = JSON.parse(Buffer.from(paymentRequired, "base64url").toString("utf8"));
  if (!decoded.accepts || !Array.isArray(decoded.accepts) || decoded.accepts.length === 0) {
    console.error("payment-required header did not include accepts.");
    process.exit(1);
  }
  if (!decoded.accepts.some((item) => item.network && item.payTo)) {
    console.error("payment-required accepts did not include network and payTo.");
    process.exit(1);
  }
}

console.log(`x402 smoke passed for ${baseUrl}`);
