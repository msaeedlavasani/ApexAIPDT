/**
 * Reference Transport Module (V3-008)
 * 
 * Validates one reference transport for update propagation across projects.
 * Supports multiple transport types: GIT_REFERENCE, API_CALLBACK, EVENT_STREAM, MANUAL_REVIEW.
 */

import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

const TRANSPORT_TYPES = {
  GIT_REFERENCE: 'GIT_REFERENCE',
  API_CALLBACK: 'API_CALLBACK',
  EVENT_STREAM: 'EVENT_STREAM',
  MANUAL_REVIEW: 'MANUAL_REVIEW'
};

const PROPAGATION_STATUSES = {
  PENDING: 'PENDING',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  FAILED: 'FAILED'
};

/** In-memory store */
export const transports = new Map();

/**
 * Create a new reference transport
 */
export function createTransport(sourceProject, destinationProject, transportType = TRANSPORT_TYPES.GIT_REFERENCE) {
  const transportId = 'TRNS-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  if (!Object.values(TRANSPORT_TYPES).includes(transportType)) {
    throw new Error(`Invalid transport type: ${transportType}. Must be one of: ${Object.values(TRANSPORT_TYPES).join(', ')}`);
  }
  
  const transport = {
    transport_id: transportId,
    source: sourceProject,
    destination: destinationProject,
    transport_type: transportType,
    propagation_status: PROPAGATION_STATUSES.PENDING,
    update_hash: null,
    acknowledged_by: null,
    delivered_at: null,
    acknowledged_at: null,
    created_at: new Date().toISOString()
  };
  
  transports.set(transportId, transport);
  return transport;
}

/**
 * Stage an update for transport
 */
export function stageUpdate(transportId, updateData) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  
  if (transport.propagation_status !== PROPAGATION_STATUSES.PENDING) {
    throw new Error(`Cannot stage: transport not in PENDING status`);
  }
  
  // Compute hash for integrity verification
  const hash = createHash('sha256')
    .update(JSON.stringify(updateData))
    .digest('hex');
  
  transport.update_hash = hash;
  transport.updated_data = updateData;
  return transport;
}

/**
 * Initiate propagation
 */
export function initiatePropagation(transportId) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  
  if (!transport.update_hash) {
    throw new Error(`Cannot initiate: no staged update`);
  }
  
  transport.propagation_status = PROPAGATION_STATUSES.IN_TRANSIT;
  return transport;
}

/**
 * Mark as delivered
 */
export function markDelivered(transportId) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  
  if (transport.propagation_status !== PROPAGATION_STATUSES.IN_TRANSIT) {
    throw new Error(`Cannot mark delivered: not in IN_TRANSIT status`);
  }
  
  transport.propagation_status = PROPAGATION_STATUSES.DELIVERED;
  transport.delivered_at = new Date().toISOString();
  return transport;
}

/**
 * Acknowledge receipt
 */
export function acknowledgeReceipt(transportId, acknowledgingProject) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  
  if (transport.propagation_status !== PROPAGATION_STATUSES.DELIVERED) {
    throw new Error(`Cannot acknowledge: not in DELIVERED status`);
  }
  
  transport.propagation_status = PROPAGATION_STATUSES.ACKNOWLEDGED;
  transport.acknowledged_by = acknowledgingProject;
  transport.acknowledged_at = new Date().toISOString();
  return transport;
}

/**
 * Verify update integrity
 */
export function verifyIntegrity(transportId, receivedData) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  
  if (!transport.update_hash) {
    return { valid: false, reason: 'No hash recorded' };
  }
  
  const computedHash = createHash('sha256')
    .update(JSON.stringify(receivedData))
    .digest('hex');
  
  return {
    valid: computedHash === transport.update_hash,
    expected_hash: transport.update_hash,
    computed_hash: computedHash
  };
}

/**
 * Get transport details
 */
export function getTransport(transportId) {
  return transports.get(transportId) || null;
}

/**
 * List all transports
 */
export function listTransports() {
  return Array.from(transports.values());
}

/**
 * List active transports (not completed)
 */
export function listActiveTransports() {
  const completedStatuses = [PROPAGATION_STATUSES.ACKNOWLEDGED, PROPAGATION_STATUSES.FAILED];
  return Array.from(transports.values())
    .filter(t => !completedStatuses.includes(t.propagation_status));
}

export default {
  createTransport,
  stageUpdate,
  initiatePropagation,
  markDelivered,
  acknowledgeReceipt,
  verifyIntegrity,
  getTransport,
  listTransports,
  listActiveTransports
};
