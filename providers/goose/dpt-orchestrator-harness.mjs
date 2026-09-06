/**
 * DPT Autonomous Continuation Harness
 * 
 * Implements the continuous execution loop:
 *   terminal → DAG recalc → admission → execution → validate → persist → continue
 * 
 * This harness ensures that after each task batch completes,
 * the system automatically recalculates the DAG and admits
 * the next parallel-safe work without manual intervention.
 */

import { createOrchestratorCore } from './orchestrator-core.mjs';
import { createMemoryRuntime } from './memory-runtime.mjs';
import { createWorkflowRuntime } from './workflow-runtime.mjs';
import { createQualityGateRuntime } from './qualitygate-runtime.mjs';
// Task parsing will be implemented when contract layer is fully integrated
// For now, we use direct file I/O
import { readFileSync, writeFileSync } from 'fs';
import { calculateReadiness, findAdmissibleBatch } from './dag-calculator.mjs';
import { PhaseAdmissionEnforcer } from '../contract/phase-admission-enforcer.mjs';

const DEFAULT_CONFIG = {
  maxConcurrentBatches: 5,
  continuationTimeoutMs: 30000,
  idleCheckIntervalMs: 5000,
  reportDir: 'docs/validation',
  retiredDir: 'docs/validation/Retired'
};

export class DptOrchestratorHarness {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.running = false;
    this.cycleCount = 0;
    this.lastAdmissibleWork = null;
    
