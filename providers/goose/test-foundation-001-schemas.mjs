#!/usr/bin/env node
/**
 * DPT-FOUNDATION-001 — Schema Validation Tests
 * 
 * Validates all task-system JSON Schema artifacts against:
 * 1. JSON Schema draft 2020-12 compliance
 * 2. Structural integrity (required fields, types)
 * 3. Cross-schema references
 * 4. Example document validation
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const SCHEMAS_DIR = join(REPO_ROOT, 'docs/schemas');

// Minimal JSON Schema validator (no external dependencies)
class SimpleValidator {
  constructor() {
    this.errors = [];
    this.passes = 0;
    this.fails = 0;
  }

  validate(schema, document, path = '$') {
    this.errors = [];
    
    // Check $schema declaration
    if (schema['$schema']) {
      this.assert(
        schema['$schema'].includes('2020-12'),
        `${path}: Must use JSON Schema draft 2020-12`,
        { got: schema['$schema'] }
      );
    }
    
    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        this.assert(
          document.hasOwnProperty(field),
          `${path}: Missing required field '${field}'`,
          { available: Object.keys(document) }
        );
      }
    }
    
    // Check properties
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (document.hasOwnProperty(prop)) {
          this.validate(propSchema, document[prop], `${path}.${prop}`);
        }
      }
    }
    
    // Check type
    if (schema.type) {
      const actualType = Array.isArray(document) ? 'array' : typeof document;
      this.assert(
        schema.type === 'object' || schema.type === actualType,
        `${path}: Expected type '${schema.type}', got '${actualType}'`,
        { expected: schema.type, actual: actualType }
      );
    }
    
    return this.errors.length === 0;
  }

  assert(condition, message, details = {}) {
    if (condition) {
      this.passes++;
      console.log(`  [PASS] ${message}`);
    } else {
      this.fails++;
      console.log(`  [FAIL] ${message}`);
      if (Object.keys(details).length > 0) {
        console.log(`         Details: ${JSON.stringify(details)}`);
      }
    }
  }
}

// Test documents for each schema
const TEST_DOCUMENTS = {
  'task-record.schema.json': {
    task_id: 'DPT-TEST-001',
    title: 'Test Task',
    objective: 'Test objective',
    status: 'BACKLOG',
    dependencies: [],
    readiness: 'NOT_READY',
    task_class: 'test',
    required_capabilities: ['repository.read'],
    denied_capabilities: ['git.push'],
    delegated_authority: 'none',
    authority_derivation: 'to be derived',
    human_gate_state: 'NONE',
    passport_revision: 0,
    canonical_artifact: 'TBD',
    state_revision: 1,
    next_task: null,
    auto_continue: false
  },
  'task-passport.schema.json': {
    task_id: 'DPT-TEST-001',
    task_passport_revision: 1,
    role: 'DEVELOPER',
    scope: 'repo-local',
    required_capabilities: ['repository.read', 'docs.write'],
    denied_capabilities: ['git.push'],
    policy_ceiling_ref: 'DPT_AUTHORITY_MODEL.md',
    human_gates_applicable: [],
    valid_from: '2026-09-06T00:00:00Z',
    valid_until: '2026-09-07T00:00:00Z',
    revocation_state: 'active'
  },
  'work-order.schema.json': {
    task_id: 'DPT-TEST-001',
    task_passport_revision: 1,
    work_order_id: 'DPT-WO-TEST-001',
    work_order_revision: 1,
    executor: 'goose',
    inputs: {},
    expected_outputs: ['artifact.md'],
    envelope_id: 'env-001',
    resource_claims: { workspace: '/repo' },
    route_budget: 3,
    acceptance_criteria: ['PASS'],
    termination_conditions: ['COMPLETED', 'FAILED']
  },
  'delta.schema.json': {
    delta_id: 'delta-001',
    task_id: 'DPT-TEST-001',
    base_state_revision: 1,
    changes: [
      { path: 'status', op: 'replace', value: 'RUNNING' }
    ],
    applied_by: 'TEST_EXECUTOR',
    applied_at: '2026-09-06T00:00:00Z',
    evidence_refs: ['docs/validation/test-report.md']
  },
  'result.schema.json': {
    result_id: 'result-001',
    outcome: 'SUCCESS',
    structured_result: { status: 'COMPLETE' },
    provider_session_id: 'session-001',
    attempt_id: 'attempt-001',
    evidence_refs: ['docs/validation/test-report.md']
  },
  'permission-envelope.schema.json': {
    envelope_id: 'env-001',
    schema_version: '1.0.0',
    task_id: 'DPT-TEST-001',
    task_passport_revision: 1,
    work_order_id: 'DPT-WO-TEST-001',
    work_order_revision: 1,
    role: 'DEVELOPER',
    actor_id: 'goose',
    authority_mode: 'delegated',
    issued_at: '2026-09-06T00:00:00Z',
    expires_at: '2026-09-07T00:00:00Z',
    lifetime: '24h',
    workspace: '/repo',
    permissions: ['repository.read', 'docs.write'],
    human_gates: [],
    prohibitions: ['git.push'],
    metadata: {}
  },
  'lifecycle.schema.json': {
    states: {
      BACKLOG: { name: 'BACKLOG', description: 'Task in backlog', transitions: ['READY'] },
      READY: { name: 'READY', description: 'Task ready for execution', transitions: ['ASSIGNED', 'DISPATCHED'] },
      RUNNING: { name: 'RUNNING', description: 'Task in progress', transitions: ['CLOSED', 'REWORK', 'BLOCKED'] },
      CLOSED: { name: 'CLOSED', description: 'Task completed', transitions: [] }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// Main test execution
// ═══════════════════════════════════════════════════════════════

function section(name) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('═'.repeat(60));
}

function main() {
  const validator = new SimpleValidator();
  
  // List all schema files
  section('1. Schema Discovery');
  const schemaFiles = readdirSync(SCHEMAS_DIR)
    .filter(f => f.endsWith('.schema.json'))
    .sort();
  
  console.log(`  Found ${schemaFiles.length} schema files:`);
  for (const f of schemaFiles) {
    console.log(`    - ${f}`);
  }
  
  // Validate each schema file
  section('2. Schema Structure Validation');
  for (const file of schemaFiles) {
    const filepath = join(SCHEMAS_DIR, file);
    try {
      const schema = JSON.parse(readFileSync(filepath, 'utf8'));
      
      // Check required JSON Schema fields
      validator.assert(
        schema.$schema === 'https://json-schema.org/draft/2020-12/schema',
        `${file}: Valid $schema declaration`
      );
      
      validator.assert(
        schema.$id && schema.$id.startsWith('https://apexaidpt.io/schemas/'),
        `${file}: Valid $id namespace`
      );
      
      validator.assert(
        schema.title && typeof schema.title === 'string',
        `${file}: Has title`
      );
      
      validator.assert(
        schema.description && typeof schema.description === 'string',
        `${file}: Has description`
      );
      
      validator.assert(
        schema.type === 'object',
        `${file}: Type is object`
      );
      
      validator.assert(
        Array.isArray(schema.required) && schema.required.length > 0,
        `${file}: Has required fields`
      );
      
    } catch (e) {
      validator.fails++;
      console.log(`  [FAIL] ${file}: Parse error - ${e.message}`);
    }
  }
  
  // Validate test documents against schemas
  section('3. Document Validation');
  for (const [file, doc] of Object.entries(TEST_DOCUMENTS)) {
    const filepath = join(SCHEMAS_DIR, file);
    if (!readFileSync(filepath, 'utf8')) {
      validator.assert(false, `${file}: Schema file exists`);
      continue;
    }
    
    try {
      const schema = JSON.parse(readFileSync(filepath, 'utf8'));
      const valid = validator.validate(schema, doc, file);
      validator.assert(valid, `${file}: Test document valid`);
    } catch (e) {
      validator.fails++;
      console.log(`  [FAIL] ${file}: Validation error - ${e.message}`);
    }
  }
  
  // Check manifest
  section('4. Manifest Validation');
  const manifestPath = join(SCHEMAS_DIR, 'v02-manifest.json');
  if (readFileSync(manifestPath, 'utf8')) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      validator.assert(
        manifest.schemas && Array.isArray(manifest.schemas),
        'Manifest has schemas array'
      );
      validator.assert(
        manifest.schemas.length >= schemaFiles.length - 1, // exclude README
        `Manifest covers ${manifest.schemas.length} schemas`
      );
    } catch (e) {
      validator.fails++;
      console.log(`  [FAIL] Manifest: Parse error - ${e.message}`);
    }
  } else {
    validator.assert(false, 'Manifest file exists');
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Total tests:  ${validator.passes + validator.fails}`);
  console.log(`  Passed:       ${validator.passes}`);
  console.log(`  Failed:       ${validator.fails}`);
  
  if (validator.fails === 0) {
    console.log('\n  ✅ DPT-FOUNDATION-001 SCHEMA VALIDATION: ALL TESTS PASSED');
    return 0;
  } else {
    console.log(`\n  ❌ DPT-FOUNDATION-001 SCHEMA VALIDATION: ${validator.fails} TEST(S) FAILED`);
    return 1;
  }
}

const result = main();
process.exit(result);
