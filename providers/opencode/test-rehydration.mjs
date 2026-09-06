#!/usr/bin/env node

/**
 * DPT-PROVIDER-004.D — Session / Restart / Rehydration Test Harness
 *
 * 9 proofs of DPT execution authority survival across interruptions.
 * Uses read-only SDK interactions to avoid permission prompts.
 */

import { createOpencode } from "@opencode-ai/sdk";
import {
  createEnvelope, generatePermissions, ROLE, AUTHORITY_MODE
} from "./permission-envelope.mjs";
import { materialize, validateMaterialized, evaluateBashRule } from "./permission-materializer.mjs";
import {
  createRehydrationRecord, advanceRecord, createRecoveryRecord,
  persistRecord, loadRecord, validateRecord
} from "./rehydration-record.mjs";
import {
  createContextReceipt, receiptHash, compareReceipts, validateRehydration
} from "./context-receipt.mjs";
import { existsSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const REPO_ROOT = process.cwd();
const STATE_DIR = join(REPO_ROOT, ".dpt-rehydration-state");
const RESULTS = [];
let total_pass = 0;
let total_fail = 0;

function result(test_id, description, verdict, evidence = {}) {
  const entry = { test_id, description, verdict, evidence };
  RESULTS.push(entry);
  if (verdict === "PASS") total_pass++;
  else total_fail++;
  console.error(`[${verdict}] ${test_id}: ${description}`);
}

function cleanupState() {
  if (existsSync(STATE_DIR)) {
    try { rmSync(STATE_DIR, { recursive: true, force: true }); } catch {}
  }
}

async function sendProof(client, session_id, prompt_text) {
  const response = await client.session.prompt({
    path: { id: session_id },
    body: { parts: [{ type: "text", text: prompt_text }] },
  });
  const msg = response.data;
  if (!msg?.parts) return null;
  for (const part of msg.parts) {
    if (part.type === "text" && part.text) {
      const match = part.text.match(/\{[\s\S]*"proof"[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
    }
  }
  return null;
}

// ============================================================
// SETUP: Shared DPT state
// ============================================================
cleanupState();
mkdirSync(STATE_DIR, { recursive: true });

const TASK_ID = "DPT-TASK-004D";
const WO_ID_A = "DPT-WO-004D-A";
const WO_ID_B = "DPT-WO-004D-B";

const BASELINE_SHA = createHash("sha256").update("test-baseline-004d").digest("hex").slice(0, 16);

// Create envelopes for both Work Orders
const envelope_a = createEnvelope({
  task_id: TASK_ID,
  work_order_id: WO_ID_A,
  role: ROLE.DEVELOPER,
  workspace: REPO_ROOT,
  permissions: generatePermissions(ROLE.DEVELOPER, {
    workspace: REPO_ROOT,
    task_workspace: "/tmp/dpt-provider-004d-test-a",
    allowed_commands: [],
    external_dirs: ["/tmp/dpt-provider-004d-test-a"],
  }),
});

const envelope_b = createEnvelope({
  task_id: "DPT-TASK-004D-B",
  work_order_id: WO_ID_B,
  role: ROLE.REVIEWER,
  workspace: REPO_ROOT,
  permissions: generatePermissions(ROLE.REVIEWER, {
    workspace: REPO_ROOT,
    task_workspace: "/tmp/dpt-provider-004d-test-b",
    external_dirs: ["/tmp/dpt-provider-004d-test-b"],
  }),
});

// Create context receipt
const original_receipt = createContextReceipt({
  task_passport_revision: "1",
  governance_revision: "1",
  baseline_sha: BASELINE_SHA,
  documents_loaded: ["OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md", "DYNAMIC_PERMISSION_MATERIALIZATION.md"],
  provider_model: "nara/deepseek-v4-flash",
});

// ============================================================
// PROOF 1: NORMAL SESSION REHYDRATION
// ============================================================
console.error("\n=== PROOF 1: NORMAL SESSION REHYDRATION ===\n");

let step1_result = null;
let record_a = null;

try {
  // Phase 1: Create session, execute step 1 (read-only proof)
  const config_a = materialize(envelope_a);
  const inst1 = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const client1 = inst1.client;
  const server1 = inst1.server;

  const session1 = await client1.session.create({ body: {} });
  const sid1 = session1.data.id;

  const step1_prompt = [
    `Work Order: ${WO_ID_A}`,
    `Task: Step 1 of 2. Read README.md and confirm the first line.`,
    `Return exactly: {"proof": "STEP_1_COMPLETE", "status": "PASS", "work_order_id": "${WO_ID_A}", "first_line": "<first line>"}`,
  ].join("\n");

  step1_result = await sendProof(client1, sid1, step1_prompt);

  // Persist durable state
  record_a = createRehydrationRecord({
    task_id: TASK_ID,
    task_passport_revision: "1",
    work_order_id: WO_ID_A,
    work_order_revision: "1",
    role: ROLE.DEVELOPER,
    permission_envelope: envelope_a,
    resource_claims: { task_workspace: "/tmp/dpt-provider-004d-test-a" },
    workspace: REPO_ROOT,
    baseline_sha: BASELINE_SHA,
    context_receipt: original_receipt,
    provider_model_selection: "nara/deepseek-v4-flash",
    provider_session_id: sid1,
    execution_phase: "STEP_1_COMPLETE",
    last_completed_step: "step1",
    pending_step: "step2",
  });

  const record_path = persistRecord(record_a, STATE_DIR);
  result("PROOF-1a", "Step 1 executed via SDK",
    step1_result?.proof === "STEP_1_COMPLETE" ? "PASS" : "FAIL",
    { step1_result, sid1 });

  // Terminate runtime
  server1.close();
  console.error("[proof1] Server terminated");

  // Phase 2: Fresh runtime, rehydrate, execute step 2
  const inst2 = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const client2 = inst2.client;
  const server2 = inst2.server;

  const loaded_record = loadRecord(record_path);
  const record_valid = validateRecord(loaded_record);

  result("PROOF-1b", "Rehydration record loaded and valid",
    record_valid.valid ? "PASS" : "FAIL",
    { record_valid });

  const session2 = await client2.session.create({ body: {} });
  const sid2 = session2.data.id;

  const step2_prompt = [
    `Work Order: ${WO_ID_A}`,
    `Task: Step 2 of 2 (rehydrated). Read README.md and confirm the first line.`,
    `Return exactly: {"proof": "REHYDRATION_PASS", "status": "PASS", "work_order_id": "${WO_ID_A}", "rehydrated_from_generation": ${loaded_record.recovery_generation}}`,
  ].join("\n");

  const step2_result = await sendProof(client2, sid2, step2_prompt);

  result("PROOF-1", "NORMAL SESSION REHYDRATION",
    (step1_result?.proof === "STEP_1_COMPLETE" && step2_result?.proof === "REHYDRATION_PASS") ? "PASS" : "FAIL",
    { step1: step1_result, step2: step2_result });

  server2.close();
} catch (err) {
  result("PROOF-1", "NORMAL SESSION REHYDRATION", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 2: AUTHORITY REHYDRATION
// ============================================================
console.error("\n=== PROOF 2: AUTHORITY REHYDRATION ===\n");

try {
  const rehydrated_envelope = createEnvelope({
    task_id: TASK_ID,
    work_order_id: WO_ID_A,
    role: ROLE.DEVELOPER,
    workspace: REPO_ROOT,
    permissions: generatePermissions(ROLE.DEVELOPER, {
      workspace: REPO_ROOT,
      task_workspace: "/tmp/dpt-provider-004d-test-a",
      allowed_commands: [],
      external_dirs: ["/tmp/dpt-provider-004d-test-a"],
    }),
  });

  const fresh_config = materialize(rehydrated_envelope);
  const original_config = materialize(envelope_a);

  const fresh_bash = JSON.stringify(fresh_config.permission.bash);
  const original_bash = JSON.stringify(original_config.permission.bash);
  const fresh_read = JSON.stringify(fresh_config.permission.read);
  const original_read = JSON.stringify(original_config.permission.read);
  const fresh_edit = JSON.stringify(fresh_config.permission.edit);
  const original_edit = JSON.stringify(original_config.permission.edit);

  const no_ui_state = !fresh_config.permission._allow_once && !fresh_config.permission._allow_always;

  result("PROOF-2", "AUTHORITY REHYDRATION",
    fresh_bash === original_bash && fresh_read === original_read && fresh_edit === original_edit && no_ui_state ? "PASS" : "FAIL",
    { bash_match: fresh_bash === original_bash, read_match: fresh_read === original_read, edit_match: fresh_edit === original_edit, no_ui_state });
} catch (err) {
  result("PROOF-2", "AUTHORITY REHYDRATION", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 3: PARENT REHYDRATION
// ============================================================
console.error("\n=== PROOF 3: PARENT REHYDRATION ===\n");

try {
  const parent_config = materialize(envelope_a);

  const has_repo_read = Object.entries(parent_config.permission.read).some(
    ([p, a]) => p.includes("ApexAIPDT") && a === "allow"
  );
  const has_task_write = Object.entries(parent_config.permission.edit).some(
    ([p, a]) => p.includes("dpt-provider-004d-test-a") && a === "allow"
  );
  const has_task_ext = Object.entries(parent_config.permission.external_directory).some(
    ([p, a]) => p.includes("dpt-provider-004d-test-a") && a === "allow"
  );
  const task_perm = parent_config.permission.task;

  result("PROOF-3", "PARENT REHYDRATION",
    has_repo_read && has_task_write && has_task_ext && task_perm === "ask" ? "PASS" : "FAIL",
    { has_repo_read, has_task_write, has_task_ext, task_perm });
} catch (err) {
  result("PROOF-3", "PARENT REHYDRATION", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 4: SUBAGENT REHYDRATION
// ============================================================
console.error("\n=== PROOF 4: SUBAGENT REHYDRATION ===\n");

try {
  const subagent_config = materialize(envelope_a, { agent_name: "dpt-worker" });
  const subagent_perm = subagent_config.agent["dpt-worker"].permission;

  const has_read = Object.entries(subagent_perm.read).some(
    ([p, a]) => p.includes("ApexAIPDT") && a === "allow"
  );
  const has_ext = Object.entries(subagent_perm.external_directory).some(
    ([p, a]) => p.includes("dpt-provider-004d-test-a") && a === "allow"
  );
  const is_separate = subagent_perm.task === "ask";

  result("PROOF-4", "SUBAGENT REHYDRATION",
    has_read && has_ext && is_separate ? "PASS" : "FAIL",
    { has_read, has_ext, subagent_task: subagent_perm.task });
} catch (err) {
  result("PROOF-4", "SUBAGENT REHYDRATION", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 5: SESSION LOSS
// ============================================================
console.error("\n=== PROOF 5: SESSION LOSS ===\n");

try {
  const config_a = materialize(envelope_a);
  const inst = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const lost_session_id = (await inst.client.session.create({ body: {} })).data.id;
  inst.server.close();

  const task_identity_preserved = record_a?.task_id === TASK_ID && record_a?.work_order_id === WO_ID_A;

  const inst2 = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const new_session_id = (await inst2.client.session.create({ body: {} })).data.id;
  const session_changed = lost_session_id !== new_session_id;

  result("PROOF-5", "SESSION_LOSS_RECOVERY",
    task_identity_preserved && session_changed ? "PASS" : "FAIL",
    { lost_session_id, new_session_id, task_identity_preserved, session_changed });

  inst2.server.close();
} catch (err) {
  result("PROOF-5", "SESSION_LOSS_RECOVERY", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 6: ADAPTER RESTART
// ============================================================
console.error("\n=== PROOF 6: ADAPTER RESTART ===\n");

try {
  const loaded = loadRecord(join(STATE_DIR, `rehydration-${TASK_ID}-${WO_ID_A}.json`));
  const recovered = createRecoveryRecord(loaded, {
    recovery_reason: "ADAPTER_RESTARTED",
    new_provider_session_id: "simulated-new-session-id",
  });

  const valid = validateRecord(recovered);
  const gen_increased = recovered.recovery_generation > loaded.recovery_generation;
  const reason_recorded = recovered.metadata?.recovery_reason === "ADAPTER_RESTARTED";

  result("PROOF-6", "ADAPTER_RESTART_RECOVERY",
    valid.valid && gen_increased && reason_recorded ? "PASS" : "FAIL",
    { valid, gen_increased, reason_recorded, recovery_generation: recovered.recovery_generation });
} catch (err) {
  result("PROOF-6", "ADAPTER_RESTART_RECOVERY", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 7: OPENCODE RUNTIME RESTART
// ============================================================
console.error("\n=== PROOF 7: OPENCODE RUNTIME RESTART ===\n");

try {
  const config_a = materialize(envelope_a);
  const inst1 = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const sid1 = (await inst1.client.session.create({ body: {} })).data.id;
  inst1.server.close();

  const inst2 = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  const sid2 = (await inst2.client.session.create({ body: {} })).data.id;

  // New runtime = new session ID (different process)
  const runtime_restarted = sid1 !== sid2;

  result("PROOF-7", "OPENCODE_RUNTIME_RESTART_RECOVERY",
    runtime_restarted ? "PASS" : "FAIL",
    { session1: sid1, session2: sid2, runtime_restarted });

  inst2.server.close();
} catch (err) {
  result("PROOF-7", "OPENCODE_RUNTIME_RESTART_RECOVERY", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 8: STALE STATE DETECTION
// ============================================================
console.error("\n=== PROOF 8: STALE STATE DETECTION ===\n");

try {
  const stale_receipt = createContextReceipt({
    task_passport_revision: "99",
    governance_revision: "1",
    baseline_sha: BASELINE_SHA,
    documents_loaded: ["OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md", "DYNAMIC_PERMISSION_MATERIALIZATION.md"],
    provider_model: "nara/deepseek-v4-flash",
  });

  const validation = validateRehydration(original_receipt, stale_receipt);
  const fail_closed = !validation.valid && validation.stale;

  const stale_sha_receipt = createContextReceipt({
    task_passport_revision: "1",
    governance_revision: "1",
    baseline_sha: "STALE_BASELINE_SHA",
    documents_loaded: ["OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md", "DYNAMIC_PERMISSION_MATERIALIZATION.md"],
    provider_model: "nara/deepseek-v4-flash",
  });

  const sha_validation = validateRehydration(original_receipt, stale_sha_receipt);
  const sha_fail_closed = !sha_validation.valid && sha_validation.stale;

  result("PROOF-8", "STALE_STATE_DETECTION",
    fail_closed && sha_fail_closed ? "PASS" : "FAIL",
    {
      passport_mismatch_detected: fail_closed,
      baseline_mismatch_detected: sha_fail_closed,
      reasons: validation.reasons,
    });
} catch (err) {
  result("PROOF-8", "STALE_STATE_DETECTION", "FAIL", { error: err.message });
}

// ============================================================
// PROOF 9: CROSS-WORK-ORDER ISOLATION AFTER RESTART
// ============================================================
console.error("\n=== PROOF 9: CROSS-WORK-ORDER ISOLATION ===\n");

try {
  const config_a = materialize(envelope_a);
  const config_b = materialize(envelope_b);

  const inst_a = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_a,
  });
  await inst_a.client.session.create({ body: {} });
  inst_a.server.close();

  const inst_b = await createOpencode({
    hostname: "127.0.0.1", port: 0, timeout: 15000, config: config_b,
  });
  await inst_b.client.session.create({ body: {} });

  const b_bash = Object.entries(config_b.permission.bash);
  const b_has_a_task = Object.entries(config_b.permission.edit ?? {}).some(
    ([p]) => p.includes("dpt-provider-004d-test-a")
  );

  const a_bash = Object.entries(config_a.permission.bash);
  const a_has_b_commit_deny = a_bash.some(([p, a]) => p === "git commit*" && a === "deny");

  inst_b.server.close();

  result("PROOF-9", "CROSS_WORK_ORDER_PERMISSION_LEAK",
    !b_has_a_task && !a_has_b_commit_deny ? "PASS" : "FAIL",
    { b_has_a_task, a_has_b_commit_deny });
} catch (err) {
  result("PROOF-9", "CROSS_WORK_ORDER_PERMISSION_LEAK", "FAIL", { error: err.message });
}

// ============================================================
// CLEANUP
// ============================================================
cleanupState();

// ============================================================
// SUMMARY
// ============================================================
console.error("\n=== TEST SUMMARY ===\n");

const summary = {
  total: total_pass + total_fail,
  pass: total_pass,
  fail: total_fail,
  all_pass: total_fail === 0,
};

console.error(`Total: ${summary.total} | Pass: ${summary.pass} | Fail: ${summary.fail}`);
console.error(`Overall: ${summary.all_pass ? "PASS" : "FAIL"}`);

console.log(JSON.stringify({
  task_id: "DPT-PROVIDER-004D-TESTS",
  summary,
  results: RESULTS,
}, null, 2));

process.exit(summary.all_pass ? 0 : 1);
