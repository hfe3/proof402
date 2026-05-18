const metricsRoot = document.querySelector("#dashboard-metrics");
const opsRoot = document.querySelector("#ops-list");
const form = document.querySelector("#proof-search-form");
const resultsRoot = document.querySelector("#proof-search-results");
const proofCount = document.querySelector("#proof-count");

function text(value) {
  return value === undefined || value === null || value === "" ? "none" : String(value);
}

function metric(label, value) {
  const article = document.createElement("article");
  article.className = "metric-card";
  const labelNode = document.createElement("span");
  labelNode.textContent = label;
  const valueNode = document.createElement("strong");
  valueNode.textContent = text(value);
  article.append(labelNode, valueNode);
  return article;
}

function renderOps(summary) {
  const rows = [
    ["Dashboard", summary.product.dashboard],
    ["Proof search", summary.product.proofSearch],
    ["Accounts", summary.product.accounts],
    ["API keys", summary.product.apiKeys],
    ["Webhook receipts", summary.product.webhookReceipts],
    ["Postgres path", summary.product.postgresReady],
    ["Store", summary.storage.driver],
    ["Durable", summary.storage.durable]
  ];

  opsRoot.innerHTML = "";
  for (const [label, value] of rows) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = typeof value === "boolean" ? (value ? "ready" : "off") : text(value);
    opsRoot.append(dt, dd);
  }
}

function renderProofRows(items) {
  resultsRoot.innerHTML = "";
  proofCount.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "muted";
    cell.textContent = "No proofs matched.";
    row.appendChild(cell);
    resultsRoot.appendChild(row);
    return;
  }

  for (const item of items) {
    const proof = item.proof;
    const row = document.createElement("tr");

    const proofCell = document.createElement("td");
    const proofId = document.createElement("code");
    proofId.textContent = text(proof.id);
    const status = document.createElement("span");
    status.className = proof.verified ? "status-ok" : "status-warn";
    status.textContent = proof.verified ? "verified" : "not verified";
    proofCell.append(proofId, document.createElement("br"), status);

    const labelCell = document.createElement("td");
    labelCell.append(document.createTextNode(text(proof.label)), document.createElement("br"));
    const metadataHash = document.createElement("code");
    metadataHash.textContent = text(proof.metadataHash);
    labelCell.appendChild(metadataHash);

    const accountCell = document.createElement("td");
    const accountId = document.createElement("code");
    accountId.textContent = text(item.accountId);
    accountCell.appendChild(accountId);

    const timestampCell = document.createElement("td");
    timestampCell.textContent = text(proof.timestamp);

    const linksCell = document.createElement("td");
    const badge = document.createElement("a");
    badge.href = item.links.proof;
    badge.textContent = "Badge";
    const verify = document.createElement("a");
    verify.href = item.links.verify;
    verify.textContent = "Verify";
    linksCell.append(badge, document.createElement("br"), verify);

    row.append(proofCell, labelCell, accountCell, timestampCell, linksCell);
    resultsRoot.appendChild(row);
  }
}

async function loadSummary() {
  const response = await fetch("/api/dashboard/summary");
  const summary = await response.json();
  metricsRoot.innerHTML = "";
  for (const [label, value] of [
    ["Proofs", summary.counts.proofs],
    ["Accounts", summary.counts.accounts],
    ["API keys", summary.counts.apiKeys],
    ["Webhooks", summary.counts.webhooks],
    ["Deliveries", summary.counts.webhookDeliveries]
  ]) {
    metricsRoot.appendChild(metric(label, value));
  }
  renderOps(summary);
  renderProofRows(summary.recentProofs || []);
}

async function runSearch(event) {
  event?.preventDefault();
  const params = new URLSearchParams();
  for (const [key, value] of new FormData(form).entries()) {
    if (String(value).trim()) params.set(key, String(value).trim());
  }
  const response = await fetch(`/api/proofs/search?${params.toString()}`);
  const body = await response.json();
  renderProofRows(body.proofs || []);
}

form.addEventListener("submit", runSearch);
loadSummary().catch((error) => {
  metricsRoot.innerHTML = "";
  const message = document.createElement("article");
  message.className = "metric-card status-warn";
  message.textContent = error.message;
  metricsRoot.appendChild(message);
});
