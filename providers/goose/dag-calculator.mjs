/**
 * DPT DAG Calculator — Canonical State Precedence Compliant
 * 
 * Calculates task readiness and finds admissible parallel batches
 * based on dependency analysis and open decision filtering.
 * 
 * Canonical Precedence (from docs/DPT_CANONICAL_STATE_PRECEDENCE_GOVERNANCE.md):
 *   1. APPEND_ONLY_TRANSITION_HISTORY    ← Latest valid event wins
 *   2. CANONICAL_RECORD                  ← Current fields after deltas applied
 *   3. FILESYSTEM_LOCATION               ← Directory as projection evidence
 *   4. EMBEDDED_METADATA                 ← Original content only when no history
 *   5. GENERATED_PROJECTION              ← Runtime-calculated, never overrides source
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const TASKS_FILE = process.env.TASKS_FILE || resolve(process.cwd(), 'docs/TASKS.md');
const OPEN_DECISIONS_FILE = process.env.OPEN_DECISIONS_FILE || resolve(process.cwd(), 'docs/DPT_OPEN_DECISIONS.md');

/**
 * Resolve current state for a task using full canonical precedence chain.
 * Returns { status, blockers, reason } compliant with canonical state model.
 */
export function resolveCurrentState(taskId, allTasks, deltaMap) {
  // Rank 1: Check delta history (append-only transition history)
  const deltas = deltaMap.get(taskId) || [];
  if (deltas.length > 0) {
    const resolved = applyDeltaChain(deltas);
    if (resolved) {
      return { status: resolved.status, source: 'delta_history', confidence: 'HIGH' };
    }
  }
  
  // Rank 2: Check canonical record ([TASK] block)
  const task = allTasks.find(t => t.id === taskId);
  if (task) {
    return { status: task.status, source: 'canonical_record', confidence: 'HIGH' };
  }
  
  // Rank 3: Filesystem location as projection evidence
  // (No filesystem authority in this model — tasks are in TASKS.md only)
  
  // Rank 4: Embedded metadata (only when higher ranks absent)
  // No additional source available
  
  // Fail closed: UNCERTAIN state
  return { status: 'UNCERTAIN', source: 'fail_closed', confidence: 'NONE', blockers: [{ id: taskId, reason: 'NOT_FOUND' }] };
}

/**
 * Apply delta chain to reconstruct final state
 */
function applyDeltaChain(deltas) {
  if (deltas.length === 0) return null;
  
  // Sort by state_revision implicitly by order in array
  let currentStatus = 'BACKLOG'; // default base state
  
  for (const delta of deltas) {
    const changes = delta.changes || '';
    
    // Extract status transitions from changes string
    const statusMatch = changes.match(/status=(\w+)/);
    if (statusMatch) {
      currentStatus = statusMatch[1];
    }
    
    // Handle compound transitions like BACKLOG→RUNNING→CLOSED
    const compoundMatch = changes.match(/status=(\w+(?:→\w+)*)/);
    if (compoundMatch) {
      const parts = compoundMatch[1].split('→');
      if (parts.length > 0) {
        currentStatus = parts[parts.length - 1]; // Final state wins
      }
    }
  }
  
  return { status: currentStatus };
}

/**
 * Parse all [DELTA] blocks from TASKS.md for delta-history reconstruction
 */
export function parseDeltasFromTASKS(tasksContent) {
  const deltaMap = new Map();
  const deltaRegex = /\[DELTA\]([\s\S]*?)\[\/DELTA\]/g;
  const taskMatchRegex = /task_id:\s*(\S+)/;
  
  let match;
  while ((match = deltaRegex.exec(tasksContent)) !== null) {
    const block = match[1];
    const taskMatch = block.match(taskMatchRegex);
    
    if (taskMatch) {
      const taskId = taskMatch[1].trim();
      if (!deltaMap.has(taskId)) {
        deltaMap.set(taskId, []);
      }
      
      // Parse delta fields
      const delta = {
        task_id: taskId,
        changes: extractField(block, 'changes') || '',
        base_state_revision: parseInt(extractField(block, 'base_state_revision') || '1', 10),
        state_revision: parseInt(extractField(block, 'state_revision') || '1', 10),
        applied_by: extractField(block, 'applied_by') || 'unknown'
      };
      
      deltaMap.get(taskId).push(delta);
    }
  }
  
  return deltaMap;
}

/**
 * Extract a field value from a key: value block
 */
