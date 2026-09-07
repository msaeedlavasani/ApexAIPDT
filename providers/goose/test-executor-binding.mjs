import test from 'node:test';
import assert from 'node:assert/strict';
import { ChildProcessExecutor } from './executor-binding.mjs';

test('child transport executes a bounded Work Order after envelope preflight', async () => {
  const executor = new ChildProcessExecutor({ command: process.execPath, args: ['-e', 'process.stdout.write(process.env.DPT_WORK_ORDER_ID)'] });
  const result = await executor.execute({ work_order_id: 'WO-1' }, { envelope_id: 'PE-1' });
  assert.equal(result.success, true); assert.equal(result.stdout, 'WO-1'); assert.ok(result.attempt_id); assert.ok(result.runtime_id);
});

test('missing Work Order or envelope fails closed', async () => {
  const executor = new ChildProcessExecutor();
  assert.equal((await executor.execute({}, { envelope_id: 'PE' })).success, false);
  assert.equal((await executor.execute({ work_order_id: 'WO' }, {})).success, false);
});
