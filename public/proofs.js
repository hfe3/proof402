const root = document.querySelector("#proofs-output");

function renderProof(item) {
  const proof = item.proof;
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <h2>${proof.label}</h2>
    <p><span class="${proof.verified ? "status-ok" : "status-warn"}">${proof.verified ? "verified" : "not verified"}</span></p>
    <p><code>${proof.id}</code></p>
    <p class="muted">${proof.timestamp}</p>
    <p><a href="${item.links.proof}">Proof badge</a> · <a href="${item.links.verify}">Verify JSON</a></p>
  `;
  return article;
}

fetch("/api/proofs/recent")
  .then((response) => response.json())
  .then((body) => {
    root.innerHTML = "";
    if (!body.proofs || body.proofs.length === 0) {
      root.innerHTML = '<article class="card">No public proofs yet. Create one from the demo console.</article>';
      return;
    }
    for (const item of body.proofs) {
      root.appendChild(renderProof(item));
    }
  })
  .catch((error) => {
    root.innerHTML = `<article class="card status-warn">${error.message}</article>`;
  });
