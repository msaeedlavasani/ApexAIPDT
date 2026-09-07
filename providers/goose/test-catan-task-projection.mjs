import test from 'node:test';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { projectCatanStages } from './catan-task-projection.mjs';

test('projects Catan checkpoint stages into canonical task records', () => {
  const checkpoint = resolve(dirname(fileURLToPath(import.meta.url)), '../../.dpt/catan-authority-migration-checkpoint.json');
  const tasks = projectCatanStages(checkpoint);
  assert.ok(tasks.some(t => t.task_id === 'CATAN-LIFECYCLE' && t.status === 'READY'));
  assert.equal(tasks.every(t => t.canonical_checkpoint.endsWith('catan-authority-migration-checkpoint.json')), true);
  assert.equal(tasks.every(t => t.auto_continue === true), true);
});
