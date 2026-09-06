/**
 * DPT-PROVIDER-005 — Provider Capability Descriptor
 *
 * Machine-readable description of what a provider supports.
 * Providers fill this in honestly — PARTIAL and UNSUPPORTED are valid.
 */

import { CAPABILITY_LEVEL } from "./provider-contract.mjs";

export const DESCRIPTOR_VERSION = "0.1.0";

/**
 * Create a provider capability descriptor.
 */
export function createCapabilityDescriptor({
  provider_id,
  provider_name,
  adapter_version,
  contract_version,
  capabilities = {},
  metadata = {},
}) {
  return {
    descriptor_version: DESCRIPTOR_VERSION,
    provider_id,
    provider_name,
    adapter_version,
    contract_version,
    timestamp: new Date().toISOString(),
    capabilities: {
      // Required capabilities
      identity_correlation: capabilities.identity_correlation ?? CAPABILITY_LEVEL.UNSUPPORTED,
      event_production: capabilities.event_production ?? CAPABILITY_LEVEL.UNSUPPORTED,
      evidence_recording: capabilities.evidence_recording ?? CAPABILITY_LEVEL.UNSUPPORTED,
      authority_enforcement: capabilities.authority_enforcement ?? CAPABILITY_LEVEL.UNSUPPORTED,
      permission_envelope: capabilities.permission_envelope ?? CAPABILITY_LEVEL.UNSUPPORTED,
      failure_reporting: capabilities.failure_reporting ?? CAPABILITY_LEVEL.UNSUPPORTED,
      recovery_state: capabilities.recovery_state ?? CAPABILITY_LEVEL.UNSUPPORTED,
      completion_idempotency: capabilities.completion_idempotency ?? CAPABILITY_LEVEL.UNSUPPORTED,
      cross_wo_isolation: capabilities.cross_wo_isolation ?? CAPABILITY_LEVEL.UNSUPPORTED,
      human_gate_preservation: capabilities.human_gate_preservation ?? CAPABILITY_LEVEL.UNSUPPORTED,

      // Optional capabilities
      native_event_stream: capabilities.native_event_stream ?? CAPABILITY_LEVEL.UNSUPPORTED,
      session_recovery: capabilities.session_recovery ?? CAPABILITY_LEVEL.UNSUPPORTED,
      subagent_isolation: capabilities.subagent_isolation ?? CAPABILITY_LEVEL.UNSUPPORTED,
      dynamic_permission_materialization: capabilities.dynamic_permission_materialization ?? CAPABILITY_LEVEL.UNSUPPORTED,
      capability_plane: capabilities.capability_plane ?? CAPABILITY_LEVEL.UNSUPPORTED,
      abort_support: capabilities.abort_support ?? CAPABILITY_LEVEL.UNSUPPORTED,
      restart_support: capabilities.restart_support ?? CAPABILITY_LEVEL.UNSUPPORTED,
      cleanup_support: capabilities.cleanup_support ?? CAPABILITY_LEVEL.UNSUPPORTED,
      health_check: capabilities.health_check ?? CAPABILITY_LEVEL.UNSUPPORTED,
      structured_results: capabilities.structured_results ?? CAPABILITY_LEVEL.UNSUPPORTED,
      provider_config_materialization: capabilities.provider_config_materialization ?? CAPABILITY_LEVEL.UNSUPPORTED,
    },
    metadata: {
      ...metadata,
      generated_at: new Date().toISOString(),
    },
  };
}

/**
 * Validate that a descriptor covers all required capabilities.
 * Returns { valid, missing, unsupported }.
 */
export function validateDescriptor(descriptor, { required_capabilitites = [] } = {}) {
  const missing = [];
  const unsupported = [];

  for (const cap of required_capabilitites) {
    const level = descriptor.capabilities[cap];
    if (!level) {
      missing.push(cap);
    } else if (level === CAPABILITY_LEVEL.UNSUPPORTED) {
      unsupported.push(cap);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    unsupported,
    all_capabilities: Object.entries(descriptor.capabilities)
      .filter(([_, v]) => v !== CAPABILITY_LEVEL.UNSUPPORTED)
      .map(([k]) => k),
  };
}

/**
 * Check if a capability is supported (SUPPORTED or PARTIAL).
 */
export function isCapable(descriptor, capability) {
  const level = descriptor.capabilities[capability];
  return level === CAPABILITY_LEVEL.SUPPORTED || level === CAPABILITY_LEVEL.PARTIAL;
}
