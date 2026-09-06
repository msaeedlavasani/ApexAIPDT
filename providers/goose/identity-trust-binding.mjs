/**
 * Identity and Trust Binding Module
 * 
 * Implements mechanism-neutral enrollment progression:
 * Identity Establishment -> Authentication -> Trust Binding -> Gateway Admission
 * 
 * No assumptions about specific token formats, cryptographic primitives,
 * or exchange protocols. Progression defined by observable state transitions.
 */

import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const ENROLLMENTS_DIR = join(REPO_ROOT, '.dpt', 'enrollments');

/**
 * Enrollment stages in order
 */
export const ENROLLMENT_STAGES = [
  'IDENTITY_ESTABLISHMENT',
  'AUTHENTICATION',
  'TRUST_BINDING',
  'GATEWAY_ADMISSION'
];

/**
 * Entity types that can be enrolled
 */
export const ENTITY_TYPES = ['PROJECT', 'AGENT', 'SERVICE', 'ROLE'];

/**
 * Trust levels
 */
export const TRUST_LEVELS = ['NONE', 'LOW', 'MEDIUM', 'HIGH'];

/**
 * Create a new enrollment session
 */
export function createEnrollment(entityType, entityId, externalProject) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new Error('Invalid entity type: ' + entityType);
  }
  
  const enrollmentId = 'ENT-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  const enrollment = {
    enrollment_id: enrollmentId,
    stage: 'IDENTITY_ESTABLISHMENT',
    entity_type: entityType,
    entity_id: entityId,
    external_project: externalProject || null,
    identity: null,
    authentication: null,
    trust_binding: null,
    gateway_admission: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  saveEnrollment(enrollment);
  return enrollment;
}

/**
 * Establish identity for an enrollment
 */
export function establishIdentity(enrollmentId, subject, claims) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found: ' + enrollmentId);
  }
  if (enrollment.stage !== 'IDENTITY_ESTABLISHMENT') {
    throw new Error('Cannot establish identity at stage: ' + enrollment.stage);
  }
  
  enrollment.identity = {
    subject: subject,
    claims: claims || [],
    established_at: new Date().toISOString()
  };
  enrollment.updated_at = new Date().toISOString();
  
  saveEnrollment(enrollment);
  return enrollment;
}

/**
 * Authenticate an enrollment
 */
export function authenticate(enrollmentId, method, proof) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found: ' + enrollmentId);
  }
  if (enrollment.stage !== 'IDENTITY_ESTABLISHMENT' && enrollment.stage !== 'AUTHENTICATION') {
    throw new Error('Cannot authenticate at stage: ' + enrollment.stage);
  }
  if (!enrollment.identity) {
    throw new Error('Identity not established');
  }
  
  const proofHash = computeProofHash(method, proof);
  
  enrollment.authentication = {
    method: method,
    proof_hash: proofHash,
    authenticated_at: new Date().toISOString()
  };
  enrollment.stage = 'AUTHENTICATION';
  enrollment.updated_at = new Date().toISOString();
  
  saveEnrollment(enrollment);
  return enrollment;
}

/**
 * Bind trust for an enrollment
 */
export function bindTrust(enrollmentId, bindingType, trustLevel) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found: ' + enrollmentId);
  }
  if (enrollment.stage !== 'AUTHENTICATION') {
    throw new Error('Cannot bind trust at stage: ' + enrollment.stage);
  }
  if (!enrollment.authentication) {
    throw new Error('Authentication not completed');
  }
  if (!TRUST_LEVELS.includes(trustLevel)) {
    throw new Error('Invalid trust level: ' + trustLevel);
  }
  
  enrollment.trust_binding = {
    binding_type: bindingType,
    trust_level: trustLevel,
    bound_at: new Date().toISOString()
  };
  enrollment.stage = 'TRUST_BINDING';
  enrollment.updated_at = new Date().toISOString();
  
  saveEnrollment(enrollment);
  return enrollment;
}

/**
 * Admit through gateway
 */
export function admitThroughGateway(enrollmentId, admissionReason) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) {
    throw new Error('Enrollment not found: ' + enrollmentId);
  }
  if (enrollment.stage !== 'TRUST_BINDING') {
    throw new Error('Cannot admit at stage: ' + enrollment.stage);
  }
  if (!enrollment.trust_binding) {
    throw new Error('Trust binding not completed');
  }
  
  enrollment.gateway_admission = {
    admitted: true,
    admission_reason: admissionReason || 'Trust binding satisfied',
    admitted_at: new Date().toISOString()
  };
  enrollment.stage = 'GATEWAY_ADMISSION';
  enrollment.updated_at = new Date().toISOString();
  
  saveEnrollment(enrollment);
  return enrollment;
}

/**
 * Check if enrollment is complete (all stages passed)
 */
export function isEnrollmentComplete(enrollmentId) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) return false;
  return enrollment.stage === 'GATEWAY_ADMISSION' && enrollment.gateway_admission?.admitted === true;
}

/**
 * Get enrollment status summary
 */
export function getEnrollmentStatus(enrollmentId) {
  const enrollment = loadEnrollment(enrollmentId);
  if (!enrollment) return null;
  
  return {
    enrollment_id: enrollment.enrollment_id,
    entity_type: enrollment.entity_type,
    entity_id: enrollment.entity_id,
    stage: enrollment.stage,
    stage_index: ENROLLMENT_STAGES.indexOf(enrollment.stage),
    total_stages: ENROLLMENT_STAGES.length,
    is_complete: enrollment.stage === 'GATEWAY_ADMISSION',
    has_identity: !!enrollment.identity,
    has_authentication: !!enrollment.authentication,
    has_trust_binding: !!enrollment.trust_binding,
    has_gateway_admission: !!enrollment.gateway_admission,
    trust_level: enrollment.trust_binding?.trust_level || 'NONE',
    external_project: enrollment.external_project
  };
}

/**
 * List all enrollments
 */
export function listEnrollments() {
  if (!existsSync(ENROLLMENTS_DIR)) return [];
  
  const files = readdirSync(ENROLLMENTS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => loadEnrollment(f.replace('.json', '')));
}

/**
 * Helper functions
 */
function computeProofHash(method, proof) {
  const input = method + ':' + (proof || '');
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

function ensureEnrollmentsDir() {
  if (!existsSync(ENROLLMENTS_DIR)) {
    mkdirSync(ENROLLMENTS_DIR, { recursive: true });
  }
}

function getEnrollmentPath(enrollmentId) {
  return join(ENROLLMENTS_DIR, enrollmentId + '.json');
}

function saveEnrollment(enrollment) {
  ensureEnrollmentsDir();
  writeFileSync(getEnrollmentPath(enrollment.enrollment_id), JSON.stringify(enrollment, null, 2));
}

function loadEnrollment(enrollmentId) {
  const path = getEnrollmentPath(enrollmentId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}
