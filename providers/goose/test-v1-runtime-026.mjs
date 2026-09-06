import { createWorkflowRuntime } from './workflow-runtime.mjs';
const assert = (c,n) => { if(c){console.log('  [PASS] '+n); return true;}else{console.log('  [FAIL] '+n); return false;} };
let p=0,f=0; const a=(c,n)=>{if(assert(c,n))p++;else f++;};
console.log('\n=== DPT-FOUNDATION-026: Workflow State Runtime ===');
const wf = createWorkflowRuntime();
a(wf.getState() === 'BACKLOG', 'Initial state is BACKLOG');
wf.transition('READY'); a(wf.getState() === 'READY', 'BACKLOG -> READY');
wf.transition('RUNNING'); a(wf.getState() === 'RUNNING', 'READY -> RUNNING');
wf.transition('REWORK'); a(wf.getState() === 'REWORK', 'RUNNING -> REWORK');
wf.transition('RUNNING'); a(wf.getState() === 'RUNNING', 'REWORK -> RUNNING');
wf.transition('CLOSED'); a(wf.getState() === 'CLOSED', 'RUNNING -> CLOSED');
a(wf.isTerminal() === true, 'CLOSED is terminal');
a(wf.canTransition('READY') === false, 'Cannot transition from CLOSED');
try { wf.transition('BACKLOG'); a(false, 'Invalid transition throws'); } catch(e) { a(true, 'Invalid transition rejected'); }
const hist = wf.getHistory(); a(hist.length > 1, 'History has entries');
a(hist[0].state === 'BACKLOG', 'History starts at BACKLOG');
console.log('\nRESULTS: '+p+'/'+(p+f)+' PASS'); if(f>0){console.log('FAILURES'); process.exit(1);} else console.log('ALL PASS');
