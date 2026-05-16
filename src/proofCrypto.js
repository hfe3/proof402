import crypto from "node:crypto";
import { config } from "./config.js";

export function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sha256Json(value) {
  return `sha256:${sha256Hex(canonicalJson(value))}`;
}

function proofSecretsByKeyId() {
  return {
    ...config.receiptPreviousSecrets,
    [config.receiptKeyId]: config.receiptSecret
  };
}

export function signProofPayload(payload, secret = config.receiptSecret) {
  const signature = crypto.createHmac("sha256", secret).update(canonicalJson(payload)).digest("base64url");
  return `hmac-sha256:${signature}`;
}

export function buildProofPayload(proof) {
  return {
    version: "proof402.proof.v1",
    proofId: proof.id,
    timestamp: proof.timestamp,
    contentHash: proof.contentHash,
    label: proof.label,
    metadataHash: proof.metadataHash,
    idempotencyKey: proof.idempotencyKey || null
  };
}

export function verifyProof(proof, secretsByKeyId = proofSecretsByKeyId()) {
  if (!proof || !proof.signature || !proof.keyId) return false;
  const secret = secretsByKeyId[proof.keyId];
  if (!secret) return false;
  return signProofPayload(buildProofPayload(proof), secret) === proof.signature;
}
