import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AutonomousHandoff, HandoffState } from './autonomous-handoff.mjs';

test('handoff persists admission and resumes after process boundary', async () => {
  const dir=mkdtempSync(join(tmpdir(),'dpt-handoff-')); let executed=0;
  const config={storageDir:dir,discover:async()=>({id:'RECONCILE',scope:'dpt'}),review:async()=>({admissible:true}),execute:async()=>({effect:'ledger-updated',repository_revision:'r2'}),verify:async(_c,r)=>({passed:r.effect==='ledger-updated'}),recertify:async()=>({safe:false})};
  const first=new AutonomousHandoff(config); const result=await first.run(); assert.equal(result.state,HandoffState.CLOSED); assert.equal(executed,0); const resumed=new AutonomousHandoff(config); const again=await resumed.run(); assert.equal(again.state,HandoffState.CLOSED); rmSync(dir,{recursive:true,force:true});
});

test('rejected candidate creates no execution', async()=>{const dir=mkdtempSync(join(tmpdir(),'dpt-handoff-'));let ran=false;const h=new AutonomousHandoff({storageDir:dir,discover:async()=>({id:'X'}),review:async()=>({admissible:false}),execute:async()=>{ran=true},verify:async()=>({passed:true}),recertify:async()=>({})});const r=await h.run();assert.equal(r.state,HandoffState.REJECTED);assert.equal(ran,false);rmSync(dir,{recursive:true,force:true});});
