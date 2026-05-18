import { config } from "./config.js";
import { ApiError } from "./errors.js";
import { buildProofPayload, createId, sha256Json, signProofPayload, verifyProof } from "./proofCrypto.js";
import { createProof, getProofByIdempotencyKey } from "./store.js";

const SHA256_RE = /^sha256:[a-fA-F0-9]{64}$/;

function byteLength(value) {
  return Buffer.byteLength(value, "utf8");
}

export function validateProofRequest(input = {}) {
  const errors = {};

  if (typeof input.contentHash !== "string" || input.contentHash.trim().length === 0) {
    errors.contentHash = "contentHash is required.";
  } else if (!SHA256_RE.test(input.contentHash.trim())) {
    errors.contentHash = "contentHash must use sha256:<64 hex characters>.";
  }

  if (typeof input.label !== "string" || input.label.trim().length === 0) {
    errors.label = "label is required.";
  } else if (input.label.trim().length > config.maxLabelLength) {
    errors.label = `label must be at most ${config.maxLabelLength} characters.`;
  }

  if (typeof input.idempotencyKey !== "string" || input.idempotencyKey.trim().length === 0) {
    errors.idempotencyKey = "idempotencyKey is required.";
  } else if (input.idempotencyKey.trim().length > 160) {
    errors.idempotencyKey = "idempotencyKey must be at most 160 characters.";
  }

  if (input.metadata !== undefined) {
    if (input.metadata === null || typeof input.metadata !== "object" || Array.isArray(input.metadata)) {
      errors.metadata = "metadata must be a JSON object.";
    } else if (byteLength(JSON.stringify(input.metadata)) > config.maxMetadataBytes) {
      errors.metadata = `metadata must be at most ${config.maxMetadataBytes} bytes.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, "invalid_input", "Proof request is invalid.", errors);
  }

  const metadata = input.metadata || {};
  return {
    contentHash: input.contentHash.trim().toLowerCase(),
    label: input.label.trim(),
    metadata,
    metadataHash: sha256Json(metadata),
    metadataKeys: Object.keys(metadata).sort(),
    idempotencyKey: input.idempotencyKey.trim()
  };
}

export async function notarizeProof(input = {}, context = {}) {
  const normalized = validateProofRequest(input);
  const existing = await getProofByIdempotencyKey(normalized.idempotencyKey);

  if (existing) {
    return {
      proof: existing,
      idempotentReplay: true,
      verified: verifyProof(existing)
    };
  }

  const timestamp = new Date().toISOString();
  const proof = {
    id: createId("proof"),
    keyId: config.receiptKeyId,
    timestamp,
    createdAt: timestamp,
    contentHash: normalized.contentHash,
    label: normalized.label,
    metadataHash: normalized.metadataHash,
    metadataKeys: normalized.metadataKeys,
    idempotencyKey: normalized.idempotencyKey,
    accountId: context.accountId || null,
    apiKeyId: context.apiKeyId || null
  };

  proof.signature = signProofPayload(buildProofPayload(proof));
  await createProof(proof);

  return {
    proof,
    idempotentReplay: false,
    verified: verifyProof(proof)
  };
}

export function publicProof(proof, { includeSignature = true, direct = true } = {}) {
  if (!proof) return null;
  const signature = includeSignature ? proof.signature : `${String(proof.signature || "").slice(0, 24)}...`;

  return {
    id: proof.id,
    verified: verifyProof(proof),
    timestamp: proof.timestamp,
    contentHash: proof.contentHash,
    label: proof.label,
    metadataHash: proof.metadataHash,
    metadataKeys: proof.metadataKeys || [],
    accountId: proof.accountId || undefined,
    signature,
    keyId: direct ? proof.keyId : undefined
  };
}

export function proofLinks(id, baseUrl = "") {
  return {
    proof: `${baseUrl}/proof/${id}`,
    verify: `${baseUrl}/api/verify/proofs/${id}`
  };
}
