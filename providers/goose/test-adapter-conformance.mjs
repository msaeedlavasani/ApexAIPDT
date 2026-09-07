import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ChildProcessExecutor } from './executor-binding.mjs';

const order = { work_order_id:'WO-CONFORMANCE-1', task_id:'TASK-CONFORMANCE-1', acceptance_criteria:['effect observed'] };
const envelope = { envelope_id:'PE-CONFORMANCE-1', allowed_paths:['fixture.txt'], denied_paths:['secret.txt'] };

test('conformance: bounded child process executes and returns Attempt evidence', async () => {
  const dir = mkdtempSync('/tmp/dpt-conformance-'); const file = join(dir,'fixture.txt');
  const executor = new ChildProcessExecutor({ cwd: dir, command: process.execPath, args:['-e', `require('fs').writeFileSync('fixture.txt','changed'); process.stdout.write('effect')`] });
  const result = await executor.execute(order, envelope);
  assert.equal(result.success,true); assert.ok(result.attempt_id); assert.equal(readFileSync(file,'utf8'),'changed');
  rmSync(dir,{recursive:true,force:true});
});

test('conformance: missing or conflicting envelope fails closed', async () => {
  const executor = new ChildProcessExecutor();
  assert.equal((await executor.execute(order, {})).error,'WORK_ORDER_OR_ENVELOPE_MISSING');
  assert.equal((await executor.execute(order, {...envelope, denied_paths:['fixture.txt']})).error,'CONFLICTING_PATH_POLICY');
});

test('conformance: provider result is not verification evidence', async () => {
  const executor = new ChildProcessExecutor({ command: process.execPath, args:['-e','process.exit(0)'] });
  const result = await executor.execute(order,envelope);
  assert.equal(result.success,true); assert.equal(result.effects_verified,undefined);
});
