import { createQualityGateRuntime } from './qualitygate-runtime.mjs';
const assert = (c,n) => { if(c){console.log('  [PASS] '+n); return true;}else{console.log('  [FAIL] '+n); return false;} };
let p=0,f=0; const a=(c,n)=>{if(assert(c,n))p++;else f++;};
console.log('\n=== DPT-FOUNDATION-027: Quality Gate Runtime ===');
const qg = createQualityGateRuntime({ gates: [
  { id: 'test-pass', applies_to: ['bootstrap_tooling','implementation'], evaluate: async (r) => ({ passed: r.tests_passed >= r.tests_expected, reason: 'tests ok' }) }
]});
const pass = await qg.execute({ task_class: 'bootstrap_tooling' }, { tests_passed: 10, tests_expected: 10 });
a(pass.verified === true, 'Gate passes when conditions met');
const fail = await qg.execute({ task_class: 'bootstrap_tooling' }, { tests_passed: 5, tests_expected: 10 });
a(fail.verified === false, 'Gate fails when conditions not met');
const noMatch = await qg.execute({ task_class: 'other' }, { tests_passed: 10, tests_expected: 10 });
a(noMatch.verified === true, 'Non-matching task class passes (no gates apply)');
a(noMatch.gates_executed === 0, 'Zero gates executed for non-matching class');
console.log('\nRESULTS: '+p+'/'+(p+f)+' PASS'); if(f>0){console.log('FAILURES'); process.exit(1);} else console.log('ALL PASS');
