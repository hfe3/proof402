import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const packageVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
const args = process.argv.slice(2);
const baseUrl = normalizeBaseUrl(positionalUrl() || "http://127.0.0.1:4022");
const timeoutMs = numberArg("--timeout-ms", 3000);

if (!baseUrl) {
  console.error("Usage: npm run local:doctor -- [base-url] [--timeout-ms <ms>]");
  process.exit(1);
}

try {
  const health = await fetchHealth(baseUrl, timeoutMs);
  const problems = [];

  if (health.service !== "Proof402") {
    problems.push(`expected service=Proof402, got ${JSON.stringify(health.service)}`);
  }

  if (health.version !== packageVersion) {
    problems.push(`expected version=${packageVersion}, got ${JSON.stringify(health.version)}`);
  }

  if (health.profile !== "demo") {
    problems.push(`expected profile=demo for local doctor, got ${JSON.stringify(health.profile)}`);
  }

  if (health.x402Enabled !== false) {
    problems.push("expected x402Enabled=false for local demo");
  }

  if (problems.length > 0) {
    const port = portFromUrl(baseUrl);
    const owners = port ? listeningPids(port) : [];
    console.error(`local-doctor failed for ${baseUrl}`);
    for (const problem of problems) console.error(`- ${problem}`);
    if (owners.length > 0) {
      console.error(`- listening PID(s) on port ${port}: ${owners.join(", ")}`);
    }
    console.error("Start the current checkout with `npm run dev:demo`, stop the stale local process, or use another PORT/PUBLIC_BASE_URL.");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        service: health.service,
        version: health.version,
        profile: health.profile,
        x402Enabled: health.x402Enabled
      },
      null,
      2
    )
  );
} catch (error) {
  const port = portFromUrl(baseUrl);
  const owners = port ? listeningPids(port) : [];
  console.error(`local-doctor failed for ${baseUrl}`);
  console.error(`- ${error.message}`);
  if (owners.length > 0) {
    console.error(`- listening PID(s) on port ${port}: ${owners.join(", ")}`);
  }
  console.error("Start the local demo with `npm run dev:demo` or pass the URL of the running local checkout.");
  process.exit(1);
}

async function fetchHealth(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${url}/health`, { signal: controller.signal });
    if (!response.ok) throw new Error(`/health returned ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function numberArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const parsed = Number.parseInt(args[index + 1], 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positionalUrl() {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--timeout-ms") {
      index += 1;
      continue;
    }
    if (!arg.startsWith("--")) return arg;
  }
  return "";
}

function portFromUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.port) return Number.parseInt(parsed.port, 10);
    return parsed.protocol === "https:" ? 443 : 80;
  } catch {
    return null;
  }
}

function listeningPids(port) {
  try {
    const output = execFileSync("netstat", ["-ano", "-p", "tcp"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const matches = [];
    for (const line of output.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns.length < 5) continue;
      const local = columns[1];
      const state = columns[3];
      const pid = columns[4];
      if (local?.endsWith(`:${port}`) && state === "LISTENING" && /^\d+$/.test(pid)) {
        matches.push(pid);
      }
    }
    return [...new Set(matches)];
  } catch {
    return [];
  }
}
