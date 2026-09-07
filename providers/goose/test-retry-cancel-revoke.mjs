/**
 * Test suite for Retry/Cancel/Revocation Runtime — ADR-036
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync } from 'node:fs';
import {
  initControl,
  readControl,
  submitRetry,
  submitCancellation,
  submitRevocation,
  executeControls,
  executeRevocation,
  canCompensate,
  getCompensationAction,
  getPrecedenceSummary,
  EffectType
} from './retry-cancel-revoke.mjs';
import { Precedence } from './lease-enforcement.mjs';
import {
  initLeaseStorage,
  requestLease,
  grantLease,
  activateLease,
  checkLease
} from './lease-enforcement.mjs';

const CONTROL_DIR = '.dpt/control';
const LEASES_DIR = '.dpt/leases';

describe('Retry/Cancel/Revocation Runtime', () => {
  before(() => {
    if (existsSync(CONTROL_DIR)) rmSync(CONTROL_DIR, { recursive: true, force: true });
    if (existsSync(LEASES_DIR)) rmSync(LEASES_DIR, { recursive: true, force: true });
  });

  after(() => {
    if (existsSync(CONTROL_DIR)) rmSync(CONTROL_DIR, { recursive: true, force: true });
    if (existsSync(LEASES_DIR)) rmSync(LEASES_DIR, { recursive: true, force: true });
  });

  beforeEach(() => {
    initControl();
    initLeaseStorage();
  });

  afterEach(() => {
    if (existsSync(CONTROL_DIR)) rmSync(CONTROL_DIR, { recursive: true, force: true });
    if (existsSync(LEASES_DIR)) rmSync(LEASES_DIR, { recursive: true, force: true });
  });

  describe('Control Submission', () => {
    it('should submit retry control', () => {
      const ctrl = submitRetry('attempt-1', 'transient_error');
      
      assert.equal(ctrl.type, Precedence.RETRY);
      assert.equal(ctrl.status, 'PENDING');
      assert.equal(ctrl.effect_type, EffectType.IDEMPOTENT);
      assert.ok(ctrl.control_id);
    });

    it('should submit cancellation control', () => {
      const ctrl = submitCancellation('attempt-1', 'user_abort');
      
      assert.equal(ctrl.type, Precedence.CANCELLATION);
      assert.equal(ctrl.status, 'PENDING');
    });

    it('should submit revocation control', () => {
      const ctrl = submitRevocation('attempt-1', 'admin', 'policy_violation');
      
      assert.equal(ctrl.type, Precedence.REVOCATION);
      assert.equal(ctrl.status, 'PENDING');
      assert.equal(ctrl.revoker_id, 'admin');
    });
  });

  describe('Precedence Enforcement: REVOCATION > CANCELLATION > RETRY', () => {
    it('should execute revocation with highest precedence', () => {
      submitRevocation('attempt-1', 'admin', 'critical_failure');
      submitCancellation('attempt-1', 'secondary');
      submitRetry('attempt-1', 'tertiary');
      
      const result = executeControls('attempt-1');
      
      assert.equal(result.executed.length, 3);
      assert.equal(result.executed[0].type, Precedence.REVOCATION);
      assert.equal(result.executed[0].result, 'REVOKED');
      assert.equal(result.has_blocking, true);
      
      // Lower precedence controls should be blocked
      const blocked = result.executed.filter(e => e.blocked_by === 'higher_precedence_control');
      assert.equal(blocked.length, 2);
    });

    it('should execute cancellation when no revocation exists', () => {
      submitCancellation('attempt-1', 'user_request');
      submitRetry('attempt-1', 'auto_retry');
      
      const result = executeControls('attempt-1');
      
      assert.equal(result.executed.length, 2);
      assert.equal(result.executed[0].type, Precedence.CANCELLATION);
      assert.equal(result.executed[0].result, 'CANCELLED');
      assert.equal(result.executed[1].blocked_by, 'higher_precedence_control');
    });

    it('should execute retry only when no higher precedence controls exist', () => {
      submitRetry('attempt-1', 'transient_error');
      
      const result = executeControls('attempt-1');
      
      assert.equal(result.executed.length, 1);
      assert.equal(result.executed[0].type, Precedence.RETRY);
      assert.equal(result.executed[0].result, 'RETRIED');
      assert.equal(result.has_blocking, false);
    });
  });

  describe('Effect Recovery Contract (F-302)', () => {
    it('should identify compensatable effects', () => {
      assert.equal(canCompensate(EffectType.REVERSIBLE), true);
      assert.equal(canCompensate(EffectType.COMPENSATABLE), true);
      assert.equal(canCompensate(EffectType.IDEMPOTENT), false);
      assert.equal(canCompensate(EffectType.IRREVERSIBLE), false);
    });

    it('should provide compensation actions', () => {
      const noop = getCompensationAction(EffectType.IDEMPOTENT, 'eff-1');
      assert.equal(noop.action, 'NOOP');
      
      const dedup = getCompensationAction(EffectType.REPLAY_SAFE, 'eff-1');
      assert.equal(dedup.action, 'DEDUP_CHECK');
      
      const reverse = getCompensationAction(EffectType.REVERSIBLE, 'eff-1');
      assert.equal(reverse.action, 'REVERSE');
      
      const comp = getCompensationAction(EffectType.COMPENSATABLE, 'eff-1');
      assert.equal(comp.action, 'COMPENSATE');
      
      const accept = getCompensationAction(EffectType.IRREVERSIBLE, 'eff-1');
      assert.equal(accept.action, 'ACCEPT_LOSS');
    });
  });

  describe('Revocation with Lease Check', () => {
    it('should execute revocation with valid lease', () => {
      const lease = requestLease('resource-1', 'requester-1');
      grantLease(lease.lease_id, 4);
      activateLease(lease.lease_id);
      
      const result = executeRevocation(
        'attempt-1',
        lease.lease_id,
        lease.fencing_token,
        'admin',
        'critical_failure'
      );
      
      assert.equal(result.success, true);
      assert.equal(result.control.type, Precedence.REVOCATION);
      assert.equal(result.execution.has_blocking, true);
    });

    it('should fail revocation with invalid lease', () => {
      const result = executeRevocation(
        'attempt-1',
        'nonexistent-lease',
        'token',
        'admin',
        'failure'
      );
      
      assert.equal(result.success, false);
    });
  });

  describe('Precedence Summary', () => {
    it('should report correct effective action', () => {
      submitRevocation('attempt-1', 'admin', 'failure');
      submitCancellation('attempt-1', 'user');
      submitRetry('attempt-1', 'retry');
      
      const summary = getPrecedenceSummary('attempt-1');
      
      assert.equal(summary.effective_action, 'REVOCATION');
      assert.equal(summary.has_revocation, true);
      assert.equal(summary.precedence_applied, true);
    });

    it('should report CANCELLATION when no revocation', () => {
      submitCancellation('attempt-1', 'user');
      submitRetry('attempt-1', 'retry');
      
      const summary = getPrecedenceSummary('attempt-1');
      
      assert.equal(summary.effective_action, 'CANCELLATION');
    });
  });

  describe('Event Log Integrity', () => {
    it('should log all control submissions', () => {
      submitRetry('attempt-1', 'retry_1');
      submitCancellation('attempt-1', 'cancel_1');
      submitRevocation('attempt-1', 'admin', 'revoke_1');
      
      const control = readControl();
      
      assert.equal(control.event_log.length, 3);
      assert.equal(control.event_log[0].type, 'RETRY_SUBMITTED');
      assert.equal(control.event_log[1].type, 'CANCELLATION_SUBMITTED');
      assert.equal(control.event_log[2].type, 'REVOCATION_SUBMITTED');
    });
  });
});

console.log('Retry/Cancel/Revocation tests loaded');
