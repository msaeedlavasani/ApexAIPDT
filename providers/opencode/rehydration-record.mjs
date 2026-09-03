/**
 * DPT-PROVIDER-004.D — Durable Rehydration Record
 *
 * Minimum provider-neutral recovery state for session/restart/rehydration.
 * Provider session ID is recoverable state, NOT DPT task identity.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

/**
 * Create a durable rehydration record from a Work Order and context.
 */
export function createRehydrationRecord({
  task_id,
  task_passport_revision,
  work_order_id,
  work_order_revision,
  attempt_id = 1,
  role,
  permission_envelope,
  resource_claims = {},
  workspace,
  baseline_sha,
  context_receipt,
  provider_adapter = "dpt-opencode-provider-adapter",
  provider_model_selection = null,
  provider_session_id = null,
  execution_phase = "INITIAL",
  last_completed_step = null,
  pending_step = null,
  recovery_generation = 1,
}) {
  return {
    record_version: "0.1.0",
    task_id,
    task_passport_revision,
    work_order_id,
    work_order_revision,
    attempt_id,
    role,
    permission_envelope_id: permission_envelope?.envelope_id ?? null,
    permission_envelope_revision: permission_envelope?.schema_version ?? null,
    resource_claims,
    workspace,
    baseline_sha,
    context_receipt,
    provider_adapter,
    provider_model_selection,
    provider_session_id, // recoverable, NOT task identity
    execution_phase,
    last_completed_step,
    pending_step,
    timestamps: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    recovery_generation,
  };
}

/**
 * Update a rehydration record after a step completes.
 */
export function advanceRecord(record, { step_id, phase, provider_session_id }) {
  return {
    ...record,
    execution_phase: phase ?? record.execution_phase,
    last_completed_step: step_id ?? record.last_completed_step,
    provider_session_id: provider_session_id ?? record.provider_session_id,
    recovery_generation: record.recovery_generation + 1,
    timestamps: {
      ...record.timestamps,
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Create a recovery record for a restarted adapter.
 */
export function createRecoveryRecord(original, { recovery_reason, new_provider_session_id }) {
  return {
    ...original,
    provider_session_id: new_provider_session_id,
    recovery_generation: original.recovery_generation + 1,
    timestamps: {
      ...original.timestamps,
      updated_at: new Date().toISOString(),
      recovered_at: new Date().toISOString(),
    },
    metadata: {
      recovery_reason,
      recovered_from_generation: original.recovery_generation,
    },
  };
}

/**
 * Persist a rehydration record to disk.
 */
export function persistRecord(record, dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filename = `rehydration-${record.task_id}-${record.work_order_id}.json`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, JSON.stringify(record, null, 2));
  return filepath;
}

/**
 * Load a rehydration record from disk.
 */
export function loadRecord(filepath) {
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, "utf-8"));
}

/**
 * Validate a rehydration record for completeness.
 */
export function validateRecord(record) {
  const errors = [];
  const required = [
    "task_id", "task_passport_revision", "work_order_id",
    "work_order_revision", "role", "workspace", "baseline_sha",
    "context_receipt", "provider_adapter", "execution_phase",
  ];
  for (const field of required) {
    if (!record[field]) errors.push(`Missing required field: ${field}`);
  }
  return { valid: errors.length === 0, errors };
}
