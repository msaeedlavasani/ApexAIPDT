/** Canonical live owner for durable nonterminal admission state. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { continueAutonomously, LoopOutcome } from './autonomous-admission-loop.mjs';
import { projectCatanStages } from './catan-task-projection.mjs';
import { createCatanExecutor } from './catan-work-order-executor.mjs';

export function loadMigrationCheckpoint(path) { return JSON.parse(readFileSync(path, 'utf8')); }

export async function runLiveAdmission({ checkpointPath, storageDir = '.dpt/live-admission', maxAttempts = 10, failureInjection = {} }) {
  mkdirSync(storageDir, { recursive: true });
  const checkpoint = loadMigrationCheckpoint(checkpointPath);
  if (checkpoint.state !== 'MIGRATION_IN_PROGRESS') return { outcome: checkpoint.state, checkpoint };
  const tasks = projectCatanStages(checkpointPath);
  const catanExecutor = createCatanExecutor({ repoRoot: '/Users/msl/Documents/GitHub/catan-online' });
  const result = await continueAutonomously({
    tasks, storageDir, failureInjection,
    execute: async (task) => {
      const stage = checkpoint.stages.find((s) => `CATAN-${s.id}` === task.task_id);
      const result = await catanExecutor.executeStage(stage);
      if (!result.success) return result;
      if (!result.effects_verified) return { success: false, error: 'EFFECT_VERIFICATION_REQUIRED', attempt_id: result.attempt_id, runtime_id: result.runtime_id };
      stage.status = 'CLOSED';
      stage.evidence = `Work Order ${result.attempt_id} executed and independently verified`;
      checkpoint.last_checkpoint = new Date().toISOString();
      writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2) + '\n');
      return result;
    },
  }, { maxAttempts });
  const remaining = checkpoint.stages.some((s) => s.status === 'READY' || s.status === 'IN_PROGRESS');
  if (!remaining && result.outcome === LoopOutcome.EXHAUSTED_GRAPH) checkpoint.state = 'MIGRATION_EXECUTION_COMPLETE';
  checkpoint.runtime_owner = 'live-admission-runtime';
  checkpoint.last_outcome = result.outcome;
  checkpoint.last_checkpoint = new Date().toISOString();
  writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2) + '\n');
  return { ...result, checkpoint };
}

export async function main() {
  const root = resolve(new URL('..', import.meta.url).pathname, '..');
  return runLiveAdmission({ checkpointPath: join(root, '.dpt/catan-authority-migration-checkpoint.json'), storageDir: join(root, '.dpt/live-admission') });
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main().then(r => console.log(JSON.stringify({ outcome: r.outcome, attempts: r.attempts }))).catch(e => { console.error(e); process.exitCode = 1; });
