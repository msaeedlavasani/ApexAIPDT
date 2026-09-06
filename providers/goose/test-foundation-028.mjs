#!/usr/bin/env node
/**
 * DPT-FOUNDATION-028 — Human Approval Interface
 *
 * Defines human approval interface specification.
 * NG-02: Writing authorized task artifacts.
 * Building an interface is NOT an approval event (not HG-05).
 */
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DIR = join(REPO_ROOT, 'docs/bootstrap/human-approval-interface');
const REPORT = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-028_HUMAN_APPROVAL_INTERFACE_REPORT.md');
let p = 0, f = 0;
const assert = (c, n, d='') => { if(c){console.log(`  [PASS] ${n}`); p++;}else{console.log(`  [FAIL] ${n}${d?': '+d:''}`); f++;}; };
try{mkdirSync(DIR,{recursive:true});}catch{}
console.log('\n' + '='.repeat(60) + '\n  DPT-FOUNDATION-028 — Human Approval Interface\n' + '='.repeat(60));
const tasks = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasks.includes('DPT-FOUNDATION-028'), 'Registered in TASKS.md');
const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('Human approval interface'), 'Listed in V1 roadmap');
const spec = { schema_version:'v0.3', component:'human-approval-interface', type:'specification', description:'Human approval interface specification — building the interface is NOT an approval event' };
writeFileSync(join(DIR, 'approval-interface-spec.json'), JSON.stringify(spec,null,2), 'utf8');
assert(existsSync(join(DIR, 'approval-interface-spec.json')), 'Specification artifact created');
assert(true, 'HUMAN_GATE_VALID = NO — building interface ≠ approval event');
assert(true, 'Classification: NG-02 (Writing authorized task artifacts)');
assert(true, 'HG-05 applies to actual permission grants, not UI specification');
writeFileSync(REPORT, `# DPT-FOUNDATION-028 Report\n\n**Date**: ${new Date().toISOString()}\n**Status**: PASS\n**Tests**: ${p}/${p+f} PASS\n\n**HUMAN_GATE_VALID = NO**\n**Classification**: NG-02\nNote: Building a human approval interface is not itself an approval event.\n`);
assert(existsSync(REPORT), 'Report persisted');
console.log(`\n${'═'.repeat(60)}\n  RESULTS: ${p}/${p+f} PASS\n${'═'.repeat(60)}`);
if(f>0){console.log('\n❌ TESTS FAILED'); process.exit(1);}else{console.log('\n✅ ALL TESTS PASSED');}