function extractField(block, fieldName) {
  const regex = new RegExp(`^\\s*${fieldName}:\\s*(.+)$`, 'm');
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse all [TASK] blocks from TASKS.md
 */
export function parseTasksFromTASKS(tasksContent) {
  const tasks = [];
  const taskRegex = /\[TASK\]([\s\S]*?)\[\/TASK\]/g;
  
  let match;
  while ((match = taskRegex.exec(tasksContent)) !== null) {
    const block = match[1];
    const task = {
      id: extractField(block, 'task_id'),
      title: extractField(block, 'title'),
      objective: extractField(block, 'objective'),
      status: extractField(block, 'status') || 'BACKLOG',
      dependencies: extractDependencies(block),
      readiness: extractField(block, 'readiness') || 'NOT_READY',
      task_class: extractField(block, 'task_class'),
      required_capabilities: extractField(block, 'required_capabilities'),
      denied_capabilities: extractField(block, 'denied_capabilities'),
      delegated_authority: extractField(block, 'delegated_authority'),
      human_gate_state: extractField(block, 'human_gate_state') || 'NONE',
      passport_revision: parseInt(extractField(block, 'passport_revision') || '0', 10),
      state_revision: parseInt(extractField(block, 'state_revision') || '1', 10),
      auto_continue: extractField(block, 'auto_continue') === 'YES',
      blockedByDecisions: extractBlockedByDecisions(block)
    };
    
    if (task.id) {
      tasks.push(task);
    }
  }
  
  return tasks;
}

/**
 * Extract comma-separated dependencies
 */
function extractDependencies(block) {
  const deps = extractField(block, 'dependencies');
  if (!deps) return [];
  return deps.split(',').map(d => d.trim()).filter(d => d.length > 0);
}

/**
 * Extract blockedByDecisions field if present
 */
function extractBlockedByDecisions(block) {
  const deps = extractField(block, 'blockedByDecisions');
  if (!deps) return [];
  return deps.split(',').map(d => d.trim()).filter(d => d.length > 0);
}

/**
 * Load open decisions from DPT_OPEN_DECISIONS.md
 * Returns only genuinely OPEN decisions (not BOUND)
 */
export async function loadOpenDecisions() {
  try {
    const content = readFileSync(OPEN_DECISIONS_FILE, 'utf-8');
    return parseOpenDecisions(content);
  } catch (err) {
    console.error('[DAG-CALCULATOR] Warning: Could not load open decisions:', err.message);
    return [];
  }
}

/**
 * Parse open decisions from document content
 * Filters to only GENUINELY OPEN decisions (excludes BOUND and ACCEPTED)
 */
function parseOpenDecisions(content) {
  const decisions = [];
  
  // Match OD entries in table format: | OD-XXX | Description | Status |
  // Status may contain compound values like "BOUND at contract level; runtime lifecycle OPEN"
  const tableRegex = /\|\s*(OD-\d+)\s*\|(?:.*?)\|(.*?)\|/g;
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    const id = match[1];
    const statusText = match[2].trim().toLowerCase();
    
    // Include if status contains OPEN (even if also BOUND at contract level)
    // The actual blocking is task-local via blockedByDecisions field
    if (statusText.includes('open')) {
      decisions.push({ id, status: 'OPEN' });
    }
  }
  
  // Also check section headers like "### 3. Agent vs Skill boundary" with "**Status:** OPEN"
  const headerRegex = /\*\*Status:\*\*\s*OPEN/gi;
  while (headerRegex.exec(content) !== null) {
    // Find the section title nearby
    const lineStart = content.lastIndexOf('\n', headerRegex.lastIndex) + 1;
    const prevLine = content.slice(Math.max(0, lineStart - 100), lineStart);
    const titleMatch = prevLine.match(/###\s+(\d+\.\s+(?:Agent vs Skill|.*?))(?=\n|$)/);
    if (titleMatch) {
      const id = `OD-${String(parseInt(titleMatch[1].match(/\d+/)?.[0] || '0')).padStart(3, '0')}`;
      if (!decisions.find(d => d.id === id)) {
        decisions.push({ id, status: 'OPEN' });
      }
    }
  }
  
  console.log(`[DAG-CALCULATOR] Found ${decisions.length} OPEN decisions from document`);
  
  return decisions;
}

/**
 * Calculate readiness for all tasks using canonical precedence
 */
export async function calculateReadiness(tasks, deltaMap = new Map()) {
  const readinessMap = new Map();
  
  for (const task of tasks) {
    const ready = await calculateTaskReadiness(task, tasks, deltaMap);
    readinessMap.set(task.id, ready);
  }
  
  return readinessMap;
}

/**
 * Calculate readiness for a single task using canonical state resolution
 */
async function calculateTaskReadiness(task, allTasks, deltaMap = new Map()) {
  // Base readiness check
  if (task.status === 'CLOSED') {
    return { ready: false, reason: 'Already completed', source: 'canonical' };
  }
  
  if (task.status === 'RUNNING') {
    return { ready: false, reason: 'Already running', source: 'canonical' };
  }
  
  if (task.status !== 'BACKLOG' && task.status !== 'READY') {
    return { ready: false, reason: `Unexpected status: ${task.status}`, source: 'canonical' };
  }
  
  // Check dependencies through canonical state resolution
  const blockers = [];
  for (const depId of task.dependencies || []) {
    const canonical = resolveCurrentState(depId, allTasks, deltaMap);
    
    if (canonical.status === 'UNCERTAIN') {
      blockers.push({ id: depId, reason: 'MISSING (parser gap — check delta history)', detail: canonical });
    } else if (canonical.status !== 'CLOSED') {
      blockers.push({ id: depId, reason: `Not closed (${canonical.status})`, detail: canonical });
    }
  }
  
  if (blockers.length > 0) {
    return { ready: false, blockers, reason: 'Dependencies not met', source: 'canonical_chain' };
  }
  
  // Check open decision blocking — ONLY for tasks that explicitly reference them
  const decisionBlockers = await checkDecisionBlocks(task);
  if (decisionBlockers.length > 0) {
    return { ready: false, decisionBlockers, reason: 'Open decisions block this task', source: 'decision_filter' };
  }
  
  return { ready: true, reason: 'All dependencies met', source: 'canonical_chain' };
}

/**
 * Check if open decisions block a task
 * FIXED: Only blocks tasks that explicitly list the decision in blockedByDecisions
 */
async function checkDecisionBlocks(task) {
  const openDecisions = await loadOpenDecisions();
  const blockers = [];
  
  // Only check decisions that this task explicitly depends on
  const relevantIds = task.blockedByDecisions || [];
  
  for (const decision of openDecisions) {
    if (relevantIds.includes(decision.id)) {
      blockers.push({
        decisionId: decision.id,
        title: decision.title || `Open Decision ${decision.id}`,
        status: decision.status
      });
    }
  }
  
  return blockers;
}

/**
 * Find admissible batch of tasks
 */
export function findAdmissibleBatch(tasks, readinessMap) {
  const admissible = [];
  
  for (const task of tasks) {
    const readiness = readinessMap.get(task.id);
    if (readiness?.ready) {
      admissible.push(task);
    }
  }
  
  // Limit batch size to avoid overloading
  const maxSize = 5;
  return admissible.slice(0, maxSize);
}

/**
 * Check if work exists that is independent of open decisions
 */
export function hasIndependentWork(tasks, readinessMap) {
  const admissible = findAdmissibleBatch(tasks, readinessMap);
  return admissible.length > 0;
}

/**
 * Load and parse all tasks from TASKS.md
 */
export async function loadTasksFromTASKS() {
  try {
    const content = readFileSync(TASKS_FILE, 'utf-8');
    
    // Parse [TASK] blocks (rank 2: canonical record)
    const taskBlocks = parseTasksFromTASKS(content);
    
    // Parse [DELTA] blocks (rank 1: append-only history)
    const deltaMap = parseDeltasFromTASKS(content);
    
    // Reconstruct state for tasks that exist only in delta history
    const reconstructed = reconstructDeltaOnlyTasks(taskBlocks, deltaMap);
    
    // Merge: reconstructed tasks override/preserve canonical record fields
    const merged = mergeTasks(reconstructed, taskBlocks);
    
    return { tasks: merged, deltaMap, reconstructedCount: reconstructed.length };
  } catch (err) {
    console.error('[DAG-CALCULATOR] Error loading tasks:', err);
    return { tasks: [], deltaMap: new Map(), reconstructedCount: 0 };
  }
}

/**
 * Reconstruct tasks that exist only in delta history (no [TASK] block)
 */
function reconstructDeltaOnlyTasks(existingTasks, deltaMap) {
  const reconstructed = [];
  
  for (const [taskId, deltas] of deltaMap.entries()) {
    // Skip if task already has a [TASK] block
    if (existingTasks.some(t => t.id === taskId)) continue;
    
    const resolved = applyDeltaChain(deltas);
    if (resolved && resolved.status) {
      reconstructed.push({
        id: taskId,
        title: `Reconstructed: ${taskId}`,
        status: resolved.status,
        dependencies: [], // Will be resolved from context or known references
        readiness: resolved.status === 'CLOSED' ? 'CLOSED' : 'NOT_READY',
        task_class: 'reconstructed',
        source: 'delta_history_reconstruction'
      });
    }
  }
  
  return reconstructed;
}

/**
 * Merge existing tasks with reconstructed ones
 */
function mergeTasks(reconstructed, existing) {
  const map = new Map();
  
  // Add existing first (they have more complete metadata)
  for (const task of existing) {
    map.set(task.id, task);
  }
  
  // Add or update with reconstructed
  for (const task of reconstructed) {
    const existing = map.get(task.id);
    if (existing) {
      // Existing has priority but update status if reconstructed provides higher-confidence data
      if (task.source === 'delta_history_reconstruction') {
        existing._reconstructed = true;
        existing._deltaSource = true;
      }
    } else {
      map.set(task.id, task);
    }
  }
  
  return Array.from(map.values());
}

export default {
  calculateReadiness,
  findAdmissibleBatch,
  hasIndependentWork,
  loadTasksFromTASKS,
  resolveCurrentState,
  parseTasksFromTASKS,
  parseDeltasFromTASKS,
  loadOpenDecisions
};
