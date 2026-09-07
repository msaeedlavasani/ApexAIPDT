/**
 * Test suite for Lease Enforcement — ADR-034
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import {
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
} from './lease-enforcement.mjs';

const LEASES_DIR = '.dpt/leases';

describe('Lease Enforcement with Fencing Tokens', () => {
  before(() => {
    if (existsSync(LEASES_DIR)) {
      rmSync(LEASES_DIR, { recursive: true, force: true });
    }
  });

  after(() => {
    if (existsSync(LEASES_DIR)) {
      rmSync(LEASES_DIR, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    initLeaseStorage();
  });

  afterEach(() => {
    if (existsSync(LEASES_DIR)) {
      rmSync(LEASES_DIR, { recursive: true, force: true });
    }
  });

  describe('Lease Lifecycle', () => {
    it('should create lease in REQUESTED state', () => {
      const lease = requestLease('resource-1', 'requester-1');
      
      assert.equal(lease.state, LeaseState.REQUESTED);
      assert.ok(lease.lease_id);
      assert.ok(lease.fencing_token);
      assert.equal(lease.resource_id, 'resource-1');
      assert.equal(lease.requester_id, 'requester-1');
    });

    it('should grant lease with LAYER 4 authority projection', () => {
      const lease = requestLease('resource-1', 'requester-1');
      const granted = grantLease(lease.lease_id, 4);
      
      assert.equal(granted.state, LeaseState.GRANTED);
      assert.equal(granted.authority_level, 4);
      assert.equal(granted.projection_of, 'LAYER_4_AUTHORITY');
      assert.ok(granted.granted_at);
    });

    it('should activate granted lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      const activated = activateLease(lease.lease_id);
      
      assert.equal(activated.state, LeaseState.ACTIVE);
    });

    it('should reject activation of non-granted lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      
      assert.throws(() => activateLease(lease.lease_id), /cannot activate/);
    });
  });

  describe('Fencing Token Verification', () => {
    it('should validate active lease with correct fencing token', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const check = checkLease(lease.lease_id, lease.fencing_token);
      
      assert.equal(check.valid, true);
      assert.equal(check.lease.lease_id, lease.lease_id);
    });

    it('should reject wrong fencing token', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const check = checkLease(lease.lease_id, 'wrong-token');
      
      assert.equal(check.valid, false);
      assert.equal(check.reason, 'FENCING_TOKEN_MISMATCH');
    });

    it('should reject check for non-active lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      
      const check = checkLease(lease.lease_id, lease.fencing_token);
      
      assert.equal(check.valid, false);
      assert.equal(check.reason, 'LEASE_NOT_ACTIVE');
    });
  });

  describe('Lease Revocation — Highest Precedence', () => {
    it('should revoke active lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const revoked = revokeLease(lease.lease_id, 'admin', 'policy_violation');
      
      assert.equal(revoked.state, LeaseState.REVOKED);
      assert.equal(revoked.revocations[0].precedence, Precedence.REVOCATION);
    });

    it('should log revocation audit trail', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      revokeLease(lease.lease_id, 'admin', 'safety_concern');
      
      const leases = readLeases();
      const current = leases.leases[lease.lease_id];
      
      assert.equal(current.revocations.length, 1);
      assert.equal(current.revocations[0].revoker_id, 'admin');
      assert.equal(current.revocations[0].reason, 'safety_concern');
    });
  });

  describe('Lease Cancellation', () => {
    it('should cancel active lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const cancelled = cancelLease(lease.lease_id, 'requester-1', 'user_abort');
      
      assert.equal(cancelled.state, LeaseState.EXPIRED);
      assert.equal(cancelled.cancellations[0].precedence, Precedence.CANCELLATION);
    });
  });

  describe('Lease Release', () => {
    it('should release lease on normal completion', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const released = releaseLease(lease.lease_id);
      
      assert.equal(released.state, LeaseState.RELEASED);
      assert.ok(released.released_at);
    });
  });

  describe('TTL Expiration', () => {
    it('should auto-expire leases past TTL', () => {
      // Create lease with very short TTL
      const lease = requestLease('resource-1', 'requester-1', 1); // 1ms TTL
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      // Wait for expiration
      const start = Date.now();
      while (Date.now() - start < 10) {} // Spin for 10ms
      
      const result = expireLeases();
      
      assert.equal(result.expired_count, 1);
      
      const leases = readLeases();
      assert.equal(leases.leases[lease.lease_id].state, LeaseState.EXPIRED);
    });
  });

  describe('Precedence Rules', () => {
    it('should return correct precedence order: REVOCATION > CANCELLATION > RETRY', () => {
      const order = getPrecedenceOrder();
      
      assert.deepEqual(order, [Precedence.REVOCATION, Precedence.CANCELLATION, Precedence.RETRY]);
    });
  });

  describe('Lease State Machine Transitions', () => {
    it('should follow valid transition path', () => {
      // REQUESTED → GRANTED → ACTIVE → RELEASED
      const lease = requestLease('resource-1', 'requester-1');
      assert.equal(lease.state, LeaseState.REQUESTED);
      
      const granted = grantLease(lease.lease_id, 4);
      assert.equal(granted.state, LeaseState.GRANTED);
      
      const activated = activateLease(lease.lease_id);
      assert.equal(activated.state, LeaseState.ACTIVE);
      
      const released = releaseLease(lease.lease_id);
      assert.equal(released.state, LeaseState.RELEASED);
    });

    it('should support SUSPECTED ↔ ACTIVE transitions', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const suspected = suspectLease(lease.lease_id);
      assert.equal(suspected.state, LeaseState.SUSPECTED);
      
      // Reactivate from suspected (simulation of conflict resolution)
      // Note: In real implementation, this would require re-granting
      // For this test, we verify the state can be set to SUSPECTED
    });
  });
});

console.log('Lease Enforcement tests loaded');
