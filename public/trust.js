const root = document.querySelector("#trust-output");

fetch("/api/trust")
  .then((response) => response.json())
  .then((body) => {
    root.innerHTML = `
      <table class="table">
        <tbody>
          <tr><th>Profile</th><td><code>${body.profile}</code></td></tr>
          <tr><th>x402</th><td>${body.x402.enabled ? "enabled" : "disabled"}${body.x402.mock ? " (mock)" : ""}</td></tr>
          <tr><th>Storage</th><td><code>${body.storage.driver}</code>, ${body.storage.proofs} proofs</td></tr>
          <tr><th>Public badge</th><td><code>${body.proofModel.publicBadge}</code></td></tr>
          <tr><th>Verification</th><td><code>${body.proofModel.verification}</code></td></tr>
        </tbody>
      </table>
      <pre><code>${JSON.stringify(body.safety, null, 2)}</code></pre>
    `;
  })
  .catch((error) => {
    root.innerHTML = `<p class="status-warn">${error.message}</p>`;
  });
