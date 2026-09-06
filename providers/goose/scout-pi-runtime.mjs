/**
 * Scout + Project-Owned PI Runtime Module
 * 
 * Implements Scout component that discovers and binds to external project's
 * Project Intelligence. Front agent instance is projected FROM Scout-discovered
 * PI; it does not generate or own that intelligence.
 */

import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const SCOUTS_DIR = join(REPO_ROOT, '.dpt', 'scouts');

/**
 * Discovery statuses
 */
export const DISCOVERY_STATUSES = ['DISCOVERING', 'DISCOVERED', 'BOUND', 'ERROR'];

/**
 * Create a new Scout instance targeting an external project
 */
export function createScout(targetProject) {
  if (!targetProject.is_external_to_apex) {
    throw new Error('Scout must target external project (is_external_to_apex=true)');
  }
  
  const scoutId = 'SCOUT-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  const scout = {
    scout_id: scoutId,
    target_project: targetProject,
    discovery_status: 'DISCOVERING',
    project_intelligence: null,
    front_projection: null,
    binding: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  saveScout(scout);
  return scout;
}

/**
 * Discover Project Intelligence from external project
 */
export function discoverPI(scoutId) {
  const scout = loadScout(scoutId);
  if (!scout) {
    throw new Error('Scout not found: ' + scoutId);
  }
  if (scout.discovery_status !== 'DISCOVERING') {
    throw new Error('Cannot discover at status: ' + scout.discovery_status);
  }
  
  // Simulate PI discovery (in real implementation, this would query the external project)
  const piId = 'PI-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  scout.project_intelligence = {
    pi_id: piId,
    owner: scout.target_project.project_name,
    scope: 'external_project_context',
    trust_boundaries: ['privacy_boundary', 'authority_boundary'],
    discovered_at: new Date().toISOString()
  };
  
  scout.discovery_status = 'DISCOVERED';
  scout.updated_at = new Date().toISOString();
  
  saveScout(scout);
  return scout;
}

/**
 * Project Front agent instance FROM discovered PI
 * Front does NOT own or generate PI - it is projected FROM it
 */
export function projectFront(scoutId) {
  const scout = loadScout(scoutId);
  if (!scout) {
    throw new Error('Scout not found: ' + scoutId);
  }
  if (scout.discovery_status !== 'DISCOVERED') {
    throw new Error('Cannot project front before discovery: ' + scout.discovery_status);
  }
  if (!scout.project_intelligence) {
    throw new Error('No PI discovered');
  }
  
  const frontId = 'FRONT-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  
  scout.front_projection = {
    front_id: frontId,
    projected_from_pi: scout.project_intelligence.pi_id,
    role: 'ANALYST',
    authority_bounds: {
      max_trust_level: scout.project_intelligence.scope,
      boundaries: scout.project_intelligence.trust_boundaries
    },
    created_at: new Date().toISOString()
  };
  
  scout.updated_at = new Date().toISOString();
  
  saveScout(scout);
  return scout;
}

/**
 * Bind Scout to external project
 */
export function bindScout(scoutId, bindingType) {
  const scout = loadScout(scoutId);
  if (!scout) {
    throw new Error('Scout not found: ' + scoutId);
  }
  if (scout.discovery_status !== 'DISCOVERED') {
    throw new Error('Cannot bind before discovery');
  }
  if (!scout.front_projection) {
    throw new Error('Cannot bind before projecting front');
  }
  
  scout.binding = {
    bound_at: new Date().toISOString(),
    binding_type: bindingType || 'cross_project'
  };
  scout.discovery_status = 'BOUND';
  scout.updated_at = new Date().toISOString();
  
  saveScout(scout);
  return scout;
}

/**
 * Check if scout is fully operational
 */
export function isScoutOperational(scoutId) {
  const scout = loadScout(scoutId);
  if (!scout) return false;
  return scout.discovery_status === 'BOUND' && 
         scout.project_intelligence !== null &&
         scout.front_projection !== null &&
         scout.binding !== null;
}

/**
 * Get scout status summary
 */
export function getScoutStatus(scoutId) {
  const scout = loadScout(scoutId);
  if (!scout) return null;
  
  return {
    scout_id: scout.scout_id,
    target_project: scout.target_project,
    discovery_status: scout.discovery_status,
    has_pi: !!scout.project_intelligence,
    has_front_projection: !!scout.front_projection,
    has_binding: !!scout.binding,
    pi_id: scout.project_intelligence?.pi_id || null,
    front_id: scout.front_projection?.front_id || null,
    is_operational: isScoutOperational(scoutId)
  };
}

/**
 * List all scouts
 */
export function listScouts() {
  if (!existsSync(SCOUTS_DIR)) return [];
  
  const files = readdirSync(SCOUTS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => loadScout(f.replace('.json', '')));
}

/**
 * Helper functions
 */
function ensureScoutsDir() {
  if (!existsSync(SCOUTS_DIR)) {
    mkdirSync(SCOUTS_DIR, { recursive: true });
  }
}

function getScoutPath(scoutId) {
  return join(SCOUTS_DIR, scoutId + '.json');
}

function saveScout(scout) {
  ensureScoutsDir();
  writeFileSync(getScoutPath(scout.scout_id), JSON.stringify(scout, null, 2));
}

function loadScout(scoutId) {
  const path = getScoutPath(scoutId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { readdirSync } from 'fs';
