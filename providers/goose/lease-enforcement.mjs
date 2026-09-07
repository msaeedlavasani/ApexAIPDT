/**
 * Lease Enforcement with Fencing Tokens — ADR-034
 * 
 * Leases are projections of LAYER 4 authority, not authority sources.
 * State machine: REQUESTED → GRANTED → ACTIVE ↔ SUSPECTED → EXPIRED → RELEASED/REVOKED
 */

import { randomUUID } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LEASES_DIR = '.dpt/leases';
const LEASES_FILE = join(LEASES_DIR, 'leases.json');

export const LeaseState = {
  REQUESTED: 'LEASE_REQUESTED',
  GRANTED: 'LEASE_GRANTED',
  ACTIVE: 'LEASE_ACTIVE',
  SUSPECTED: 'LEASE_SUSPECTED',
  EXPIRED: 'LEASE_EXPIRED',
  RELEASED: 'LEASE_RELEASED',
  REVOKED: 'LEASE_REVOKED'
};

export const Precedence = {
  REVOCATION: 'REVOCATION',
  CANCELLATION: 'CANCELLATION',
  RETRY: 'RETRY'
};

/**
 * Initialize lease storage
 */
export function initLeaseStorage() {
  mkdirSync(LEASES_DIR, { recursive: true });
  
  if (!existsSync(LEASES_FILE)) {
    writeFileSync(LEASES_FILE, JSON.stringify({ leases: {}, version: 1 }, null, 2));
  }
  
  return { initialized: true, path: LEASES_FILE };
}

/**
 * Read current leases
 */
export function readLeases() {
  if (!existsSync(LEASES_FILE)) {
    initLeaseStorage();
  }
  return JSON.parse(readFileSync(LEASES_FILE, 'utf8'));
}

/**
 * Create lease request
 */
export function requestLease(resourceId, requesterId, ttlMs = 30000) {
  const leases = readLeases();
  const leaseId = randomUUID();
  const fencingToken = randomUUID();
  const now = Date.now();
  
  const lease = {
    lease_id: leaseId,
    resource_id: resourceId,
    requester_id: requesterId,
    state: LeaseState.REQUESTED,
    fencing_token: fencingToken,
    created_at: new Date(now).toISOString(),
    granted_at: null,
    expires_at: new Date(now + ttlMs).toISOString(),
    ttl_ms: ttlMs,
    revocations: [],
    cancellations: [],
    retries: []
  };
  
  leases.leases[leaseId] = lease;
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Grant lease (LAYER 4 authority projection)
 */
export function grantLease(leaseId, authorityLevel) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  if (lease.state !== LeaseState.REQUESTED) {
    throw new Error(`Lease ${leaseId} is ${lease.state}, cannot grant`);
  }
  
  lease.state = LeaseState.GRANTED;
  lease.granted_at = new Date().toISOString();
  lease.authority_level = authorityLevel;
  lease.projection_of = `LAYER_${authorityLevel}_AUTHORITY`;
  
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Activate lease
 */
export function activateLease(leaseId) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  if (lease.state !== LeaseState.GRANTED) {
    throw new Error(`Lease ${leaseId} is ${lease.state}, cannot activate`);
  }
  
  lease.state = LeaseState.ACTIVE;
  
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Check lease with fencing token — verify caller holds current token
 */
export function checkLease(leaseId, fencingToken) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    return { valid: false, reason: 'LEASE_NOT_FOUND' };
  }
  
  if (lease.state !== LeaseState.ACTIVE) {
    return { valid: false, reason: 'LEASE_NOT_ACTIVE', state: lease.state };
  }
  
  // Check TTL expiration
  if (new Date(lease.expires_at) < new Date()) {
    lease.state = LeaseState.EXPIRED;
    writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
    return { valid: false, reason: 'LEASE_EXPIRED' };
  }
  
  // Fencing token check — critical for crash recovery
  if (lease.fencing_token !== fencingToken) {
    return { valid: false, reason: 'FENCING_TOKEN_MISMATCH', expected: lease.fencing_token };
  }
  
  return { valid: true, lease };
}

/**
 * Revoke lease — highest precedence per ADR-036
 */
export function revokeLease(leaseId, revokerId, reason) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  // Store revocation for audit trail
  lease.revocations.push({
    revoker_id: revokerId,
    reason,
    revoked_at: new Date().toISOString(),
    precedence: Precedence.REVOCATION
  });
  
  lease.state = LeaseState.REVOKED;
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Cancel lease
 */
export function cancelLease(leaseId, cancellerId, reason) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  lease.cancellations.push({
    canceller_id: cancellerId,
    reason,
    cancelled_at: new Date().toISOString(),
    precedence: Precedence.CANCELLATION
  });
  
  lease.state = LeaseState.EXPIRED;
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Release lease (normal completion)
 */
export function releaseLease(leaseId) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  lease.state = LeaseState.RELEASED;
  lease.released_at = new Date().toISOString();
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Suspect lease (potential conflict detection)
 */
export function suspectLease(leaseId) {
  const leases = readLeases();
  const lease = leases.leases[leaseId];
  
  if (!lease) {
    throw new Error(`Lease ${leaseId} not found`);
  }
  
  lease.state = LeaseState.SUSPECTED;
  writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  
  return lease;
}

/**
 * Expire all expired leases
 */
export function expireLeases() {
  const leases = readLeases();
  const now = new Date();
  let expiredCount = 0;
  
  for (const [id, lease] of Object.entries(leases.leases)) {
    if (lease.state === LeaseState.ACTIVE && new Date(lease.expires_at) < now) {
      lease.state = LeaseState.EXPIRED;
      lease.expired_at = now.toISOString();
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    writeFileSync(LEASES_FILE, JSON.stringify(leases, null, 2));
  }
  
  return { expired_count: expiredCount };
}

/**
 * Get precedence order — REVOCATION > CANCELLATION > RETRY
 */
export function getPrecedenceOrder() {
  return [Precedence.REVOCATION, Precedence.CANCELLATION, Precedence.RETRY];
}

/**
 * Cleanup helper for tests
 */
export function cleanupLeases() {
  try {
    const { existsSync, rmSync } = require('node:fs');
    if (existsSync(LEASES_DIR)) {
      rmSync(LEASES_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

export default {
  initLeaseStorage,
  readLeases,
  requestLease,
  grantLease,
  activateLease,
  checkLease,
  revokeLease,
  cancelLease,
  releaseLease,
  suspectLease,
  expireLeases,
  getPrecedenceOrder,
  LeaseState,
  Precedence
};
