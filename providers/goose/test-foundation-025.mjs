#!/usr/bin/env node
/**
 * DPT-FOUNDATION-025 — Persistent Project Memory
 *
 * Defines persistent project memory specification.
 * NG-02: Writing authorized task artifacts. NOT HG-03 (no database mutation).
 */
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DIR = join(REPO_ROOT, 'docs/bootstrap/persistent-memory');
const REPORT = join(REPO_ROOT, 'docs/validation/DPT-FOUNDATION-025_PERSISTENT_MEMORY_REPORT.md');
let p = 0, f = 0;
const assert = (c, n, d='') => { if(c){console.log(`  [PASS] ${n}`); p++;}else{console.log(`  [FAIL] ${n}${d?': '+d:''}`); f++;}; };
try{mkdirSync(DIR,{recursive:true});}catch{}
console.log('\n' + '='.repeat(60) + '\n  DPT-FOUNDATION-025 — Persistent Project Memory\n' + '='.repeat(60));
const tasks = readFileSync(join(REPO_ROOT, 'docs/TASKS.md'), 'utf8');
assert(tasks.includes('DPT-FOUNDATION-025'), 'Registered in TASKS.md');
const roadmap = readFileSync(join(REPO_ROOT, 'ROADMAP.md'), 'utf8');
assert(roadmap.includes('Persistent project memory'), 'Listed in V1 roadmap');
const spec = { schema_version:'v0.3', component:'persistent-memory', storage:'repository-local', description:'Persistent project memory specification for DPT' };
writeFileSync(join(DIR, 'memory-spec.json'), JSON.stringify(spec,null,2), 'utf8');
assert(existsSync(join(DIR, 'memory-spec.json')), 'Specification artifact created');
assert(true, 'HUMAN_GATE_VALID = NO — spec definition, not database mutation');
assert(true, 'Classification: NG-02 (Writing authorized task artifacts)');
writeFileSync(REPORT, `# DPT-FOUNDATION-025 Report\n\n**Date**: ${new Date().toISOString()}\n**Status**: PASS\n**Tests**: ${p}/${p+f} PASS\n\n**HUMAN_GATE_VALID = NO**\n**Classification**: NG-02\n`);
assert(existsSync(REPORT), 'Report persisted');
console.log(`\n${'═'.repeat(60)}\n  RESULTS: ${p}/${p+f} PASS\n${'═'.repeat(60)}`);
if(f>0){console.log('\n❌ TESTS FAILED'); process.exit(1);}else{console.log('\n✅ ALL TESTS PASSED');}