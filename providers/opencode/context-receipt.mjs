/**
 * DPT-PROVIDER-004.D — Context Receipt
 *
 * Records baseline state at initial execution and rehydration.
 * Used to detect stale context after restart.
 */

import { createHash } from "crypto";

/**
 * Create a context receipt capturing baseline state.
 */
export function createContextReceipt({
  task_passport_revision,
  governance_revision = "1",
  baseline_sha,
  documents_loaded = [],
  document_digests = {},
  provider_model,
  loaded_at,
}) {
  return {
    receipt_version: "0.1.0",
    task_passport_revision,
    governance_revision,
    baseline_sha,
    documents_loaded,
    document_digests,
    provider_model,
    loaded_at: loaded_at ?? new Date().toISOString(),
    receipt_hash: null, // computed below
  };
}

/**
 * Compute a deterministic hash of the context receipt for comparison.
 */
export function receiptHash(receipt) {
  const canonical = JSON.stringify({
    task_passport_revision: receipt.task_passport_revision,
    governance_revision: receipt.governance_revision,
    baseline_sha: receipt.baseline_sha,
    documents_loaded: receipt.documents_loaded?.sort(),
    document_digests: receipt.document_digests,
    provider_model: receipt.provider_model,
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

/**
 * Compare two context receipts for equivalence.
 * Returns { equivalent, reasons } where reasons lists mismatches.
 */
export function compareReceipts(a, b) {
  const reasons = [];

  if (a.task_passport_revision !== b.task_passport_revision) {
    reasons.push(`passport_revision: ${a.task_passport_revision} vs ${b.task_passport_revision}`);
  }
  if (a.governance_revision !== b.governance_revision) {
    reasons.push(`governance_revision: ${a.governance_revision} vs ${b.governance_revision}`);
  }
  if (a.baseline_sha !== b.baseline_sha) {
    reasons.push(`baseline_sha: ${a.baseline_sha} vs ${b.baseline_sha}`);
  }
  if (a.provider_model !== b.provider_model) {
    reasons.push(`provider_model: ${a.provider_model} vs ${b.provider_model}`);
  }

  const a_docs = [...(a.documents_loaded ?? [])].sort();
  const b_docs = [...(b.documents_loaded ?? [])].sort();
  if (JSON.stringify(a_docs) !== JSON.stringify(b_docs)) {
    reasons.push(`documents_loaded differ`);
  }

  return {
    equivalent: reasons.length === 0,
    reasons,
  };
}

/**
 * Validate that a rehydrated context receipt matches the original.
 * Fails closed on any mismatch.
 */
export function validateRehydration(original_receipt, rehydrated_receipt) {
  const comparison = compareReceipts(original_receipt, rehydrated_receipt);
  return {
    valid: comparison.equivalent,
    mismatch_reasons: comparison.reasons,
    stale: !comparison.equivalent,
  };
}
