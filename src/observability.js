import { config } from "./config.js";

const counters = new Map();
const startedAt = new Date();
const REDACTED = "[redacted]";
const remoteLogState = {
  sent: 0,
  failed: 0
};

function shouldLog(level) {
  if (config.logLevel === "silent") return false;
  const levels = ["debug", "info", "warn", "error"];
  return levels.indexOf(level) >= levels.indexOf(config.logLevel);
}

export function logEvent(level, event, details = {}) {
  if (!shouldLog(level)) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...details
  };
  const output = JSON.stringify(line);
  if (level === "error") {
    console.error(output);
  } else {
    console.log(output);
  }
  sendRemoteLog(line);
}

export function recordMetric(name, amount = 1) {
  counters.set(name, (counters.get(name) || 0) + amount);
}

export function observabilitySummary() {
  return {
    startedAt: startedAt.toISOString(),
    uptimeMs: Date.now() - startedAt.getTime(),
    counters: Object.fromEntries(counters.entries()),
    betterStack: {
      enabled: config.betterStackLogsEnabled,
      sourceId: config.betterStackSourceId || null,
      ingestHostConfigured: Boolean(config.betterStackIngestHost),
      sourceTokenConfigured: Boolean(config.betterStackSourceToken),
      sent: remoteLogState.sent,
      failed: remoteLogState.failed
    }
  };
}

export function requestLogger(req, res, next) {
  if (!config.requestLogEnabled) return next();
  const started = Date.now();
  res.on("finish", () => {
    logEvent("info", "http.request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - started
    });
  });
  next();
}

function betterStackEndpoint() {
  const host = String(config.betterStackIngestHost || "").trim();
  if (!host) return "";
  return host.startsWith("https://") ? host : `https://${host}`;
}

function sendRemoteLog(line) {
  if (!config.betterStackLogsEnabled) return;
  if (!config.betterStackSourceToken || !betterStackEndpoint()) return;

  const payload = {
    dt: line.ts,
    service: "proof402",
    version: config.version,
    profile: config.profile,
    level: line.level,
    message: line.event,
    event: line.event,
    source_id: config.betterStackSourceId || undefined,
    ...sanitizeForRemote(line)
  };

  fetch(betterStackEndpoint(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.betterStackSourceToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then((response) => {
      if (response.ok) {
        remoteLogState.sent += 1;
      } else {
        remoteLogState.failed += 1;
      }
    })
    .catch(() => {
      remoteLogState.failed += 1;
    });
}

function sanitizeForRemote(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 4) return "[truncated]";
  if (typeof value === "string") return value.length > 500 ? `${value.slice(0, 500)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeForRemote(item, depth + 1));
  if (typeof value !== "object") return String(value);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "ts")
      .map(([key, item]) => [key, shouldRedactKey(key) ? REDACTED : sanitizeForRemote(item, depth + 1)])
  );
}

function shouldRedactKey(key) {
  return /secret|token|authorization|cookie|payment|password|private|wallet|cdp|api.?key|signature|database|header|body/i.test(
    key
  );
}
