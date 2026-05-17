import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const baseUrl = normalizeBaseUrl(args.find((arg) => !arg.startsWith("--")) || "https://proof402.vercel.app");
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const expectedVersion = packageJson.version;
const expectedTag = `v${expectedVersion}`;
const repository = "hfe3/proof402";
const requiredCheckRuns = ["Test and local smoke"];

const checks = [
  ["git working tree", checkGitWorkingTree],
  ["git release tag", checkGitReleaseTag],
  ["production metadata", checkProductionMetadata]
];

if (!flags.has("--skip-github")) {
  checks.splice(2, 0, ["GitHub release", checkGitHubRelease]);
}

const failures = [];

for (const [name, check] of checks) {
  try {
    const detail = await check();
    console.log(`[ok] ${name}${detail ? `: ${detail}` : ""}`);
  } catch (error) {
    failures.push({ name, message: error.message });
    console.error(`[fail] ${name}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`release-check failed: ${failures.length} failed check(s)`);
  process.exit(1);
}

console.log(`release-check passed: ${expectedTag} at ${baseUrl}`);

function checkGitWorkingTree() {
  const branch = git(["branch", "--show-current"]);
  assert(branch === "main", `expected branch main, got ${branch || "<detached>"}`);

  const status = git(["status", "--porcelain"]);
  assert(!status, `working tree is not clean:\n${status}`);

  const origin = git(["remote", "get-url", "origin"]);
  assert(/github\.com[:/]hfe3\/proof402(?:\.git)?$/i.test(origin), `unexpected origin: ${origin}`);

  return `main clean`;
}

function checkGitReleaseTag() {
  const head = git(["rev-parse", "HEAD"]);
  const originHead = git(["rev-parse", "origin/main"]);
  assert(head === originHead, `HEAD ${head.slice(0, 12)} does not match origin/main ${originHead.slice(0, 12)}`);

  const tags = git(["tag", "--points-at", "HEAD"]).split(/\r?\n/).filter(Boolean);
  assert(tags.includes(expectedTag), `HEAD is missing tag ${expectedTag}`);

  return `${expectedTag} on ${head.slice(0, 12)}`;
}

async function checkGitHubRelease() {
  const head = git(["rev-parse", "HEAD"]);

  const mainRef = await githubJson(`/repos/${repository}/git/ref/heads/main`);
  assert(mainRef.object?.sha === head, `GitHub main is ${short(mainRef.object?.sha)}, local HEAD is ${short(head)}`);

  const tagCommit = await githubTagCommit(expectedTag);
  assert(tagCommit === head, `GitHub ${expectedTag} points to ${short(tagCommit)}, local HEAD is ${short(head)}`);

  const release = await githubJson(`/repos/${repository}/releases/tags/${expectedTag}`);
  assert(release.tag_name === expectedTag, `release tag mismatch: ${release.tag_name}`);
  assert(release.draft === false, "release is still a draft");
  assert(release.prerelease === false, "release is marked prerelease");

  if (!flags.has("--skip-check-runs")) {
    const runsResponse = await githubJson(`/repos/${repository}/commits/${head}/check-runs`);
    const runs = runsResponse.check_runs || [];
    assert(runs.length > 0, "no GitHub check-runs found for current commit");

    for (const name of requiredCheckRuns) {
      const run = runs.find((item) => item.name === name);
      assert(run, `missing required check-run: ${name}`);
      assert(run.status === "completed", `${name} is ${run.status}`);
      assert(run.conclusion === "success", `${name} concluded ${run.conclusion}`);
    }

    const failed = runs.filter((run) => run.status === "completed" && run.conclusion !== "success");
    assert(failed.length === 0, `failed check-runs: ${failed.map((run) => `${run.name}=${run.conclusion}`).join(", ")}`);
  }

  return `${expectedTag} published`;
}

async function checkProductionMetadata() {
  const [health, status, trust, marketplace] = await Promise.all([
    fetchJson("/health"),
    fetchJson("/api/status"),
    fetchJson("/api/trust"),
    fetchJson("/marketplace.json")
  ]);

  assert(health.service === "Proof402", `/health service mismatch: ${health.service}`);
  assert(health.version === expectedVersion, `/health version ${health.version}, expected ${expectedVersion}`);
  assert(health.profile === "mainnet", `/health expected profile mainnet, got ${health.profile}`);
  assert(health.x402Enabled === true, "/health expected x402Enabled=true");
  assert(health.network === "eip155:8453", `/health network mismatch: ${health.network}`);
  assert(health.price === "$0.005", `/health price mismatch: ${health.price}`);

  assert(status.version === expectedVersion, `/api/status version ${status.version}, expected ${expectedVersion}`);
  assert(status.repository?.url === "https://github.com/hfe3/proof402", "/api/status repository URL mismatch");
  assert(status.repository?.visibility === "public", "/api/status repository visibility mismatch");

  assert(trust.x402?.enabled === true, "/api/trust expected x402.enabled=true");
  assert(trust.productionReadiness?.deployment?.activeMainnet === true, "/api/trust activeMainnet is not true");
  assert(marketplace.version === expectedVersion, `/marketplace.json version ${marketplace.version}, expected ${expectedVersion}`);
  assert(marketplace.x402?.network === "eip155:8453", `/marketplace.json network mismatch: ${marketplace.x402?.network}`);
  assert(marketplace.x402?.price === "$0.005", `/marketplace.json price mismatch: ${marketplace.x402?.price}`);

  return `${health.version} mainnet x402`;
}

async function githubTagCommit(tag) {
  const ref = await githubJson(`/repos/${repository}/git/ref/tags/${tag}`);
  if (ref.object?.type === "commit") return ref.object.sha;
  if (ref.object?.type === "tag") {
    const tagObject = await githubJson(`/repos/${repository}/git/tags/${ref.object.sha}`);
    assert(tagObject.object?.type === "commit", `${tag} does not resolve to a commit`);
    return tagObject.object.sha;
  }
  throw new Error(`${tag} has unexpected ref type ${ref.object?.type || "<missing>"}`);
}

async function githubJson(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "proof402-release-check"
    }
  });
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `GitHub ${path} returned ${response.status}: ${body.message || response.statusText}`);
  return body;
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `${path} returned ${response.status}: ${body.error?.message || response.statusText}`);
  return body;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function short(value) {
  return value ? String(value).slice(0, 12) : "<missing>";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
