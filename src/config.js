import "dotenv/config";

const DEFAULT_PORT = 4022;
const DEFAULT_TESTNET_NETWORK = "eip155:84532";
const DEFAULT_MAINNET_NETWORK = "eip155:8453";
const DEFAULT_TESTNET_FACILITATOR = "https://x402.org/facilitator";
const DEFAULT_MAINNET_FACILITATOR = "https://api.cdp.coinbase.com/platform/v2/x402";

function boolFromEnv(value, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function intFromEnv(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function keyedSecretsFromEnv(value) {
  if (!value) return {};
  return Object.fromEntries(
    String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const separator = item.indexOf(":");
        if (separator === -1) return [item, ""];
        return [item.slice(0, separator).trim(), item.slice(separator + 1).trim()];
      })
      .filter(([keyId, secret]) => keyId && secret)
  );
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function publicBaseUrlFromEnv(port) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return `http://127.0.0.1:${port}`;
}

const profile = process.env.PROOF402_PROFILE || process.env.NODE_ENV || "demo";
const facilitatorUrl =
  process.env.FACILITATOR_URL ||
  (profile === "mainnet" ? DEFAULT_MAINNET_FACILITATOR : DEFAULT_TESTNET_FACILITATOR);
const defaultNetwork = facilitatorUrl.includes("api.cdp.coinbase.com")
  ? DEFAULT_MAINNET_NETWORK
  : DEFAULT_TESTNET_NETWORK;
const port = intFromEnv(process.env.PORT, DEFAULT_PORT);
const defaultStoreFile =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : process.env.VERCEL
      ? "/tmp/proof402-store.json"
      : "data/proof402-store.json";
const storeFile = process.env.STORE_FILE || defaultStoreFile;
const storeDriver = String(
  process.env.STORE_DRIVER || (storeFile === ":memory:" ? "memory" : "json")
).toLowerCase();

export const config = {
  serviceName: "Proof402",
  version: "0.1.9",
  tagline: "Pay once. Prove forever.",
  profile,
  port,
  host: process.env.HOST || "127.0.0.1",
  publicBaseUrl: trimTrailingSlash(publicBaseUrlFromEnv(port)),
  x402Enabled: boolFromEnv(process.env.X402_ENABLED, false),
  x402Mock: boolFromEnv(process.env.X402_MOCK, false),
  x402Network: process.env.X402_NETWORK || defaultNetwork,
  x402Price: process.env.X402_PRICE || "$0.003",
  payTo: process.env.PAY_TO || "",
  facilitatorUrl,
  cdpApiKeyId: process.env.CDP_API_KEY_ID || "",
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET || "",
  receiptKeyId: process.env.RECEIPT_KEY_ID || "default",
  receiptSecret: process.env.RECEIPT_SECRET || "development-only-proof402-receipt-secret",
  receiptPreviousSecrets: keyedSecretsFromEnv(process.env.RECEIPT_PREVIOUS_SECRETS),
  storeDriver,
  storeFile,
  databaseUrl: process.env.DATABASE_URL || "",
  postgresSsl: boolFromEnv(process.env.POSTGRES_SSL, false),
  proofRetentionMs: intFromEnv(process.env.PROOF_RETENTION_MS, 90 * 24 * 60 * 60 * 1000),
  maxMetadataBytes: intFromEnv(process.env.MAX_METADATA_BYTES, 8192),
  maxLabelLength: intFromEnv(process.env.MAX_LABEL_LENGTH, 120),
  rateLimitEnabled: boolFromEnv(process.env.RATE_LIMIT_ENABLED, true),
  rateLimitWindowMs: intFromEnv(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMaxRequests: intFromEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 60),
  logLevel: String(process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info")).toLowerCase(),
  requestLogEnabled: boolFromEnv(process.env.REQUEST_LOG_ENABLED, process.env.NODE_ENV !== "test")
};

function isAbsoluteHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalUrl(value) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isPostgresUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "postgres:" || parsed.protocol === "postgresql:";
  } catch {
    return false;
  }
}

function isPlaceholderSecret(value) {
  return (
    !value ||
    value === "development-only-proof402-receipt-secret" ||
    value === "replace-with-a-long-random-secret" ||
    value.includes("replace") ||
    value.includes("your-")
  );
}

