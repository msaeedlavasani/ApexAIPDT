/**
 * Tests for Identity and Trust Binding Module
 * 
 * Covers:
 * - Mechanism-neutral enrollment progression
 * - Stage transitions
 * - External project fixture validation
 * - Trust level enforcement
 * - Gateway admission logic
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

import {
  ENROLLMENT_STAGES,
  ENTITY_TYPES,
  TRUST_LEVELS,
  createEnrollment,
  establishIdentity,
  authenticate,
  bindTrust,
  admitThroughGateway,
  isEnrollmentComplete,
  getEnrollmentStatus,
  listEnrollments
} from './identity-trust-binding.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_DIR = join(__dirname, '.test-enrollments-staging');

// Override ENROLLMENTS_DIR for tests
const originalDir = join(process.cwd(), '.dpt', 'enrollments');

describe('Identity and Trust Binding', () => {
  before(() => {
    // Create test directory structure
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(__dirname);
  });
  
  after(() => {
    // Cleanup
    try {
      rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  
  describe('Constants', () => {
    it('should define correct enrollment stages', async () => {
      assert.deepEqual(ENROLLMENT_STAGES, [
        'IDENTITY_ESTABLISHMENT',
        'AUTHENTICATION',
        'TRUST_BINDING',
        'GATEWAY_ADMISSION'
      ]);
    });
    
    it('should define valid entity types', async () => {
      assert.deepEqual(ENTITY_TYPES, ['PROJECT', 'AGENT', 'SERVICE', 'ROLE']);
    });
    
    it('should define valid trust levels', async () => {
      assert.deepEqual(TRUST_LEVELS, ['NONE', 'LOW', 'MEDIUM', 'HIGH']);
    });
  });
  
  describe('createEnrollment', () => {
    it('should create enrollment with IDENTITY_ESTABLISHMENT stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'test-project-001', {
        repository_url: 'https://github.com/example/test-project',
        project_name: 'Test Project',
        is_external_to_apex: true
      });
      
      assert.ok(enrollment.enrollment_id.startsWith('ENT-'));
      assert.equal(enrollment.stage, 'IDENTITY_ESTABLISHMENT');
      assert.equal(enrollment.entity_type, 'PROJECT');
      assert.equal(enrollment.entity_id, 'test-project-001');
      assert.equal(enrollment.external_project.is_external_to_apex, true);
      assert.ok(enrollment.created_at);
      assert.ok(enrollment.updated_at);
    });
    
    it('should reject invalid entity type', async () => {
      assert.throws(() => {
        createEnrollment('INVALID', 'test', {});
      }, /Invalid entity type/);
    });
    
    it('should create enrollment without external project', async () => {
      const enrollment = createEnrollment('AGENT', 'agent-001');
      
      assert.equal(enrollment.external_project, null);
      assert.equal(enrollment.entity_type, 'AGENT');
    });
  });
  
  describe('Identity Establishment', () => {
    it('should establish identity and advance stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-001');
      const eid = enrollment.enrollment_id;
      
      const result = establishIdentity(eid, 'subject-001', ['claim1', 'claim2']);
      
      assert.ok(result.identity);
      assert.equal(result.identity.subject, 'subject-001');
      assert.deepEqual(result.identity.claims, ['claim1', 'claim2']);
      assert.ok(result.identity.established_at);
      assert.equal(result.stage, 'IDENTITY_ESTABLISHMENT');
    });
    
    it('should allow re-establishing identity (idempotent)', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-002');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-002');
      
      // Identity establishment is idempotent - allows re-setting
      const result = establishIdentity(eid, 'another-subject');
      assert.equal(result.identity.subject, 'another-subject');
    });
    
    it('should fail for non-existent enrollment', async () => {
      assert.throws(() => {
        establishIdentity('ENT-NONEXISTENT', 'subject');
      }, /Enrollment not found/);
    });
  });
  
  describe('Authentication', () => {
    it('should authenticate and advance stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-003');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-003');
      const result = authenticate(eid, 'token', 'valid-token-value');
      
      assert.ok(result.authentication);
      assert.equal(result.authentication.method, 'token');
      assert.ok(result.authentication.proof_hash.startsWith('h_'));
      assert.ok(result.authentication.authenticated_at);
      assert.equal(result.stage, 'AUTHENTICATION');
    });
    
    it('should fail if identity not established', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-004');
      const eid = enrollment.enrollment_id;
      
      assert.throws(() => {
        authenticate(eid, 'token', 'value');
      }, /Identity not established/);
    });
  });
  
  describe('Trust Binding', () => {
    it('should bind trust and advance stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-005');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-005');
      authenticate(eid, 'token', 'value');
      const result = bindTrust(eid, 'policy-based', 'MEDIUM');
      
      assert.ok(result.trust_binding);
      assert.equal(result.trust_binding.binding_type, 'policy-based');
      assert.equal(result.trust_binding.trust_level, 'MEDIUM');
      assert.ok(result.trust_binding.bound_at);
      assert.equal(result.stage, 'TRUST_BINDING');
    });
    
    it('should fail with invalid trust level', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-006');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-006');
      authenticate(eid, 'token', 'value');
      
      assert.throws(() => {
        bindTrust(eid, 'policy', 'INVALID');
      }, /Invalid trust level/);
    });
    
    it('should fail if not at AUTHENTICATION stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-007');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-007');
      
      assert.throws(() => {
        bindTrust(eid, 'policy', 'LOW');
      }, /Cannot bind trust at stage/);
    });
  });
  
  describe('Gateway Admission', () => {
    it('should admit through gateway and complete enrollment', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-008');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-008');
      authenticate(eid, 'token', 'value');
      bindTrust(eid, 'policy-based', 'HIGH');
      
      const result = admitThroughGateway(eid, 'All trust requirements satisfied');
      
      assert.ok(result.gateway_admission);
      assert.equal(result.gateway_admission.admitted, true);
      assert.equal(result.gateway_admission.admission_reason, 'All trust requirements satisfied');
      assert.ok(result.gateway_admission.admitted_at);
      assert.equal(result.stage, 'GATEWAY_ADMISSION');
    });
    
    it('should fail if not at TRUST_BINDING stage', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-009');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-009');
      authenticate(eid, 'token', 'value');
      
      assert.throws(() => {
        admitThroughGateway(eid);
      }, /Cannot admit at stage/);
    });
  });
  
  describe('isEnrollmentComplete', () => {
    it('should return true for completed enrollment', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-010');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-010');
      authenticate(eid, 'token', 'value');
      bindTrust(eid, 'policy', 'MEDIUM');
      admitThroughGateway(eid);
      
      assert.equal(isEnrollmentComplete(eid), true);
    });
    
    it('should return false for incomplete enrollment', async () => {
      const enrollment = createEnrollment('PROJECT', 'project-011');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-011');
      
      assert.equal(isEnrollmentComplete(eid), false);
    });
    
    it('should return false for non-existent enrollment', async () => {
      assert.equal(isEnrollmentComplete('ENT-NONEXISTENT'), false);
    });
  });
  
  describe('getEnrollmentStatus', () => {
    it('should return complete status summary', async () => {
      const enrollment = createEnrollment('AGENT', 'agent-012');
      const eid = enrollment.enrollment_id;
      
      establishIdentity(eid, 'subject-012');
      authenticate(eid, 'method', 'proof');
      bindTrust(eid, 'type', 'HIGH');
      admitThroughGateway(eid);
      
      const status = getEnrollmentStatus(eid);
      
      assert.equal(status.enrollment_id, eid);
      assert.equal(status.entity_type, 'AGENT');
      assert.equal(status.stage, 'GATEWAY_ADMISSION');
      assert.equal(status.is_complete, true);
      assert.equal(status.has_identity, true);
      assert.equal(status.has_authentication, true);
      assert.equal(status.has_trust_binding, true);
      assert.equal(status.has_gateway_admission, true);
      assert.equal(status.trust_level, 'HIGH');
    });
    
    it('should return null for non-existent enrollment', async () => {
      const status = getEnrollmentStatus('ENT-NONEXISTENT');
      assert.equal(status, null);
    });
  });
  
  describe('listEnrollments', () => {
    it('should list existing enrollments', async () => {
      const e1 = createEnrollment('PROJECT', 'list-test-1');
      const e2 = createEnrollment('AGENT', 'list-test-2');
      
      const enrollments = listEnrollments();
      // At minimum should have the two we just created
      assert.ok(enrollments.length >= 2);
      assert.ok(enrollments.some(e => e.enrollment_id === e1.enrollment_id));
      assert.ok(enrollments.some(e => e.enrollment_id === e2.enrollment_id));
    });
  });
  
  describe('End-to-end enrollment flow', () => {
    it('should complete full enrollment chain', async () => {
      // Create enrollment with external project
      const enrollment = createEnrollment('PROJECT', 'external-project-e2e', {
        repository_url: 'https://github.com/external/repo',
        project_name: 'External Project E2E',
        is_external_to_apex: true
      });
      const eid = enrollment.enrollment_id;
      
      // Step 1: Identity Establishment
      const step1 = establishIdentity(eid, 'external-agent', ['project_member']);
      assert.equal(step1.stage, 'IDENTITY_ESTABLISHMENT');
      assert.ok(step1.identity);
      
      // Step 2: Authentication
      const step2 = authenticate(eid, 'protocol-proof', 'evidence-data');
      assert.equal(step2.stage, 'AUTHENTICATION');
      assert.ok(step2.authentication);
      
      // Step 3: Trust Binding
      const step3 = bindTrust(eid, 'cross-project-policy', 'HIGH');
      assert.equal(step3.stage, 'TRUST_BINDING');
      assert.ok(step3.trust_binding);
      
      // Step 4: Gateway Admission
      const step4 = admitThroughGateway(eid, 'External project trust verified');
      assert.equal(step4.stage, 'GATEWAY_ADMISSION');
      assert.ok(step4.gateway_admission);
      assert.equal(step4.gateway_admission.admitted, true);
      
      // Verify completion
      assert.equal(isEnrollmentComplete(eid), true);
      
      const status = getEnrollmentStatus(eid);
      assert.equal(status.is_complete, true);
      assert.equal(status.trust_level, 'HIGH');
      assert.equal(status.external_project.is_external_to_apex, true);
    });
  });
});

console.log('Running Identity and Trust Binding tests...\n');
