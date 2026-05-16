const profile = process.argv[2] || "demo";

if (!["demo", "testnet", "mainnet"].includes(profile)) {
  console.error("Usage: node scripts/start-profile.js <demo|testnet|mainnet>");
  process.exit(1);
}

process.env.PROOF402_PROFILE = profile;

if (profile === "demo") {
  process.env.NODE_ENV ||= "development";
  process.env.PORT ||= "4022";
  process.env.HOST ||= "127.0.0.1";
  process.env.PUBLIC_BASE_URL ||= "http://127.0.0.1:4022";
  process.env.X402_ENABLED ||= "false";
  process.env.X402_NETWORK ||= "eip155:84532";
  process.env.STORE_DRIVER ||= "json";
  process.env.STORE_FILE ||= "data/proof402-store.json";
  process.env.RECEIPT_KEY_ID ||= "local-demo";
  process.env.RECEIPT_SECRET ||= "development-only-proof402-receipt-secret";
}

if (profile === "testnet") {
  process.env.NODE_ENV ||= "production";
  process.env.PORT ||= "4022";
  process.env.HOST ||= "127.0.0.1";
  process.env.X402_ENABLED ||= "true";
  process.env.X402_NETWORK ||= "eip155:84532";
  process.env.FACILITATOR_URL ||= "https://x402.org/facilitator";
  process.env.STORE_DRIVER ||= "json";
  process.env.STORE_FILE ||= "data/proof402-testnet-store.json";
}

if (profile === "mainnet") {
  process.env.NODE_ENV ||= "production";
  process.env.X402_ENABLED ||= "true";
  process.env.X402_NETWORK ||= "eip155:8453";
  process.env.FACILITATOR_URL ||= "https://api.cdp.coinbase.com/platform/v2/x402";
  process.env.STORE_DRIVER ||= "postgres";
}

const { startServer } = await import("../src/server.js");
startServer();
