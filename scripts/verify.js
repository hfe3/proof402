import { spawnSync } from "node:child_process";

const mode = process.argv[2] || "local";
const target = process.argv[3] || defaultTarget(mode);
const npm = "npm";
const npx = "npx";

const plans = {
  local: [
    [npm, ["test"]],
    [npm, ["run", "version:check"]],
    [npm, ["run", "local:doctor", "--", target]],
    [npm, ["run", "security:scan"]],
    [npm, ["audit", "--omit=dev"]],
    [npm, ["run", "deploy:check", "--", target]]
  ],
  production: [
    [npm, ["test"]],
    [npm, ["run", "version:check"]],
    [npm, ["run", "security:scan"]],
    [npm, ["audit", "--omit=dev"]],
    [npm, ["run", "deploy:check", "--", target, "--expect-x402"]],
    [npm, ["run", "smoke:x402", "--", target]],
    [npx, ["agentcash", "discover", target, "--format", "json"]]
  ]
};

plans.prod = plans.production;

if (!plans[mode]) {
  console.error("Usage: npm run verify:local -- [base-url]");
  console.error("       npm run verify:production -- [base-url]");
  process.exit(1);
}

console.log(`verify:${mode} target=${target}`);
for (const [command, args] of plans[mode]) {
  run(command, args);
}
console.log(`verify:${mode} passed`);

function defaultTarget(value) {
  if (value === "production" || value === "prod") return "https://proof402.vercel.app";
  return "http://127.0.0.1:4022";
}

function run(command, args) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
