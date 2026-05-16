const id = window.location.pathname.split("/").filter(Boolean).pop();
const title = document.querySelector("#proof-title");
const root = document.querySelector("#proof-output");

title.textContent = `Proof ${id}`;

fetch(`/api/verify/proofs/${encodeURIComponent(id)}`)
  .then((response) => response.json().then((body) => ({ response, body })))
  .then(({ response, body }) => {
    if (!response.ok) {
      root.innerHTML = `<p class="status-warn">${body.error?.message || "Proof not found"}</p>`;
      return;
    }

    const proof = body.proof;
    root.innerHTML = `
      <p><span class="${body.verified ? "status-ok" : "status-warn"}">${body.verified ? "verified" : "not verified"}</span></p>
      <table class="table">
        <tbody>
          <tr><th>ID</th><td><code>${proof.id}</code></td></tr>
          <tr><th>Timestamp</th><td>${proof.timestamp}</td></tr>
          <tr><th>Label</th><td>${proof.label}</td></tr>
          <tr><th>Content hash</th><td><code>${proof.contentHash}</code></td></tr>
          <tr><th>Metadata hash</th><td><code>${proof.metadataHash}</code></td></tr>
          <tr><th>Signature</th><td><code>${proof.signature}</code></td></tr>
        </tbody>
      </table>
      <p><a href="/api/verify/proofs/${encodeURIComponent(id)}">Verification JSON</a></p>
    `;
  })
  .catch((error) => {
    root.innerHTML = `<p class="status-warn">${error.message}</p>`;
  });