export function validateStartupConfig(runtimeConfig = config) {
  const errors = [];

  if (runtimeConfig.port < 1 || runtimeConfig.port > 65535) {
    errors.push("PORT must be between 1 and 65535.");
  }

  if (!runtimeConfig.host || String(runtimeConfig.host).trim().length === 0) {
    errors.push("HOST must not be empty.");
  }

  if (!isAbsoluteHttpUrl(runtimeConfig.publicBaseUrl)) {
    errors.push("PUBLIC_BASE_URL must be an absolute http(s) URL.");
  }

  if (!["memory", "json", "postgres"].includes(runtimeConfig.storeDriver)) {
    errors.push("STORE_DRIVER must be memory, json, or postgres.");
  }

  if (runtimeConfig.storeDriver === "postgres") {
    if (!runtimeConfig.databaseUrl) {
      errors.push("STORE_DRIVER=postgres requires DATABASE_URL.");
    } else if (!isPostgresUrl(runtimeConfig.databaseUrl)) {
      errors.push("DATABASE_URL must start with postgres:// or postgresql://.");
    } else if (runtimeConfig.databaseUrl.includes("user:password@host") || runtimeConfig.databaseUrl.includes("your-")) {
      errors.push("DATABASE_URL must be a real Postgres connection string, not a placeholder.");
    }
  }

  if (!/^[a-zA-Z0-9._-]{1,64}$/.test(runtimeConfig.receiptKeyId)) {
    errors.push("RECEIPT_KEY_ID must be 1-64 characters and use letters, numbers, dot, underscore, or dash.");
  }

  if (runtimeConfig.maxMetadataBytes < 2 || runtimeConfig.maxMetadataBytes > 65536) {
    errors.push("MAX_METADATA_BYTES must be between 2 and 65536.");
  }

  if (runtimeConfig.maxLabelLength < 1 || runtimeConfig.maxLabelLength > 512) {
    errors.push("MAX_LABEL_LENGTH must be between 1 and 512.");
  }

  if (runtimeConfig.rateLimitEnabled) {
    if (runtimeConfig.rateLimitWindowMs < 1000) {
      errors.push("RATE_LIMIT_WINDOW_MS must be at least 1000.");
    }
    if (runtimeConfig.rateLimitMaxRequests < 1) {
      errors.push("RATE_LIMIT_MAX_REQUESTS must be at least 1.");
    }
  }

  if (!["debug", "info", "warn", "error", "silent"].includes(runtimeConfig.logLevel)) {
    errors.push("LOG_LEVEL must be debug, info, warn, error, or silent.");
  }

  if (!runtimeConfig.x402Enabled) return errors;

  if (!/^0x[a-fA-F0-9]{40}$/.test(runtimeConfig.payTo)) {
    errors.push("X402_ENABLED=true requires PAY_TO to be a valid EVM address.");
  }

  if (isPlaceholderSecret(runtimeConfig.receiptSecret) || runtimeConfig.receiptSecret.length < 24) {
    errors.push("X402_ENABLED=true requires RECEIPT_SECRET to be a non-placeholder secret of at least 24 characters.");
  }

  if (!runtimeConfig.x402Mock && runtimeConfig.storeDriver === "memory") {
    errors.push("X402_ENABLED=true requires durable storage unless X402_MOCK=true for local tests.");
  }

  if (![DEFAULT_TESTNET_NETWORK, DEFAULT_MAINNET_NETWORK].includes(runtimeConfig.x402Network)) {
    errors.push(`X402_NETWORK must be ${DEFAULT_TESTNET_NETWORK} or ${DEFAULT_MAINNET_NETWORK}.`);
  }

  if (runtimeConfig.profile === "testnet" && runtimeConfig.x402Network !== DEFAULT_TESTNET_NETWORK) {
    errors.push(`PROOF402_PROFILE=testnet requires X402_NETWORK=${DEFAULT_TESTNET_NETWORK}.`);
  }

  if (runtimeConfig.profile === "mainnet" && runtimeConfig.x402Network !== DEFAULT_MAINNET_NETWORK) {
    errors.push(`PROOF402_PROFILE=mainnet requires X402_NETWORK=${DEFAULT_MAINNET_NETWORK}.`);
  }

  if (runtimeConfig.x402Network === DEFAULT_MAINNET_NETWORK && runtimeConfig.facilitatorUrl === DEFAULT_TESTNET_FACILITATOR) {
    errors.push("Base mainnet cannot use the default testnet facilitator.");
  }

  if (runtimeConfig.profile === "mainnet" && isLocalUrl(runtimeConfig.publicBaseUrl)) {
    errors.push("PROOF402_PROFILE=mainnet requires PUBLIC_BASE_URL to be a public non-local URL.");
  }

  if (!runtimeConfig.x402Mock && runtimeConfig.facilitatorUrl === DEFAULT_MAINNET_FACILITATOR) {
    if (!runtimeConfig.cdpApiKeyId || !runtimeConfig.cdpApiKeySecret) {
      errors.push("CDP facilitator requires CDP_API_KEY_ID and CDP_API_KEY_SECRET.");
    }
  }

  return errors;
}

export function assertProductionConfig(runtimeConfig = config) {
  const errors = validateStartupConfig(runtimeConfig);
  if (errors.length > 0) {
    throw new Error(`Invalid Proof402 configuration:\n- ${errors.join("\n- ")}`);
  }
}

export function runtimeSummary(runtimeConfig = config) {
  return {
    service: runtimeConfig.serviceName,
    version: runtimeConfig.version,
    profile: runtimeConfig.profile,
    port: runtimeConfig.port,
    host: runtimeConfig.host,
    publicBaseUrl: runtimeConfig.publicBaseUrl,
    x402Enabled: runtimeConfig.x402Enabled,
    x402Mock: runtimeConfig.x402Mock,
    x402Network: runtimeConfig.x402Network,
    x402Price: runtimeConfig.x402Price,
    storeDriver: runtimeConfig.storeDriver
  };
}
