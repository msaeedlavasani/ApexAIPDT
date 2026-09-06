#!/usr/bin/env node

/**
 * DPT-FOUNDATION-001 — Schema Creation via DPT-Controlled Runtime
 *
 * Creates all machine-readable JSON Schema files under docs/schemas/
 * through the SDK-created runtime with OWNER_PERMISSION_POPUPS = 0.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createOpenCodeAdapter } from "./opencode-adapter.mjs";
import { createEnvelope, generatePermissions, ROLE } from "./permission-envelope.mjs";
import { validateMaterialized } from "./permission-materializer.mjs";
import { createContextReceipt } from "./context-receipt.mjs";
import { createRehydrationRecord } from "./rehydration-record.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const SCHEMAS_DIR = join(REPO_ROOT, "docs", "schemas");
const TASK_ID = "DPT-FOUNDATION-001";
const WO_ID = "DPT-FOUNDATION-001-WO-SCHEMAS";
const TASK_PASSPORT_REVISION = "1";
const WORK_ORDER_REVISION = "1";
const ROLE_TYPE = ROLE.DEVELOPER;
const SDK_VERSION = "1.18.25";
const TIMEOUT_MS = 180000;

const GOVERNANCE_FILES = [
  "README.md", "AGENTS.md",
  "docs/APEX_AI_DPT_CONSTITUTION.md", "docs/APEX_AI_DPT_VISION.md",
  "docs/APEX_AI_DPT_TERMINOLOGY.md", "docs/DPT_AUTHORITY_MODEL.md",
  "docs/DPT_EXECUTION_CONTROL_MODEL.md", "docs/DPT_PROJECT_RUNTIME.md",
  "docs/governance/AUTHORITY_PERMISSION_MODEL.md",
  "docs/governance/PERMISSION_ENVELOPE.md",
  "docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md",
  "docs/governance/HUMAN_GATE_BOUNDARY.md",
  "docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md",
];

const SCHEMA_FILES = [
  "task-record.schema.json",
  "task-passport.schema.json",
  "work-order.schema.json",
  "delta.schema.json",
  "result.schema.json",
  "permission-envelope.schema.json",
  "lifecycle.schema.json",
  "README.md",
];

const evidence = {
  acceptance_kind: "DPT_FOUNDATION_001_SCHEMA_CREATION",
  task_id: TASK_ID,
  governance_rehydrated: false,
  envelope_created: false,
  materialized_policy_valid: false,
  runtime_created: false,
  runtime_effective_config_verified: false,
  session_created: false,
  session_bound: false,
  schema_creation_dispatched: false,
  schema_creation_completed: false,
  files_created: [],
  files_verified: 0,
  owner_permission_popups: 0,
  result: "INCONCLUSIVE",
  errors: [],
};

let adapter = null;
let runtime_started = false;
let permission_events = [];

function hashText(t) { return createHash("sha256").update(t).digest("hex").slice(0, 16); }
function withTimeout(p, ms, l) { let t; const timeout = new Promise((_, r) => { t = setTimeout(() => r(new Error(l + " timed out")), ms); }); return Promise.race([p, timeout]).finally(() => clearTimeout(t)); }

function rehydrateGovernance() {
  const docs = {};
  for (const rp of GOVERNANCE_FILES) {
    const ap = join(REPO_ROOT, rp);
    if (!existsSync(ap)) throw new Error("Missing: " + rp);
    docs[rp] = readFileSync(ap, "utf8");
  }
  const rev = hashText(GOVERNANCE_FILES.map(rp => `${rp}:${hashText(docs[rp])}`).join("\n"));
  evidence.governance_rehydrated = true;
  return createContextReceipt({ task_passport_revision: TASK_PASSPORT_REVISION, governance_revision: rev, baseline_sha: rev, documents_loaded: GOVERNANCE_FILES, provider_model: "opencode-sdk-" + SDK_VERSION });
}

function deriveAuthority(cr) {
  const perms = generatePermissions(ROLE_TYPE, {
    workspace: REPO_ROOT,
    task_workspace: SCHEMAS_DIR,
    allowed_commands: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*", "node *", "npm *", "npx *", "mkdir *", "ls *", "cat *", "head *", "tail *", "wc *"],
    denied_commands: ["git push*", "git merge*", "rm -rf*", "git reset --hard*"],
    external_dirs: [],
  });
  const env = createEnvelope({ task_id: TASK_ID, task_passport_revision: TASK_PASSPORT_REVISION, work_order_id: WO_ID, work_order_revision: WORK_ORDER_REVISION, role: ROLE_TYPE, actor_id: "dpt-foundation-001-schemas", workspace: REPO_ROOT, permissions: perms, metadata: { purpose: "schema creation" } });
  const rr = createRehydrationRecord({ task_id: TASK_ID, task_passport_revision: TASK_PASSPORT_REVISION, work_order_id: WO_ID, work_order_revision: WORK_ORDER_REVISION, role: ROLE_TYPE, permission_envelope: env, resource_claims: { workspace: REPO_ROOT, task_workspace: SCHEMAS_DIR }, workspace: REPO_ROOT, baseline_sha: cr.baseline_sha, context_receipt: cr, provider_adapter: "dpt-opencode-provider-adapter", execution_phase: "SCHEMA_CREATION", recovery_generation: 1 });
  evidence.envelope_created = true;
  return { envelope: env, rehydration_record: rr };
}

function handleEvent(ev) {
  const t = ev?.type;
  if (t === "permission.updated" || t === "permission.asked") {
    permission_events.push(ev);
    evidence.owner_permission_popups = permission_events.length;
  }
}

const SCHEMA_PROMPT = `DPT Work Order: DPT-FOUNDATION-001-WO-SCHEMAS
Task: DPT-FOUNDATION-001

Create all JSON Schema files under docs/schemas/. Use Bash with node -e to create each file.

Create directory first:
node -e "require('fs').mkdirSync('docs/schemas', {recursive:true}); console.log('dir OK')"

Then create each file using node -e with writeFileSync. Create these 7 JSON Schema files + 1 README:

1. docs/schemas/task-record.schema.json — Durable Task Record schema (fields: task_id, title, objective, status, dependencies, readiness, task_class, required_capabilities, denied_capabilities, delegated_authority, authority_derivation, human_gate_state, passport_revision, canonical_artifact, state_revision, next_task, auto_continue)

2. docs/schemas/task-passport.schema.json — Task Passport schema (fields: task_id, task_passport_revision, role, scope, required_capabilities, denied_capabilities, policy_ceiling_ref, human_gates_applicable, valid_from, valid_until, revocation_state)

3. docs/schemas/work-order.schema.json — Work Order schema (fields: task_id, task_passport_revision, work_order_id, work_order_revision, executor, inputs, expected_outputs, envelope_id, resource_claims, route_budget, acceptance_criteria, termination_conditions)

4. docs/schemas/delta.schema.json — Delta schema (fields: delta_id, task_id, base_state_revision, changes, applied_by, applied_at, evidence_refs)

5. docs/schemas/result.schema.json — Result/Handoff schema (fields: result_id, outcome, structured_result, provider_session_id, attempt_id, evidence_refs)

6. docs/schemas/permission-envelope.schema.json — Permission Envelope schema (fields: envelope_id, schema_version, task_id, task_passport_revision, work_order_id, work_order_revision, role, actor_id, authority_mode, issued_at, expires_at, lifetime, workspace, permissions, human_gates, prohibitions, metadata)

7. docs/schemas/lifecycle.schema.json — Lifecycle states schema (states: BACKLOG, READY, ASSIGNED, DISPATCHED, RUNNING, REVIEW_REQUIRED, VERIFYING, REWORK, WAITING_FOR_HUMAN_GATE, BLOCKED, ESCALATION_REQUIRED, REPORT_PENDING, CLOSED)

8. docs/schemas/README.md — Documentation for the schema collection

Each JSON Schema file must use JSON Schema draft 2020-12 and include $schema, $id, title, description, type, and properties.

After creating all files, verify each exists by reading them with node -e.

Return exactly: {"status":"COMPLETE","files_created":<count>}`;

async function run() {
  process.chdir(REPO_ROOT);
  const cr = rehydrateGovernance();
  const { envelope, rehydration_record } = deriveAuthority(cr);

  adapter.registerEnvelope(TASK_ID, WO_ID, envelope);
  adapter.registerRehydrationRecord(TASK_ID, WO_ID, rehydration_record);

  const materialized = adapter.materializeEnvelope(envelope);
  const v = validateMaterialized(materialized);
  evidence.materialized_policy_valid = v.valid;
  if (!v.valid) throw new Error("Invalid: " + v.errors.join(", "));

  const rh = await adapter.start({ config: materialized, hostname: "127.0.0.1", port: 0, timeout: 30000 });
  runtime_started = true;
  evidence.runtime_created = true;

  const effectiveConfig = (await adapter.runtimeClient.config.get()).data;
  const effBash = effectiveConfig?.permission?.bash ?? {};
  evidence.runtime_effective_config_verified = effBash["mkdir *"] === "allow" && effBash["node *"] === "allow";

  await adapter.subscribeToEvents({ onEvent: handleEvent });

  const sid = await adapter.createSession({ task_id: TASK_ID, work_order_id: WO_ID, title: "DPT-FOUNDATION-001 schema creation" });
  evidence.session_created = true;

  const sess = (await adapter.runtimeClient.session.get({ path: { id: sid } })).data;
  evidence.session_bound = sess.id === sid && sess.directory === REPO_ROOT;

  evidence.schema_creation_dispatched = true;
  const result = await withTimeout(
    adapter.execute(sid, SCHEMA_PROMPT, { task_id: TASK_ID, work_order_id: WO_ID }),
    TIMEOUT_MS,
    "schema creation",
  );

  evidence.schema_creation_completed = result.status === "SUCCESS";
  evidence.files_created = SCHEMA_FILES.filter(f => existsSync(join(SCHEMAS_DIR, f)));
  evidence.files_verified = evidence.files_created.length;

  const pass = evidence.errors.length === 0 && evidence.runtime_created && evidence.session_created && evidence.session_bound && evidence.files_verified === SCHEMA_FILES.length && evidence.owner_permission_popups === 0;
  evidence.result = pass ? "PASS" : "FAIL";
}

async function main() {
  adapter = createOpenCodeAdapter({ state_dir: join(REPO_ROOT, ".dpt-foundation-001-schema-state") });
  try { await run(); } catch (e) { evidence.errors.push({ step: "main", error: e.message }); evidence.result = "FAIL"; }
  finally { if (runtime_started) try { await adapter.stop(); } catch {} evidence.owner_permission_popups = permission_events.length; if (evidence.result === "PASS" && evidence.owner_permission_popups > 0) evidence.result = "FAIL"; }
  console.log(JSON.stringify(evidence, null, 2));
  process.exit(evidence.result === "PASS" ? 0 : 1);
}

await main();
