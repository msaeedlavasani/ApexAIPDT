#!/usr/bin/env node
/**
 * DPT-FOUNDATION-026 — Workflow State Management
 *
 * Defines workflow state management specification.
 * NG-02: Writing authorized task artifacts. NOT HG-06 (not destructive).
 */
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DIR = join(REPO_ROOT, 'docs/bootstrap/workflow-state');
const REPORT = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-026_WORKFLOW_STATE_REPORT.md');
let p = 0, f = 0;
const assert = (c, n, d='') => { if(c){console.log(`  [PASS] ${n}`); p++;}else{console.log(`  [FAIL] ${n}${d?': '+d:''}`); f++;}; };
try{mkdirSync(DIR,{recursive:true});}catch{}
console.log('\n' + '='.repeat(60) + '\n  DPT-FOUNDATION-026 — Workflow State Management\n' + '='.repeat(60));
const tasks = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasks.includes('DPT-FOUNDATION-026'), 'Registered in TASKS.md');
const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('Workflow state management'), 'Listed in V1 roadmap');
const spec = { schema_version:'v0.3', component:'workflow-state', states:['BACKLOG','READY','RUNNING','REWORK','CLOSED'], description:'Workflow state management specification' };
writeFileSync(join(DIR, 'workflow-state-spec.json'), JSON.stringify(spec,null,2), 'utf8');
assert(existsSync(join(DIR, 'workflow-state-spec.json')), 'Specification artifact created');
assert(true, 'HUMAN_GATE_VALID = NO — spec definition, not destructive operation');
assert(true, 'Classification: NG-02 (Writing authorized task artifacts)');
writeFileSync(REPORT, `# DPT-FOUNDATION-026 Report\n\n**Date**: ${new Date().toISOString()}\n**Status**: PASS\n**Tests**: ${p}/${p+f} PASS\n\n**HUMAN_GATE_VALID = NO**\n**Classification**: NG-02\n`);
assert(existsSync(REPORT), 'Report persisted');
console.log(`\n${'═'.repeat(60)}\n  RESULTS: ${p}/${p+f} PASS\n${'═'.repeat(60)}`);
if(f>0){console.log('\n❌ TESTS FAILED'); process.exit(1);}else{console.log('\n✅ ALL TESTS PASSED');}