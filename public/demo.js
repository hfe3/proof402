const form = document.querySelector("#proof-form");
const output = document.querySelector("#demo-output code");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.textContent = "Creating proof...";

  try {
    const formData = new FormData(form);
    const payload = {
      contentHash: formData.get("contentHash"),
      label: formData.get("label"),
      idempotencyKey: formData.get("idempotencyKey"),
      metadata: JSON.parse(formData.get("metadata") || "{}")
    };

    const response = await fetch("/api/proof/notarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await response.json();
    output.textContent = JSON.stringify(body, null, 2);
  } catch (error) {
    output.textContent = JSON.stringify({ error: error.message }, null, 2);
  }
});
