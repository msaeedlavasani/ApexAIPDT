import { createOrchestratorCore } from './orchestrator-core.mjs';
const assert = (c, n) => { if(c){console.log('  [PASS] '+n); return true;}else{console.log('  [FAIL] '+n); return false;} };
let p=0,f=0;
const a = (c,n) => { if(assert(c,n))p++;else f++; };
console.log('\n=== DPT-FOUNDATION-023: Orchestrator Core Runtime ===');
const orch = createOrchestratorCore({ tasks: new Map([
  ['DPT-FOUNDATION-023', { task_id:'DPT-FOUNDATION-023', status:'CLOSED', dependencies:[] }],
  ['DPT-FOUNDATION-024', { task_id:'DPT-FOUNDATION-024', status:'CLOSED', dependencies:['DPT-FOUNDATION-023'] }],
  ['DPT-FOUNDATION-025', { task_id:'DPT-FOUNDATION-025', status:'BACKLOG', dependencies:['DPT-FOUNDATION-023','DPT-FOUNDATION-024'] }]
])});
const r1 = await orch.computeReadiness({ task_id:'T1', dependencies:[] }); a(r1.ready, 'Task with no deps is READY');
const r2 = await orch.computeReadiness({ task_id:'T2', dependencies:['DPT-FOUNDATION-023'] }, orch.tasks); a(r2.ready, 'Task ready after dep CLOSED');
const r3 = await orch.computeReadiness({ task_id:'T3', dependencies:['DPT-FOUNDATION-023','DPT-FOUNDATION-024'] }, orch.tasks); a(r3.ready, 'Task ready after all deps CLOSED');
const r4 = await orch.computeReadiness({ task_id:'T4', dependencies:['DPT-FOUNDATION-025'] }, orch.tasks); a(!r4.ready, 'Task not ready when dep BACKLOG');
const auth = await orch.materializeAuthority({ task_id:'T1', resource_claims:[{domain:'FILESYSTEM'}] }, { permissions:[{domain:'FILESYSTEM'}], status:'ACTIVE', authority_mode:'AUTO_ALLOW' });
a(auth.authorized, 'Authority materialized with matching claims');
const noCycle = await orch.validateDAG(orch.tasks); a(noCycle, 'No cycle in DAG');
const v1 = await orch.computeV1Readiness(); a(v1.v1_complete === false, 'V1 not yet complete (runtime_proven not set)');
console.log('\nRESULTS: '+p+'/'+(p+f)+' PASS'); if(f>0){console.log('FAILURES'); process.exit(1);} else console.log('ALL PASS');
