import { readFileSync } from "node:fs";
import { config } from "../src/config.js";
import { SERVICE } from "../src/serviceInfo.js";

const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const expected = packageJson.version;

const checks = [
  ["package-lock.json version", packageLock.version],
  ["package-lock root package version", packageLock.packages?.[""]?.version],
  ["src/config.js config.version", config.version],
  ["src/serviceInfo.js SERVICE.version", SERVICE.version],
  ["public/marketplace.json version", readJson("public/marketplace.json").version],
  ["Brand/brand-card.json version", readJson("Brand/brand-card.json").version],
  ["Brand/README.md Version", markdownVersion("Brand/README.md")],
  ["Brand/agent-profile.md Version", markdownVersion("Brand/agent-profile.md")],
  ["Brand/marketplace-listing.md Version", markdownVersion("Brand/marketplace-listing.md")],
  ["RELEASE_NOTES.md title version", releaseNotesVersion()],
  ["LAUNCH_CHECKLIST.md latest release", launchChecklistVersion()],
  ["CHANGELOG.md release entry", changelogVersion()]
];

const failures = checks.filter(([, actual]) => actual !== expected);

if (failures.length > 0) {
  console.error(`version-check failed: expected ${expected}`);
  for (const [name, actual] of failures) {
    console.error(`- ${name}: ${actual || "<missing>"}`);
  }
  process.exit(1);
}

console.log(`version-check passed: ${expected}`);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readText(path) {
  return readFileSync(path, "utf8");
}

function markdownVersion(path) {
  return readText(path).match(/^Version:\s*([0-9]+\.[0-9]+\.[0-9]+)\s*$/m)?.[1] || "";
}

function releaseNotesVersion() {
  return readText("RELEASE_NOTES.md").match(/^# Proof402 ([0-9]+\.[0-9]+\.[0-9]+) Release Notes\s*$/m)?.[1] || "";
}

function launchChecklistVersion() {
  return readText("LAUNCH_CHECKLIST.md").match(/Latest release:\s*`v([0-9]+\.[0-9]+\.[0-9]+)`/)?.[1] || "";
}

function changelogVersion() {
  return readText("CHANGELOG.md").match(/^## ([0-9]+\.[0-9]+\.[0-9]+) - \d{4}-\d{2}-\d{2}\s*$/m)?.[1] || "";
}
