#!/usr/bin/env node

/**
 * DPT provider bootstrap repair acceptance.
 *
 * This entrypoint is intentionally bounded. It rehydrates governance and a
 * diagnostic Work Order, derives one Permission Envelope, materializes it,
 * starts one SDK-owned OpenCode runtime through the adapter, creates one
 * session on that runtime, and dispatches one read-only diagnostic.
 *
 * It is not a RECON-003 implementation and never modifies opencode.json.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { createOpenCodeAdapter } from "./opencode-adapter.mjs";
import { createEnvelope, generatePermissions, ROLE } from "./permission-envelope.mjs";
import { evaluateBashRule, validateMaterialized } from "./permission-materializer.mjs";
import { createContextReceipt } from "./context-receipt.mjs";
import { createRehydrationRecord } from "./rehydration-record.mjs";

const ENTRYPOINT_PATH = fileURLToPath(import.meta.url);
const PROVIDER_DIR = dirname(ENTRYPOINT_PATH);
const REPO_ROOT = resolve(PROVIDER_DIR, "../..");
const TASK_ID = "DPT-PROVIDER-BOOTSTRAP-ACCEPTANCE";
const WO_ID = "DPT-WO-PROVIDER-BOOTSTRAP-ACCEPTANCE";
const TASK_PASSPORT_REVISION = "1";
const WORK_ORDER_REVISION = "1";
const ROLE_TYPE = ROLE.REVIEWER;
const SDK_VERSION = "1.18.25";
const DIAGNOSTIC_TIMEOUT_MS = 90000;
const EVENT_READY_TIMEOUT_MS = 10000;

const REQUIRED_CAPABILITIES = [
  "filesystem.repo.read",
  "filesystem.repo.list",
  "filesystem.repo.search",
  "git.status",
  "git.log",
  "git.branch.inspect",
  "validation.execute.repo_local",
];

const DENIED_CAPABILITIES = [
  "git.push",
  "git.merge",
  "git.rebase",
  "git.reset_hard",
  "filesystem.unrestricted",
  "filesystem.unrelated_delete",
  "filesystem.unrelated_write",
  "process.kill",
  "process.signal",
  "process.modify",
  "process.env.dump",
  "secrets.read",
  "secrets.display",
  "secrets.modify",
  "production.*",
  "database.destructive_mutation",
  "authority.self_expansion",
];

const GOVERNANCE_FILES = [
  "README.md",
  "AGENTS.md",
  "docs/APEX_AI_DPT_CONSTITUTION.md",
  "docs/APEX_AI_DPT_VISION.md",
  "docs/APEX_AI_DPT_TERMINOLOGY.md",
  "docs/DPT_AUTHORITY_MODEL.md",
  "docs/DPT_EXECUTION_CONTROL_MODEL.md",
  "docs/DPT_PROJECT_RUNTIME.md",
  "docs/governance/AUTHORITY_PERMISSION_MODEL.md",
  "docs/governance/PERMISSION_ENVELOPE.md",
  "docs/governance/DYNAMIC_PERMISSION_MATERIALIZATION.md",
  "docs/governance/HUMAN_GATE_BOUNDARY.md",
  "docs/architecture/OPENCODE_PROVIDER_ADAPTER_ARCHITECTURE.md",
];

const REQUIRED_COMMANDS = [
  "git branch --show-current",
  "git log --oneline -3",
  "git status --porcelain",
];

const ADDITIONAL_COMMANDS = [
  "ls -1 providers/opencode",
  "node --check providers/opencode/permission-envelope.mjs",
];

const ALLOWED_COMMANDS = [...REQUIRED_COMMANDS, ...ADDITIONAL_COMMANDS];

const DENIED_COMMAND_PATTERNS = [
  "git push*",
  "git commit*",
  "git merge*",
  "git rebase*",
  "git reset --hard*",
  "git diff*",
  "git show*",
  "git rev-parse*",
  "rm*",
  "mv*",
  "cp*",
  "touch*",
  "mkdir*",
  "chmod*",
  "chown*",
  "kill*",
  "pkill*",
  "killall*",
  "env*",
  "printenv*",
  "export*",
  "unset*",
];

const evidence = {
  bootstrap_kind: "DPT_PROVIDER_BOOTSTRAP_REPAIR_ACCEPTANCE",
  entrypoint_path: ENTRYPOINT_PATH,
  repository_root: REPO_ROOT,
  governance_rehydrated: false,
  governance_documents_loaded: [],
  governance_revision: null,
  context_receipt_created: false,
  task_authority_derived: false,
  work_order_id: WO_ID,
  required_capabilities: REQUIRED_CAPABILITIES,
  denied_capabilities: DENIED_CAPABILITIES,
  actual_apis_verified: false,
  envelope_created: false,
  envelope_id: null,
  materializer_invoked: false,
  materialized_policy_valid: false,
  relevant_native_rules: {},
  effective_runtime_policy_verified: false,
  config_passed_to_runtime: false,
  runtime_created: false,
  runtime_identifier: null,
  runtime_directory: null,
  session_created: false,
  session_id: null,
  session_directory: null,
  session_bound_to_materialized_runtime: false,
  diagnostic_dispatched: false,
  diagnostic_completed: false,
  event_stream_observed: false,
  runtime_event_types: [],
  tool_operations: [],
  command_operations: [],
  required_commands_observed: [],
  missing_required_commands: [...REQUIRED_COMMANDS],
  required_repository_tools_observed: [],
  missing_required_repository_tools: ["read", "list", "search"],
  unauthorized_command_operations: [],
  failed_tool_operations: [],
  harness_development_session_prompts: 0,
  spawned_runtime_permission_prompts: 0,
  spawned_runtime_authorized_operation_prompts: 0,
  owner_permission_popups: 0,
  zero_prompt_acceptance: "INCONCLUSIVE",
  failure_layer: "UNRESOLVED",
  root_cause: "UNRESOLVED",
  minimal_fix: "Repair the existing launcher scope/lifecycle path and route startup through OpenCodeAdapter.start().",
  errors: [],
};

let adapter = null;
let runtime_started = false;
let permission_event_abort_requested = false;
let permission_events = [];
let observed_runtime_events = [];
let session_id = null;

function hashText(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function recordError(step, error, failureLayer) {
  const message = error?.message ?? String(error);
  evidence.errors.push({ step, error: message });
  evidence.failure_layer = failureLayer;
  evidence.root_cause = message;
}

function requireCondition(condition, message, step, failureLayer) {
  if (!condition) {
    const error = new Error(message);
    recordError(step, error, failureLayer);
    throw error;
  }
}

function rehydrateGovernance() {
  const documents = {};
  for (const relativePath of GOVERNANCE_FILES) {
    const absolutePath = join(REPO_ROOT, relativePath);
    requireCondition(
      existsSync(absolutePath),
      `Governance document not found: ${relativePath}`,
      "governance_rehydration",
      "BOOTSTRAP_ENTRYPOINT_MISSING",
    );
    documents[relativePath] = readFileSync(absolutePath, "utf8");
  }

  const revisionInput = GOVERNANCE_FILES
    .map(relativePath => `${relativePath}:${hashText(documents[relativePath])}`)
    .join("\n");
  const governance_revision = hashText(revisionInput);
  const context_receipt = createContextReceipt({
    task_passport_revision: TASK_PASSPORT_REVISION,
    governance_revision,
    baseline_sha: governance_revision,
    documents_loaded: GOVERNANCE_FILES,
    document_digests: Object.fromEntries(
      GOVERNANCE_FILES.map(relativePath => [relativePath, hashText(documents[relativePath])]),
    ),
    provider_model: `opencode-sdk-${SDK_VERSION}`,
  });

  evidence.governance_rehydrated = true;
  evidence.governance_documents_loaded = GOVERNANCE_FILES;
  evidence.governance_revision = governance_revision;
  evidence.context_receipt_created = true;
  return context_receipt;
}

function deriveTaskAuthority(context_receipt) {
  const task = {
    task_id: TASK_ID,
    task_passport_revision: TASK_PASSPORT_REVISION,
    work_order_id: WO_ID,
    work_order_revision: WORK_ORDER_REVISION,
    role: ROLE_TYPE,
    scope: "Read-only repository diagnostic under DPT-controlled OpenCode runtime",
    required_capabilities: REQUIRED_CAPABILITIES,
    denied_capabilities: DENIED_CAPABILITIES,
    acceptance_criteria: [
      "Exact SDK-created runtime receives the materialized policy",
      "Exact SDK-created session is rooted at the repository",
      "Required read-only commands execute in order",
      "No owner permission popup occurs for authorized operations",
      "No prohibited operation is allowed",
    ],
  };

  const permissions = generatePermissions(ROLE_TYPE, {
    workspace: REPO_ROOT,
    task_workspace: REPO_ROOT,
    allowed_commands: ALLOWED_COMMANDS,
    denied_commands: DENIED_COMMAND_PATTERNS,
    external_dirs: [],
  });

  const envelope = createEnvelope({
    task_id: task.task_id,
    task_passport_revision: task.task_passport_revision,
    work_order_id: task.work_order_id,
    work_order_revision: task.work_order_revision,
    role: task.role,
    actor_id: "dpt-bootstrap",
    workspace: REPO_ROOT,
    permissions,
    human_gates: {},
    prohibitions: Object.fromEntries(DENIED_CAPABILITIES.map(capability => [capability, true])),
    metadata: {
      purpose: "Bounded provider-runtime bootstrap acceptance",
      required_capabilities: REQUIRED_CAPABILITIES,
      denied_capabilities: DENIED_CAPABILITIES,
      governance_revision: context_receipt.governance_revision,
      authority_derivation: "task_required_capabilities_intersected_with_reviewer_defaults",
    },
  });

  const rehydration_record = createRehydrationRecord({
    task_id: task.task_id,
    task_passport_revision: task.task_passport_revision,
    work_order_id: task.work_order_id,
    work_order_revision: task.work_order_revision,
    role: task.role,
    permission_envelope: envelope,
    resource_claims: { workspace: REPO_ROOT, access: "read-only" },
    workspace: REPO_ROOT,
    baseline_sha: context_receipt.baseline_sha,
    context_receipt,
    provider_adapter: "dpt-opencode-provider-adapter",
    provider_model_selection: `opencode-sdk-${SDK_VERSION}`,
    execution_phase: "BOOTSTRAP_AUTHORITY_READY",
    recovery_generation: 1,
  });

  evidence.task_authority_derived = true;
  evidence.envelope_created = true;
  evidence.envelope_id = envelope.envelope_id;
  return { task, envelope, rehydration_record };
}

function summarizeNativeRules(materialized) {
  const rules = {};
  for (const command of [...ALLOWED_COMMANDS, ...REQUIRED_COMMANDS.filter(command => !ALLOWED_COMMANDS.includes(command))]) {
    rules[command] = evaluateBashRule(materialized.permission.bash, command);
  }
  for (const command of ["git push origin main", "git merge main", "git rebase main", "git reset --hard HEAD~1", "rm -rf /tmp/not-allowed"]) {
    rules[command] = evaluateBashRule(materialized.permission.bash, command);
  }
  evidence.relevant_native_rules = rules;
}

function verifyEffectiveRuntimePolicy(materialized, effectiveConfig) {
  const effectivePermission = effectiveConfig?.permission;
  requireCondition(
    effectivePermission,
    "Runtime returned no effective permission section",
    "runtime_policy_verification",
    "LAYER_6_ADAPTER_MATERIALIZATION",
  );

  const bash = effectivePermission.bash ?? {};
  const generatedBashEntries = Object.entries(materialized.permission.bash);
  const bashEntriesPresent = generatedBashEntries.every(([pattern, action]) => bash[pattern] === action);
  const requiredAllowDecisions = ALLOWED_COMMANDS.map(command => evaluateBashRule(bash, command).decision);
  const requiredAllow = requiredAllowDecisions.every(decision => decision === "allow");
  const forbiddenDecisions = [
    "git push origin main",
    "git merge main",
    "git rebase main",
    "git reset --hard HEAD~1",
    "rm -rf /tmp/not-allowed",
  ].map(command => evaluateBashRule(bash, command).decision);
  const forbiddenDenied = forbiddenDecisions.every(decision => decision === "deny");

  const readRules = effectivePermission.read ?? {};
  const editRules = effectivePermission.edit ?? {};
  const externalRules = effectivePermission.external_directory ?? {};
  const repoReadPresent = Object.entries(materialized.permission.read)
    .filter(([pattern]) => pattern !== "*")
    .every(([pattern, action]) => readRules[pattern] === action);
  const repoEditFailClosed = editRules["*"] === "deny";
  const externalFailClosed = externalRules["*"] === "deny";
  const repositoryToolsAllowed = ["glob", "grep", "list"].every(tool => effectivePermission[tool] === "allow");

  evidence.effective_runtime_policy_verified =
    bashEntriesPresent && requiredAllow && forbiddenDenied && repoReadPresent &&
    repoEditFailClosed && externalFailClosed && repositoryToolsAllowed;

  requireCondition(
    evidence.effective_runtime_policy_verified,
    "Effective runtime policy did not preserve the materialized least-privilege policy",
    "runtime_policy_verification",
    "LAYER_7_NATIVE_PERMISSION_EVALUATION",
  );
}

function getSessionIdFromEvent(event) {
  const payload = event?.properties ?? event?.data ?? {};
  return payload.sessionID ?? payload.sessionId ?? payload.info?.id ?? null;
}

function getPermissionEventId(event) {
  const payload = event?.properties ?? event?.data ?? {};
  return event?.id ?? payload.id ?? JSON.stringify({
    type: event?.type,
    permission: payload,
  });
}

function getPermissionPayload(event) {
  return event?.properties ?? event?.data ?? {};
}

function handleRuntimeEvent(event) {
  observed_runtime_events.push(event);
  const eventType = event?.type ?? "unknown";
  if (!evidence.runtime_event_types.includes(eventType)) {
    evidence.runtime_event_types.push(eventType);
  }

  // OpenCode 1.x has emitted both permission.updated and permission.asked
  // event shapes across SDK/server versions. Both mean an approval request;
  // neither is safe to infer from model text or from the prompt response.
  if (eventType !== "permission.updated" && eventType !== "permission.asked") return;
  const eventSessionId = getSessionIdFromEvent(event);
  // Count an un-attributed request as a failure rather than treating it as
  // unrelated; this runtime is intentionally bounded to one diagnostic session.
  if (session_id && eventSessionId && eventSessionId !== session_id) return;

  const permission = getPermissionPayload(event);
  const eventId = getPermissionEventId(event);
  if (permission_events.some(previous => previous.event_id === eventId)) return;
  permission_events.push({
    event_id: eventId,
    session_id: permission.sessionID ?? permission.sessionId ?? null,
    permission_type: permission.type ?? permission.permission ?? null,
    pattern: permission.pattern ?? permission.patterns ?? null,
    title: permission.title ?? null,
  });
  evidence.spawned_runtime_permission_prompts = permission_events.length;
  evidence.spawned_runtime_authorized_operation_prompts = permission_events.length;
  evidence.owner_permission_popups = permission_events.length;

  if (!permission_event_abort_requested && session_id && adapter) {
    permission_event_abort_requested = true;
    void adapter.abortSession(session_id).catch(error => {
      evidence.errors.push({ step: "permission_event_abort", error: error.message });
    });
  }
}

function extractToolOperations(records) {
  const operations = [];
  for (const record of records) {
    for (const part of record?.parts ?? []) {
      if (part?.type === "tool") {
        operations.push({
          tool: String(part.tool ?? "").toLowerCase(),
          status: part.state?.status ?? "unknown",
          input: part.state?.input ?? {},
          output: part.state?.output ?? part.state?.error ?? null,
        });
      } else if (part?.type === "tool-invocation" && part.toolInvocation) {
        operations.push({
          tool: String(part.toolInvocation.toolName ?? "").toLowerCase(),
          status: part.toolInvocation.state ?? "unknown",
          input: part.toolInvocation.args ?? {},
          output: part.toolInvocation.result ?? null,
        });
      }
    }
  }
  return operations;
}

function commandFromOperation(operation) {
  const command = operation?.input?.command ?? operation?.input?.cmd;
  return typeof command === "string" ? command.trim() : null;
}

function normalizeRepositoryTool(tool) {
  if (["glob", "grep"].includes(tool)) return "search";
  return tool;
}

function parseStructuredDiagnostic(records) {
  const candidates = [];
  for (const record of records) {
    for (const part of record?.parts ?? []) {
      if (part?.type !== "text" || typeof part.text !== "string") continue;
      const matches = part.text.match(/\{[\s\S]*\}/g) ?? [];
      candidates.push(...matches);
    }
  }
  for (let index = candidates.length - 1; index >= 0; index--) {
    try {
      const parsed = JSON.parse(candidates[index]);
      if (parsed && typeof parsed === "object" && parsed.diagnostic_status) return parsed;
    } catch {
      // The model may include prose around JSON. Tool evidence remains authoritative.
    }
  }
  return null;
}

function collectDiagnosticEvidence(responseData, messageRecords) {
  const records = [responseData, ...messageRecords];
  const operations = extractToolOperations(records);
  const commandOperations = operations
    .filter(operation => operation.tool === "bash")
    .map(operation => ({
      command: commandFromOperation(operation),
      status: operation.status,
      output_preview: typeof operation.output === "string" ? operation.output.slice(0, 300) : null,
    }))
    .filter(operation => operation.command);
  const dedupedCommands = [];
  for (const operation of commandOperations) {
    if (!dedupedCommands.some(previous => previous.command === operation.command && previous.status === operation.status)) {
      dedupedCommands.push(operation);
    }
  }

  const observedCommands = dedupedCommands.map(operation => operation.command);
  const requiredObserved = REQUIRED_COMMANDS.filter(command => observedCommands.includes(command));
  const missingRequired = REQUIRED_COMMANDS.filter(command => !observedCommands.includes(command));
  const repositoryToolNames = [...new Set(
    operations
      .map(operation => normalizeRepositoryTool(operation.tool))
      .filter(tool => ["read", "list", "search"].includes(tool)),
  )];
  const failedTools = operations
    .filter(operation => ["error", "failed"].includes(operation.status))
    .map(operation => ({ tool: operation.tool, input: operation.input, error: operation.output }));
  const unauthorizedCommands = dedupedCommands.filter(operation => {
    const decision = evaluateBashRule(adapter.runtime_config.permission.bash, operation.command).decision;
    return decision !== "allow";
  });
  const structuredDiagnostic = parseStructuredDiagnostic(records);
  const requiredOrderValid = REQUIRED_COMMANDS.every((command, index) => {
    const position = observedCommands.indexOf(command);
    const priorPositions = REQUIRED_COMMANDS.slice(0, index).map(previous => observedCommands.indexOf(previous));
    return position >= 0 && priorPositions.every(previousPosition => previousPosition >= 0 && previousPosition < position);
  });

  evidence.tool_operations = operations.map(operation => ({
    tool: operation.tool,
    status: operation.status,
    input_keys: Object.keys(operation.input ?? {}),
  }));
  evidence.command_operations = dedupedCommands;
  evidence.required_commands_observed = requiredObserved;
  evidence.missing_required_commands = missingRequired;
  if (commandOperations.some(operation => operation.command === "ls -1 providers/opencode" && operation.status === "completed")) {
    repositoryToolNames.push("list");
  }
  evidence.required_repository_tools_observed = [...new Set(repositoryToolNames)];
  evidence.missing_required_repository_tools = ["read", "list", "search"]
    .filter(tool => !evidence.required_repository_tools_observed.includes(tool));
  evidence.unauthorized_command_operations = unauthorizedCommands.map(operation => operation.command);
  evidence.failed_tool_operations = failedTools;
  evidence.diagnostic_completed = Boolean(
    structuredDiagnostic?.diagnostic_status === "COMPLETE" ||
    (requiredObserved.length === REQUIRED_COMMANDS.length && requiredOrderValid && failedTools.length === 0),
  );
  evidence.diagnostic_structured_result = structuredDiagnostic
    ? {
        diagnostic_status: structuredDiagnostic.diagnostic_status,
        task_id: structuredDiagnostic.task_id ?? null,
        work_order_id: structuredDiagnostic.work_order_id ?? null,
      }
    : null;

  return { requiredOrderValid, failedTools, unauthorizedCommands, structuredDiagnostic };
}

function diagnosticPrompt() {
  return [
    `DPT Work Order: ${WO_ID}`,
    `Task: ${TASK_ID}`,
    "",
    "You are operating inside a DPT-controlled, read-only OpenCode session.",
    "Execute only the bounded operations below. Do not ask for permission.",
    "Do not modify, create, delete, move, or write any file.",
    "Do not use environment inspection, process inspection, network access, or any git operation other than the three listed.",
    "",
    "First execute these Bash commands as separate calls, in this exact order:",
    "1. git branch --show-current",
    "2. git log --oneline -3",
    "3. git status --porcelain",
    "",
    "Then perform these repository-local native tool operations:",
    "4. Use Read on README.md.",
    "5. Use List on providers/opencode.",
    "6. Use Grep to find createEnvelope in providers/opencode/permission-envelope.mjs.",
    "",
    "Finally execute these additional bounded Bash calls:",
    "7. ls -1 providers/opencode",
    "8. node --check providers/opencode/permission-envelope.mjs",
    "",
    "Return exactly one JSON object after all operations:",
    JSON.stringify({
      task_id: TASK_ID,
      work_order_id: WO_ID,
      diagnostic_status: "COMPLETE",
      findings: {
        current_branch: "<git branch output>",
        recent_commits: "<git log output>",
        git_status: "<git status output>",
        permission_prompts_encountered: 0,
      },
    }),
  ].join("\n");
}

async function run() {
  process.chdir(REPO_ROOT);
  const context_receipt = rehydrateGovernance();
  const authority = deriveTaskAuthority(context_receipt);

  const sdkModule = await import("@opencode-ai/sdk");
  requireCondition(
    typeof sdkModule.createOpencode === "function",
    "@opencode-ai/sdk createOpencode export is unavailable",
    "api_verification",
    "BOOTSTRAP_ENTRYPOINT_MISSING",
  );
  requireCondition(
    typeof adapter?.materializeEnvelope === "function" &&
      typeof adapter?.start === "function" &&
      typeof adapter?.createSession === "function" &&
      typeof adapter?.execute === "function" &&
      typeof adapter?.stop === "function",
    "OpenCode adapter bootstrap lifecycle is incomplete",
    "api_verification",
    "BOOTSTRAP_ENTRYPOINT_MISSING",
  );
  evidence.actual_apis_verified = true;

  adapter.registerEnvelope(TASK_ID, WO_ID, authority.envelope);
  adapter.registerRehydrationRecord(TASK_ID, WO_ID, authority.rehydration_record);

  const materialized = adapter.materializeEnvelope(authority.envelope);
  evidence.materializer_invoked = true;
  const materializedValidation = validateMaterialized(materialized);
  evidence.materialized_policy_valid = materializedValidation.valid;
  requireCondition(
    materializedValidation.valid,
    `Materialized policy invalid: ${materializedValidation.errors.join(", ")}`,
    "materialization",
    "LAYER_6_ADAPTER_MATERIALIZATION",
  );
  summarizeNativeRules(materialized);

  const runtimeHandle = await adapter.start({
    config: materialized,
    hostname: "127.0.0.1",
    port: 0,
    timeout: 30000,
  });
  runtime_started = true;
  const runtimeClient = adapter.runtimeClient;
  evidence.config_passed_to_runtime = adapter.runtime_config === materialized;
  evidence.runtime_created = Boolean(adapter.runtimeServer?.url);
  evidence.runtime_identifier = runtimeHandle.runtime_identifier;

  const effectiveConfig = (await runtimeClient.config.get()).data;
  verifyEffectiveRuntimePolicy(materialized, effectiveConfig);
  requireCondition(
    evidence.config_passed_to_runtime && evidence.effective_runtime_policy_verified,
    "Materialized policy was not proven on the newly created runtime",
    "runtime_policy_verification",
    "LAYER_6_ADAPTER_MATERIALIZATION",
  );

  const runtimePath = (await runtimeClient.path.get()).data;
  evidence.runtime_directory = runtimePath.directory;
  requireCondition(
    runtimePath.directory === REPO_ROOT && runtimePath.worktree === REPO_ROOT,
    `Runtime is not rooted at repository: ${runtimePath.directory}`,
    "runtime_binding",
    "LAYER_8_EXECUTION_PATH_BYPASS",
  );

  const eventSubscription = await adapter.subscribeToEvents({
    onEvent: handleRuntimeEvent,
    onError: error => evidence.errors.push({ step: "runtime_event_stream", error: error.message }),
  });
  await withTimeout(eventSubscription.ready, EVENT_READY_TIMEOUT_MS, "OpenCode event stream readiness");
  evidence.event_stream_observed = true;

  const workOrder = {
    ...authority.task,
    title: "DPT provider bootstrap diagnostic",
  };
  session_id = await adapter.createSession(workOrder);
  evidence.session_created = true;
  evidence.session_id = session_id;

  const session = (await runtimeClient.session.get({ path: { id: session_id } })).data;
  evidence.session_directory = session.directory;
  evidence.session_bound_to_materialized_runtime = Boolean(
    session.id === session_id &&
      session.directory === REPO_ROOT &&
      adapter.runtimeClient === runtimeClient &&
      evidence.config_passed_to_runtime &&
      evidence.effective_runtime_policy_verified,
  );
  requireCondition(
    evidence.session_bound_to_materialized_runtime,
    "Session was not proven on the materialized repository runtime",
    "session_binding",
    "LAYER_8_EXECUTION_PATH_BYPASS",
  );

  evidence.diagnostic_dispatched = true;
  const executionPromise = adapter.execute(session_id, diagnosticPrompt(), {
    task_id: TASK_ID,
    work_order_id: WO_ID,
  });
  let executionResult = null;
  try {
    executionResult = await withTimeout(executionPromise, DIAGNOSTIC_TIMEOUT_MS, "Diagnostic Work Order");
  } catch (error) {
    if (!permission_event_abort_requested) {
      try { await adapter.abortSession(session_id); } catch {}
    }
    recordError(
      "diagnostic_dispatch",
      error,
      permission_events.length > 0
        ? "LAYER_7_NATIVE_PERMISSION_EVALUATION"
        : "LAYER_8_EXECUTION_PATH_BYPASS",
    );
  }

  let messageRecords = [];
  try {
    messageRecords = (await adapter.runtimeClient.session.messages({ path: { id: session_id } })).data ?? [];
  } catch (error) {
    evidence.errors.push({ step: "diagnostic_messages", error: error.message });
  }
  const responseData = executionResult?.response ?? null;
  const diagnosticEvidence = collectDiagnosticEvidence(responseData, messageRecords);
  evidence.spawned_runtime_permission_prompts = permission_events.length;
  evidence.spawned_runtime_authorized_operation_prompts = permission_events.length;
  evidence.owner_permission_popups = permission_events.length;

  const acceptanceReady = Boolean(      executionResult &&
      evidence.errors.length === 0 &&
      evidence.runtime_created &&
      evidence.session_created &&
      evidence.session_bound_to_materialized_runtime &&
      evidence.event_stream_observed &&
      evidence.diagnostic_completed &&
      diagnosticEvidence.requiredOrderValid &&
      diagnosticEvidence.failedTools.length === 0 &&
      diagnosticEvidence.unauthorizedCommands.length === 0 &&
      evidence.missing_required_commands.length === 0 &&
      evidence.missing_required_repository_tools.length === 0,
  );

  if (acceptanceReady && evidence.owner_permission_popups === 0) {
    evidence.zero_prompt_acceptance = "PASS";
    evidence.failure_layer = "NONE";
    evidence.root_cause = "The previous launcher had no functioning pre-start DPT path: envelope/materialized variables were block-scoped, and the normal interactive path bypassed the adapter-controlled runtime.";
  } else if (evidence.owner_permission_popups > 0) {
    evidence.zero_prompt_acceptance = "FAIL";
    evidence.failure_layer = "LAYER_7_NATIVE_PERMISSION_EVALUATION";
    evidence.root_cause = `OpenCode emitted ${evidence.owner_permission_popups} permission request event(s) for the authorized diagnostic session.`;
  } else if (evidence.errors.length > 0 || !acceptanceReady) {
    evidence.zero_prompt_acceptance = "INCONCLUSIVE";
    if (evidence.failure_layer === "UNRESOLVED") evidence.failure_layer = "LAYER_8_EXECUTION_PATH_BYPASS";
  }
}

async function main() {
  adapter = createOpenCodeAdapter({ state_dir: join(REPO_ROOT, ".dpt-bootstrap-runtime-state") });
  try {
    await run();
  } catch (error) {
    if (!evidence.errors.some(entry => entry.error === (error?.message ?? String(error)))) {
      recordError("bootstrap", error, evidence.failure_layer === "UNRESOLVED" ? "BOOTSTRAP_ENTRYPOINT_MISSING" : evidence.failure_layer);
    }
    if (evidence.zero_prompt_acceptance === "INCONCLUSIVE" && evidence.owner_permission_popups > 0) {
      evidence.zero_prompt_acceptance = "FAIL";
    }
  } finally {
    if (runtime_started) {
      try {
        await adapter.stop();
      } catch (error) {
        evidence.errors.push({ step: "runtime_shutdown", error: error.message });
      }
    }
    evidence.runtime_event_types = [...new Set(observed_runtime_events.map(event => event?.type ?? "unknown"))];
    evidence.harness_development_session_prompts = 0;
    evidence.spawned_runtime_permission_prompts = permission_events.length;
    evidence.spawned_runtime_authorized_operation_prompts = permission_events.length;
    evidence.owner_permission_popups = permission_events.length;
    if (evidence.zero_prompt_acceptance === "PASS" && evidence.owner_permission_popups !== 0) {
      evidence.zero_prompt_acceptance = "FAIL";
    }
  }

  console.log(JSON.stringify({
    ...evidence,
    permission_events,
  }, null, 2));
  process.exit(evidence.zero_prompt_acceptance === "PASS" ? 0 : 1);
}

await main();