    // Initialize runtime components
    this.memory = createMemoryRuntime({ dir: config.storageDir || '.dpt-state' });
    this.workflow = createWorkflowRuntime();
    this.qualityGate = createQualityGateRuntime();
    this.phaseAdmission = new PhaseAdmissionEnforcer();
  }

  /**
   * Start the autonomous continuation loop
   */
  async start() {
    if (this.running) {
      throw new Error('Harness already running');
    }
    
    this.running = true;
    console.log('[DPT-HARNESS] Starting autonomous continuation loop');
    
    try {
      await this.runCycle();
    } catch (error) {
      console.error('[DPT-HARNESS] Cycle error:', error);
      await this.persistIdleState('ERROR', error.message);
      throw error;
    }
  }

  /**
   * Run a single continuation cycle
   */
  async runCycle() {
    this.cycleCount++;
    console.log(`[DPT-HARNESS] Cycle ${this.cycleCount} started`);
    
    // Step 1: Load current state
    const tasks = await this.loadTasks();
    
    // Step 2: Recalculate readiness and DAG
    const readinessMap = await calculateReadiness(tasks);
    
    // Step 3: Find admissible work
    const admissible = findAdmissibleBatch(tasks, readinessMap);
    
    if (admissible.length === 0) {
      console.log('[DPT-HARNESS] No admissible work found, entering IDLE state');
      await this.persistIdleState('IDLE', 'No admissible work');
      this.lastAdmissibleWork = null;
      return;
    }
    
    // Step 4: Check phase admission
    const phaseCheck = await this.phaseAdmission.evaluateTransition({
      fromPhase: this.getCurrentPhase(tasks),
      toPhase: this.getRequestedPhase(admissible)
    });
    
    if (!phaseCheck.admitted) {
      console.log('[DPT-HARNESS] Phase admission blocked:', phaseCheck.reason);
      await this.persistIdleState('BLOCKED', `Phase admission: ${phaseCheck.reason}`);
      return;
    }
    
    // Step 5: Execute admissible batch
    console.log(`[DPT-HARNESS] Admitting batch of ${admissible.length} tasks`);
    this.lastAdmissibleWork = admissible;
    
    const results = await this.executeBatch(admissible);
    
    // Step 6: Validate results
    const allPassed = results.every(r => r.success);
    
    if (!allPassed) {
      console.log('[DPT-HARNESS] Batch validation failed, entering REWORK state');
      await this.handleFailure(results);
      return;
    }
    
    // Step 7: Persist terminal state
    await this.persistResults(results);
    
    // Step 8: Continue loop
    console.log('[DPT-HARNESS] Cycle complete, continuing loop');
    await this.runCycle();
  }

  /**
   * Execute a batch of tasks
   */
  async executeBatch(tasks) {
    const results = [];
    
    for (const task of tasks) {
      console.log(`[DPT-HARNESS] Executing task: ${task.id}`);
      
      try {
        const result = await this.executeTask(task);
        results.push({ task, success: true, result });
      } catch (error) {
        console.error(`[DPT-HARNESS] Task ${task.id} failed:`, error);
        results.push({ task, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Execute a single task (delegate to appropriate provider)
   */
  async executeTask(task) {
    // In a real implementation, this would:
    // 1. Materialize authority
    // 2. Select appropriate adapter/provider
    // 3. Execute with bounded context
    // 4. Collect evidence
    // 5. Validate against quality gates
    
    // For now, return placeholder
    return {
      taskId: task.id,
      status: 'COMPLETED',
      evidence: [],
      reportCreated: true
    };
  }

  /**
   * Load tasks from TASKS.md
   */
  async loadTasks() {
    try {
      // Parse TASKS.md directly (simplified implementation)
      const content = readFileSync('docs/TASKS.md', 'utf-8');
      // Extract task blocks - in real implementation, use proper parser
      const taskMatches = content.match(/### DPT-FOUNDATION-\d+.*?(?=\n### |\Z)/g) || [];
      return taskMatches.map(match => this.parseTaskBlock(match)).filter(t => t);
    } catch (error) {
      console.error('[DPT-HARNESS] Failed to load tasks:', error);
      return [];
    }
  }
  
  /**
   * Parse a task block from TASKS.md
   */
  parseTaskBlock(block) {
    const idMatch = block.match(/task_id:\s*(\S+)/);
    const statusMatch = block.match(/status:\s*(\S+)/);
    const depsMatch = block.match(/dependencies:\s*(.*)/);
    
    if (!idMatch) return null;
    
    return {
      id: idMatch[1],
      status: statusMatch ? statusMatch[1] : 'BACKLOG',
      dependencies: depsMatch ? depsMatch[1].split(',').map(s => s.trim()) : []
    };
  }

  /**
   * Get current phase from ROADMAP.md
   */
  getCurrentPhase(tasks) {
    // Implementation would parse ROADMAP.md to determine current phase
    return 'V1';
  }

  /**
   * Get requested phase from admissible tasks
   */
  getRequestedPhase(tasks) {
    // Implementation would determine target phase
    return 'V1';
  }

  /**
   * Handle task failures
   */
  async handleFailure(results) {
    const failures = results.filter(r => !r.success);
    console.log('[DPT-HARNESS] Handling', failures.length, 'failures');
    
    // Mark failed tasks as REWORK
    for (const failure of failures) {
      await updateTaskStatus(failure.task.id, 'REWORK');
    }
    
    // Persist failure report
    await this.persistResults(results);
  }

  /**
   * Persist idle state
   */
  async persistIdleState(state, reason) {
    const state_doc = {
      timestamp: new Date().toISOString(),
      state,
      reason,
      cycleCount: this.cycleCount,
      lastAdmissibleWork: this.lastAdmissibleWork
    };
    
    await this.memory.put('orchestrator_state', state_doc);
    console.log(`[DPT-HARNESS] Persisted ${state} state:`, reason);
  }

  /**
   * Persist batch results
   */
  async persistResults(results) {
    const result_doc = {
      timestamp: new Date().toISOString(),
      cycleCount: this.cycleCount,
      results,
      totalTasks: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
    
    await this.memory.put(`cycle_${this.cycleCount}`, result_doc);
    console.log(`[DPT-HARNESS] Persisted cycle ${this.cycleCount} results`);
  }

  /**
   * Stop the harness
   */
  async stop() {
    this.running = false;
    console.log('[DPT-HARNESS] Stopped');
  }

  /**
   * Check if harness is running
   */
  isRunning() {
    return this.running;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      running: this.running,
      cycleCount: this.cycleCount,
      lastAdmissibleWork: this.lastAdmissibleWork
    };
  }
}

/**
 * Create a new harness instance
 */
export function createDptOrchestratorHarness(config = {}) {
  return new DptOrchestratorHarness(config);
}

/**
 * Main entry point for standalone execution
 */
export async function main() {
  const harness = createDptOrchestratorHarness();
  
  console.log('[DPT-HARNESS] Autonomous continuation harness started');
  console.log('[DPT-HARNESS] Press Ctrl+C to stop');
  
  process.on('SIGINT', async () => {
    console.log('[DPT-HARNESS] Received SIGINT, stopping...');
    await harness.stop();
    process.exit(0);
  });
  
  await harness.start();
}

// Export for testing
export default DptOrchestratorHarness;
