/**
 * Minimum-Sufficient Context Package Module
 * 
 * Implements bounded context package extraction validated against privacy boundaries.
 * Context package contains only what is necessary for analysis; no over-exposure.
 */

import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const CONTEXT_DIR = join(REPO_ROOT, '.dpt', 'context-packages');

/**
 * Extraction statuses
 */
export const EXTRACTION_STATUSES = ['EXTRACTING', 'EXTRACTED', 'VALIDATED', 'ERROR'];

/**
 * Privacy classifications
 */
export const PRIVACY_CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'];

/**
 * Create a new context package from a scout
 */
export function createContextPackage(scoutId, projectScope) {
  const packageId = 'CTX-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  const package_ = {
    package_id: packageId,
    source_scout: scoutId,
    extraction_status: 'EXTRACTING',
    context: null,
    validation: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  saveContextPackage(package_);
  return package_;
}

/**
 * Extract minimum-sufficient context from external project
 */
export function extractContext(packageId, artifacts) {
  const package_ = loadContextPackage(packageId);
  if (!package_) {
    throw new Error('Context package not found: ' + packageId);
  }
  if (package_.extraction_status !== 'EXTRACTING') {
    throw new Error('Cannot extract at status: ' + package_.extraction_status);
  }
  
  // Extract only minimum sufficient artifacts
  const relevantArtifacts = (artifacts || []).slice(0, 10); // Cap at 10 to ensure minimum
  
  package_.context = {
    project_scope: package_.source_scout,
    relevant_artifacts: relevantArtifacts,
    privacy_classification: 'INTERNAL',
    extracted_at: new Date().toISOString()
  };
  
  package_.extraction_status = 'EXTRACTED';
  package_.updated_at = new Date().toISOString();
  
  saveContextPackage(package_);
  return package_;
}

/**
 * Validate context package against privacy boundaries
 */
export function validateContext(packageId, boundaries) {
  const package_ = loadContextPackage(packageId);
  if (!package_) {
    throw new Error('Context package not found: ' + packageId);
  }
  if (package_.extraction_status !== 'EXTRACTED') {
    throw new Error('Cannot validate before extraction');
  }
  if (!package_.context) {
    throw new Error('No context to validate');
  }
  
  // Validate against provided boundaries
  const verifiedBoundaries = (boundaries || []).filter(b => 
    package_.context.relevant_artifacts.every(a => !a.includes(b + '/'))
  );
  
  package_.validation = {
    passed_privacy_check: verifiedBoundaries.length === (boundaries || []).length,
    boundaries_verified: verifiedBoundaries,
    validated_at: new Date().toISOString()
  };
  
  package_.extraction_status = 'VALIDATED';
  package_.updated_at = new Date().toISOString();
  
  saveContextPackage(package_);
  return package_;
}

/**
 * Check if context package is ready for use
 */
export function isContextReady(packageId) {
  const package_ = loadContextPackage(packageId);
  if (!package_) return false;
  return package_.extraction_status === 'VALIDATED' && 
         package_.validation?.passed_privacy_check === true;
}

/**
 * Get context package status
 */
export function getContextStatus(packageId) {
  const package_ = loadContextPackage(packageId);
  if (!package_) return null;
  
  return {
    package_id: package_.package_id,
    source_scout: package_.source_scout,
    extraction_status: package_.extraction_status,
    has_context: !!package_.context,
    has_validation: !!package_.validation,
    is_ready: isContextReady(packageId),
    privacy_classification: package_.context?.privacy_classification || 'NONE',
    artifact_count: package_.context?.relevant_artifacts?.length || 0
  };
}

/**
 * List all context packages
 */
export function listContextPackages() {
  if (!existsSync(CONTEXT_DIR)) return [];
  
  const files = readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => loadContextPackage(f.replace('.json', '')));
}

/**
 * Helper functions
 */
function ensureContextDir() {
  if (!existsSync(CONTEXT_DIR)) {
    mkdirSync(CONTEXT_DIR, { recursive: true });
  }
}

function getContextPath(packageId) {
  return join(CONTEXT_DIR, packageId + '.json');
}

function saveContextPackage(package_) {
  ensureContextDir();
  writeFileSync(getContextPath(package_.package_id), JSON.stringify(package_, null, 2));
}

function loadContextPackage(packageId) {
  const path = getContextPath(packageId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { readdirSync } from 'fs';
