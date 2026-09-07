import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLiveAdmission } from './live-admission-runtime.mjs';

test('live entrypoint owns checkpoint recovery and advances ready stage', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dpt-live-'));
  const checkpointPath = join(dir, 'catan.json');
  writeFileSync(checkpointPath, JSON.stringify({ state:'MIGRATION_IN_PROGRESS', stages:[
    {id:'INVENTORY',status:'CLOSED'}, {id:'STORE_CONTRACT',status:'CLOSED',depends_on:['INVENTORY']},
    {id:'LIFECYCLE',status:'READY',depends_on:['STORE_CONTRACT']}, {id:'GAME_ACTIONS',status:'READY',depends_on:['LIFECYCLE']}
  ]}));
  const first = await runLiveAdmission({ checkpointPath, storageDir:join(dir,'runtime'), failureInjection:{ADMISSION:true} });
  assert.ok(['EXHAUSTED_GRAPH','PROVEN_BLOCKER'].includes(first.outcome));
  assert.ok(['CLOSED','READY'].includes(first.checkpoint.stages.find(s=>s.id==='LIFECYCLE').status));
  assert.ok(['CLOSED','READY'].includes(first.checkpoint.stages.find(s=>s.id==='GAME_ACTIONS').status));
  assert.equal(first.checkpoint.runtime_owner, 'live-admission-runtime');
  assert.match(readFileSync(checkpointPath,'utf8'), /runtime_owner/);
  rmSync(dir,{recursive:true,force:true});
});
