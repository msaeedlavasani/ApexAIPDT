/**
 * Front Runtime + Gateway Boundary Service Module
 * 
 * Implements Front runtime operating within gateway-enforced protocol boundary.
 * Front is project-bound ROLE/AGENT_INSTANCE; Gateway is deterministic SERVICE.
 */

import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const FRONTURES_DIR = join(REPO_ROOT, '.dpt', 'frontures');

/**
 * Enforcement modes
 */
export const ENFORCEMENT_MODES = ['STRICT', 'PERMISSIVE', 'OBSERVE'];

/**
 * Create a new Front instance with Gateway boundary
 */
export function createFront(gatewayId, role, projectBoundTo, authorityBounds) {
  const frontId = 'FRONT-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  const fronture = {
    front_id: frontId,
    gateway_id: gatewayId,
    protocol_version: 'v3.0',
    front: {
      role: role || 'ANALYST',
      authority_bounds: authorityBounds || {},
      project_bound_to: projectBoundTo,
      created_at: new Date().toISOString()
    },
    gateway: null,
    boundaries: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  saveFronture(fronture);
  return fronture;
}

/**
 * Initialize Gateway for a Front
 */
export function initializeGateway(frontId, enforcementMode, allowedOps, blockedOps) {
  const fronture = loadFronture(frontId);
  if (!fronture) {
    throw new Error('Front not found: ' + frontId);
  }
  if (fronture.gateway) {
    throw new Error('Gateway already initialized');
  }
  if (!ENFORCEMENT_MODES.includes(enforcementMode)) {
    throw new Error('Invalid enforcement mode: ' + enforcementMode);
  }
  
  fronture.gateway = {
    enforcement_mode: enforcementMode,
    allowed_operations: allowedOps || [],
    blocked_operations: blockedOps || [],
    active_since: new Date().toISOString()
  };
  fronture.updated_at = new Date().toISOString();
  
  saveFronture(fronture);
  return fronture;
}

/**
 * Set protocol boundaries
 */
export function setBoundaries(frontId, maxContextSize, allowedDataTypes, privacyThreshold) {
  const fronture = loadFronture(frontId);
  if (!fronture) {
    throw new Error('Front not found: ' + frontId);
  }
  if (!fronture.gateway) {
    throw new Error('Gateway not initialized');
  }
  
  fronture.boundaries = {
    max_context_size: maxContextSize || 10000,
    allowed_data_types: allowedDataTypes || [],
    privacy_threshold: privacyThreshold || 'INTERNAL'
  };
  fronture.updated_at = new Date().toISOString();
  
  saveFronture(fronture);
  return fronture;
}

/**
 * Check if operation is allowed by gateway
 */
export function checkOperation(frontId, operation) {
  const fronture = loadFronture(frontId);
  if (!fronture) return { allowed: false, reason: 'Front not found' };
  if (!fronture.gateway) return { allowed: false, reason: 'Gateway not initialized' };
  
  const { allowed_operations, blocked_operations, enforcement_mode } = fronture.gateway;
  
  // In STRICT mode, blocked operations always fail
  if (blocked_operations.includes(operation)) {
    return { allowed: false, reason: 'Operation blocked by gateway' };
  }
  
  // In STRICT mode, must be explicitly allowed
  if (enforcement_mode === 'STRICT' && !allowed_operations.includes(operation)) {
    return { allowed: false, reason: 'Operation not in allowed list (STRICT mode)' };
  }
  
  return { allowed: true, reason: 'Operation permitted' };
}

/**
 * Execute operation within gateway bounds
 */
export function executeWithinBounds(frontId, operation, data) {
  const check = checkOperation(frontId, operation);
  if (!check.allowed) {
    throw new Error('Operation not allowed: ' + check.reason);
  }
  
  const fronture = loadFronture(frontId);
  if (fronture.boundaries && data && data.length > fronture.boundaries.max_context_size) {
    throw new Error('Data exceeds max context size');
  }
  
  return {
    operation: operation,
    result: 'executed',
    bounds_respected: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if Front is operational
 */
export function isFrontOperational(frontId) {
  const fronture = loadFronture(frontId);
  if (!fronture) return false;
  return fronture.gateway !== null && fronture.boundaries !== null;
}

/**
 * Get Front status
 */
export function getFrontStatus(frontId) {
  const fronture = loadFronture(frontId);
  if (!fronture) return null;
  
  return {
    front_id: fronture.front_id,
    gateway_id: fronture.gateway_id,
    role: fronture.front?.role,
    project_bound_to: fronture.front?.project_bound_to,
    has_gateway: !!fronture.gateway,
    has_boundaries: !!fronture.boundaries,
    enforcement_mode: fronture.gateway?.enforcement_mode || null,
    is_operational: isFrontOperational(frontId)
  };
}

/**
 * List all fronts
 */
export function listFronts() {
  if (!existsSync(FRONTURES_DIR)) return [];
  
  const files = readdirSync(FRONTURES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => loadFronture(f.replace('.json', '')));
}

/**
 * Helper functions
 */
function ensureFronturesDir() {
  if (!existsSync(FRONTURES_DIR)) {
    mkdirSync(FRONTURES_DIR, { recursive: true });
  }
}

function getFronturePath(frontId) {
  return join(FRONTURES_DIR, frontId + '.json');
}

function saveFronture(fronture) {
  ensureFronturesDir();
  writeFileSync(getFronturePath(fronture.front_id), JSON.stringify(fronture, null, 2));
}

function loadFronture(frontId) {
  const path = getFronturePath(frontId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { readdirSync } from 'fs';
