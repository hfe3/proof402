import { config } from "./config.js";

const counters = new Map();
const startedAt = new Date();

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
}

export function recordMetric(name, amount = 1) {
  counters.set(name, (counters.get(name) || 0) + amount);
}

export function observabilitySummary() {
  return {
    startedAt: startedAt.toISOString(),
    uptimeMs: Date.now() - startedAt.getTime(),
    counters: Object.fromEntries(counters.entries())
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
