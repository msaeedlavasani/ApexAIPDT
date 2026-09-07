import { readFileSync } from 'node:fs';

export function projectCatanStages(checkpointPath) {
  const checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf8'));
  return checkpoint.stages.map(stage => ({
    task_id: `CATAN-${stage.id}`,
    title: `Catan authority migration: ${stage.id}`,
    objective: `Execute and independently verify ${stage.id} through ADR-058 Work Order binding`,
    status: stage.status === 'CLOSED' ? 'CLOSED' : stage.status === 'READY' || stage.status === 'IN_PROGRESS' ? 'READY' : 'BACKLOG',
    dependencies: (stage.depends_on || []).map(id => `CATAN-${id}`),
    migration_id: checkpoint.migration_id,
    canonical_checkpoint: checkpointPath,
    auto_continue: true,
    human_gate: false,
  }));
}
