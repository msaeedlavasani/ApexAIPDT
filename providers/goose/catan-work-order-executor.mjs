import { ChildProcessExecutor } from './executor-binding.mjs';

export function createCatanExecutor({ repoRoot, command = process.execPath } = {}) {
  const transport = new ChildProcessExecutor({ cwd: repoRoot, command });
  return {
    async executeStage(stage) {
      const workOrder = { task_id: `CATAN-${stage.id}`, work_order_id: `WO-CATAN-${stage.id}-${Date.now()}`, expected_outputs: stage.expected_outputs || [], acceptance_criteria: stage.acceptance_criteria || [] };
      const envelope = { envelope_id: `PE-CATAN-${stage.id}`, repository: 'msaeedlavasani/catan-online', allowed_paths: ['server/src', 'server/test'], denied_paths: ['client', 'production'] };
      return transport.execute(workOrder, envelope);
    },
  };
}
