import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatanExecutor } from './catan-work-order-executor.mjs';

test('Catan stage creates bounded Work Order and Permission Envelope', async () => {
  const executor = createCatanExecutor({ repoRoot: process.cwd(), command: process.execPath });
  const result = await executor.executeStage({ id: 'LIFECYCLE' });
  assert.equal(result.success, true);
  assert.ok(result.attempt_id);
  assert.equal(result.exit_code, 0);
});
