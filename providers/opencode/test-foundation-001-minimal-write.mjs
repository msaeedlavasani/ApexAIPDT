#!/usr/bin/env node

/**
 * DPT-FOUNDATION-001 — Minimal schema write test via DPT-controlled runtime.
 * Creates a single marker file under docs/schemas/** to verify the
 * SDK-created runtime can write without permission popups.
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
const TASK_ID = "DPT-FOUNDATION-001";
const WO_ID = "DPT-FOUNDATION-001-WO-MINIMAL-TEST";
const TASK_PASSPORT_REVISION = "1";
const WORK_ORDER_REVISION = "1";
const ROLE_TYPE = ROLE.DEVELOPER;
const SDK_VERSION = "1.18.25";
const TIMEOUT_MS = 120000;

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

const evidence = {
  acceptance_kind: "DPT_FOUNDATION_001_MINIMAL_WRITE_TEST",
  governance_rehydrated: false,
  envelope_created: false,
  materialized_policy_valid: false,
  runtime_created: false,
  runtime_effective_config_verified: false,
  session_created: false,
  session_bound: false,
  write_executed: false,
  write_readback: false,
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
    task_workspace: join(REPO_ROOT, "docs/schemas"),
    allowed_commands: ["git status*", "git diff*", "git log*", "git show*", "git rev-parse*", "node *", "npm *", "npx *", "mkdir *", "ls *", "cat *", "head *", "tail *", "wc *"],
    denied_commands: ["git push*", "git merge*", "rm -rf*", "git reset --hard*"],
    external_dirs: [],
  });
  const env = createEnvelope({ task_id: TASK_ID, task_passport_revision: TASK_PASSPORT_REVISION, work_order_id: WO_ID, work_order_revision: WORK_ORDER_REVISION, role: ROLE_TYPE, actor_id: "dpt-foundation-001-minimal", workspace: REPO_ROOT, permissions: perms, metadata: { purpose: "minimal write test" } });
  const rr = createRehydrationRecord({ task_id: TASK_ID, task_passport_revision: TASK_PASSPORT_REVISION, work_order_id: WO_ID, work_order_revision: WORK_ORDER_REVISION, role: ROLE_TYPE, permission_envelope: env, resource_claims: { workspace: REPO_ROOT }, workspace: REPO_ROOT, baseline_sha: cr.baseline_sha, context_receipt: cr, provider_adapter: "dpt-opencode-provider-adapter", execution_phase: "MINIMAL_WRITE_TEST", recovery_generation: 1 });
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

  // Verify effective runtime config matches materialized
  const effectiveConfig = (await adapter.runtimeClient.config.get()).data;
  const effBash = effectiveConfig?.permission?.bash ?? {};
  const hasMkdir = effBash["mkdir *"] === "allow";
  evidence.runtime_effective_config_verified = hasMkdir;
  if (!hasMkdir) throw new Error("Runtime effective config missing mkdir allow. Bash keys: " + Object.keys(effBash).join(", "));

  await adapter.subscribeToEvents({ onEvent: handleEvent });

  const sid = await adapter.createSession({ task_id: TASK_ID, work_order_id: WO_ID, title: "minimal write test" });
  evidence.session_created = true;

  const sess = (await adapter.runtimeClient.session.get({ path: { id: sid } })).data;
  evidence.session_bound = sess.id === sid && sess.directory === REPO_ROOT;

  // Execute minimal write: create one file via the SDK-created session
  const markerPath = join(REPO_ROOT, "docs", "schemas", ".dpt-foundation-001-minimal-marker");
  const prompt = [
    "Execute exactly one operation and report the result.",
    "Use Bash to run: node -e \"require('fs').mkdirSync('" + join(REPO_ROOT, "docs", "schemas") + "', {recursive:true}); require('fs').writeFileSync('" + markerPath + "', JSON.stringify({task_id:'DPT-FOUNDATION-001',test:'minimal',ts:new Date().toISOString()})); console.log('DONE');\"",
    "Then use Read to verify the file exists.",
    "Return exactly: {\"status\":\"COMPLETE\",\"file_exists\":<boolean>}",
  ].join("\n");

  evidence.write_executed = true;
  const result = await withTimeout(
    adapter.execute(sid, prompt, { task_id: TASK_ID, work_order_id: WO_ID }),
    TIMEOUT_MS,
    "minimal write",
  );

  evidence.write_readback = existsSync(markerPath);
}

async function main() {
  adapter = createOpenCodeAdapter({ state_dir: join(REPO_ROOT, ".dpt-foundation-001-test-state") });
  try {
    await run();
    evidence.result = (evidence.write_readback && evidence.owner_permission_popups === 0) ? "PASS" : "FAIL";
  } catch (e) {
    evidence.errors.push({ step: "main", error: e.message });
    evidence.result = "FAIL";
  } finally {
    if (runtime_started) try { await adapter.stop(); } catch {}
    evidence.owner_permission_popups = permission_events.length;
    if (evidence.result === "PASS" && evidence.owner_permission_popups > 0) evidence.result = "FAIL";
  }
  console.log(JSON.stringify(evidence, null, 2));
  process.exit(evidence.result === "PASS" ? 0 : 1);
}

await main();
