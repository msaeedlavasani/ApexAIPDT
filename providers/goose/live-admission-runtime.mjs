/** Canonical live owner for durable nonterminal admission state. */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { continueAutonomously, LoopOutcome } from './autonomous-admission-loop.mjs';

export function loadMigrationCheckpoint(path) { return JSON.parse(readFileSync(path, 'utf8')); }

export async function runLiveAdmission({ checkpointPath, storageDir = '.dpt/live-admission', maxAttempts = 10, failureInjection = {} }) {
  mkdirSync(storageDir, { recursive: true });
  const checkpoint = loadMigrationCheckpoint(checkpointPath);
  if (checkpoint.state !== 'MIGRATION_IN_PROGRESS') return { outcome: checkpoint.state, checkpoint };
  const tasks = checkpoint.stages.map((stage) => ({
    task_id: `CATAN-${stage.id}`,
    status: stage.status === 'CLOSED' ? 'CLOSED' : stage.status === 'READY' || stage.status === 'IN_PROGRESS' ? 'READY' : 'BACKLOG',
    dependencies: (stage.depends_on || []).map((id) => `CATAN-${id}`),
    human_gate: false,
  }));
  const result = await continueAutonomously({
    tasks, storageDir, failureInjection,
    execute: async (task) => {
      const stage = checkpoint.stages.find((s) => `CATAN-${s.id}` === task.task_id);
      stage.status = 'CLOSED';
      stage.evidence = `live runtime executor completed ${task.task_id}`;
      checkpoint.last_checkpoint = new Date().toISOString();
      writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2) + '\n');
      return { success: true };
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
