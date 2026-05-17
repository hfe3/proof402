import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const forbiddenPathPattern =
  /(^|\/)(data|\.vercel|node_modules|wallets?|agentcash|secrets?|private|keys|tokens|local-canary)\/|(^|\/)\.env$|(^|\/)\.env\.(local|demo|testnet|mainnet|production)$|\.(pem|key|p12|pfx|crt|cer|jwk|secret|secrets)$|(^|\/)settlement-canary/i;

const sensitiveEnvKeyPattern = /(SECRET|TOKEN|PRIVATE|PASSWORD|DATABASE_URL|POSTGRES|CDP|API_KEY|AUTH|MNEMONIC|SEED)/i;

const secretLikePatterns = [
  {
    id: "private_key_block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/i
  },
  {
    id: "github_pat",
    pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/
  },
  {
    id: "vercel_token",
    pattern: /\bvercel_[A-Za-z0-9]{20,}\b/i
  },
  {
    id: "database_url_literal",
    pattern: /\bpostgres(?:ql)?:\/\/[^@\s]+:[^@\s]+@/i
  },
  {
    id: "cdp_secret_literal",
    pattern: /\bCDP_[A-Z0-9_]*(?:SECRET|KEY)[A-Z0-9_]*\s*=\s*['"]?[A-Za-z0-9_+/=-]{20,}/i
  }
];

const allowedSecretPatternFiles = new Set([".env.example", ".env.demo.example", "SECURITY.md", "LAUNCH_CHECKLIST.md"]);

const trackedFiles = gitLines(["ls-files"]);
const failures = [];

for (const file of trackedFiles) {
  const normalized = file.replaceAll("\\", "/");
  if (forbiddenPathPattern.test(normalized)) {
    failures.push({ type: "forbidden_path", file });
  }
}

for (const file of trackedFiles) {
  if (!isTextCandidate(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const check of secretLikePatterns) {
    if (check.pattern.test(content) && !allowedSecretPatternFiles.has(file)) {
      failures.push({ type: "secret_like_pattern", id: check.id, file });
    }
  }
}

const envSecrets = readSensitiveEnvSecrets(".env");
for (const { key, value } of envSecrets) {
  for (const file of trackedFiles) {
    if (!isTextCandidate(file) || allowedSecretPatternFiles.has(file)) continue;
    const content = readFileSync(file, "utf8");
    if (content.includes(value)) {
      failures.push({ type: "env_value_match", key, file });
    }
  }
}

if (failures.length > 0) {
  console.error("security-scan failed:");
  for (const failure of failures) {
    console.error(`- ${formatFailure(failure)}`);
  }
  process.exit(1);
}

console.log(`security-scan passed: ${trackedFiles.length} tracked files checked`);

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isTextCandidate(file) {
  if (!existsSync(file)) return false;
  const stat = statSync(file);
  if (!stat.isFile() || stat.size > 1024 * 1024) return false;
  return !/\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|gz|br|woff2?|ttf|eot)$/i.test(file);
}

function readSensitiveEnvSecrets(path) {
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const pairs = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (value.length < 12 || !sensitiveEnvKeyPattern.test(key)) continue;
    if (/^(change-me|your-|placeholder|demo|false|true|null)$/i.test(value)) continue;
    pairs.push({ key, value });
  }
  return pairs;
}

function formatFailure(failure) {
  if (failure.type === "forbidden_path") return `forbidden tracked path: ${failure.file}`;
  if (failure.type === "secret_like_pattern") return `secret-like pattern ${failure.id} in ${failure.file}`;
  if (failure.type === "env_value_match") return `sensitive .env value for ${failure.key} appears in ${failure.file}`;
  return JSON.stringify(failure);
}
