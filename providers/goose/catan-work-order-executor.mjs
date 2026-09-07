import { ChildProcessExecutor } from './executor-binding.mjs';
import { instructionsFor } from './catan-stage-instructions.mjs';

export function createCatanExecutor({ repoRoot, command = process.execPath } = {}) {
  const transport = new ChildProcessExecutor({ cwd: repoRoot, command });
  return {
    async executeStage(stage) {
      const instructions = instructionsFor(stage.id);
      if (!instructions) return { success: false, error: 'NO_STAGE_INSTRUCTIONS' };
      const workOrder = { task_id: `CATAN-${stage.id}`, work_order_id: `WO-CATAN-${stage.id}-${Date.now()}`, expected_outputs: instructions.effects, acceptance_criteria: instructions.effects, inputs: { objective: instructions.objective, allowed_paths: instructions.allowed_paths, commands: instructions.commands } };
      const envelope = { envelope_id: `PE-CATAN-${stage.id}`, repository: 'msaeedlavasani/catan-online', allowed_paths: ['server/src', 'server/test'], denied_paths: ['client', 'production'] };
      return transport.execute(workOrder, envelope);
    },
  };
}
