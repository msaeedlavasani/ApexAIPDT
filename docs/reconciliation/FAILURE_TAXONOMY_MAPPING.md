# DPT-MIG-001.B — Failure Taxonomy Reconciliation

## 1. Purpose

Map ApexAIPDT's failure classification (domain + runtime classes) to Lab's runtime failure taxonomy. Preserve the architectural separation between FAILURE CLASSIFICATION (what failed) and POLICY/DISPOSITION (what to do about it).

## 2. Source References

**ApexAIPDT:** `docs/FAILURE_INTELLIGENCE.md` (domain classes + runtime classes)

**Lab:**
- `orchestrator/state/task-model.mjs` (FailureClass enum, 17 values; Disposition enum, 10 values; AttemptOutcome enum, 7 values)
- `orchestrator/evidence/failure-classifier.mjs` (priority-ordered signal matching, 168 lines)
- `orchestrator/evidence/failure-record.mjs` (FailureRecord: 8 domains, 3 strengths)
- `orchestrator/core/task-policy.mjs` (disposition decision from FailureClass)

## 3. Architectural Principle

**FAILURE CLASSIFICATION ≠ POLICY/DISPOSITION.**

A failure class describes WHAT failed. A disposition describes WHAT TO DO. The same failure class may lead to different dispositions depending on context (budget, retries, alternatives available). These must remain separate concerns.

Lab correctly implements this separation:
- `FailureClass` = what failed (classification)
- `Disposition` = what to do (policy output)
- `decideTaskPolicy()` maps classification → disposition based on context

## 4. Domain Class Mapping

### 4.1 ApexAIPDT Domain Classes → Lab Failure Domains

ApexAIPDT defines failure domains as high-level categories of what went wrong. Lab's `FailureDomain` enum in `failure-record.mjs` provides 8 runtime domain values: `PROVIDER`, `TRANSPORT`, `RUNTIME`, `REPORT`, `VALIDATION`, `TASK`, `POLICY`, `UNKNOWN`. These categorize where in the execution pipeline the failure occurred, not the nature of the defect.

| DPT Domain Class | Description | Lab FailureDomain | Alignment |
|-----------------|-------------|-------------------|-----------|
| `product` | Requirements, specs, acceptance criteria | `VALIDATION` | PARTIAL — Lab's `VALIDATION` covers spec/requirements mismatches; DPT's `product` is narrower (requirements only) |
| `design` | Architecture, interface contracts, component boundaries | `VALIDATION` | PARTIAL — Lab's `VALIDATION` covers contract/interface failures; no separate design domain |
| `architecture` | System structure, module boundaries, dependency direction | `VALIDATION` | PARTIAL — Lab's `VALIDATION` covers structural contract failures; no separate architecture domain |
| `implementation` | Logic errors, regressions, code defects | `RUNTIME` | PARTIAL — Lab's `RUNTIME` covers execution-time code failures; DPT distinguishes logic errors from runtime environment |
| `data` | Schema, format, corruption, state inconsistency | `VALIDATION` | PARTIAL — Lab's `VALIDATION` covers schema/format mismatches; state corruption may also appear as `REPORT` |
| `security` | Auth, access control, secrets, injection | `POLICY` | PARTIAL — Lab's `POLICY` covers access control and auth policy violations; provider-level auth errors map to `PROVIDER` |
| `operations` | Deployment, config, environment, dependencies | `TRANSPORT` | PARTIAL — Lab's `TRANSPORT` covers deployment/environment transport; config issues may map to `RUNTIME` |
| `test` | Test design, coverage, flakiness, assertion gaps | `VALIDATION` | PARTIAL — Lab's `VALIDATION` covers test verification failures; no separate test domain |
| (no DPT equivalent) | Provider-side failures | `PROVIDER` | GAP — Lab has a `PROVIDER` domain for LLM provider errors; DPT should adopt |
| (no DPT equivalent) | Task-level failures | `TASK` | GAP — Lab has a `TASK` domain for task-level structural failures; DPT should adopt |
| (no DPT equivalent) | Output/report issues | `REPORT` | GAP — Lab has a `REPORT` domain for malformed or invalid worker output; DPT should adopt |
| (no DPT equivalent) | Catch-all | `UNKNOWN` | GAP — Lab has an `UNKNOWN` fallback domain; DPT should adopt |

### 4.2 Lab FailureDomain → DPT Domain Class

| Lab FailureDomain | DPT Domain Class | Notes |
|-------------------|-----------------|-------|
| `PROVIDER` | (no DPT equivalent) | Provider-side failures; DPT should adopt |
| `TRANSPORT` | operations (partial) | Deployment/environment transport failures |
| `RUNTIME` | implementation (partial) | Execution-time code failures |
| `REPORT` | (no DPT equivalent) | Malformed or invalid worker output; DPT should adopt |
| `VALIDATION` | product OR design OR data OR test | Lab's `VALIDATION` covers requirements, contracts, schema, and test verification failures; DPT distinguishes these as separate domains |
| `TASK` | (no DPT equivalent) | Task-level structural failures; DPT should adopt |
| `POLICY` | security (partial) | Access control and policy violations |
| `UNKNOWN` | (no DPT equivalent) | Lab fallback; DPT should adopt |

### 4.3 Domain Strength

Lab's FailureRecord includes a `strength` field: `RELIABLE`, `STRONG`, `AMBIGUOUS`. This is a confidence annotation on the domain classification, not a separate entity. DPT should adopt this concept.

## 5. Runtime Failure Class Mapping

### 5.1 ApexAIPDT Runtime Classes → Lab FailureClass

ApexAIPDT runtime failure classes describe execution-level failures. Lab's `FailureClass` enum (17 values) covers these.

| DPT Runtime Concept | Lab FailureClass | Alignment |
|--------------------|-----------------|-----------|
| No failure | `NONE` | ALIGNED |
| Worker exit failure | `WORKER_EXIT_FAILURE` | ALIGNED |
| Timeout | `TIMEOUT` | ALIGNED |
| Provider model failure | `PROVIDER_MODEL_FAILURE` | ALIGNED |
| Provider unavailable | `PROVIDER_UNAVAILABLE` | ALIGNED |
| Transport error | `TRANSPORT_ERROR` | ALIGNED |
| Rate limit | `RATE_LIMIT` | ALIGNED |
| Auth error | `AUTH_ERROR` | ALIGNED |
| Entitlement error | `ENTITLEMENT_ERROR` | ALIGNED |
| Quota exhausted | `QUOTA_EXHAUSTED` | ALIGNED |
| Policy denied | `POLICY_DENIED` | ALIGNED |
| Test failure | `TEST_FAILURE` | ALIGNED |
| Rework exhausted | `REWORK_EXHAUSTED` | ALIGNED |
| Route exhausted | `ROUTE_EXHAUSTED` | ALIGNED |
| (no DPT equivalent) | `INVALID_REPORT` | GAP — Lab detects malformed worker output; DPT should adopt |
| (no DPT equivalent) | `TASK_FAILURE` | GAP — Lab classifies task-level structural failure; DPT should adopt |
| (no DPT equivalent) | `UNKNOWN` | GAP — Lab fallback classification when root cause cannot be determined; DPT should adopt |

### 5.2 Lab FailureClass → DPT Mapping

| Lab FailureClass | DPT Equivalent | Notes |
|-----------------|---------------|-------|
| `NONE` | No failure | Correct |
| `WORKER_EXIT_FAILURE` | Worker exit failure | Correct |
| `TIMEOUT` | Timeout | Correct |
| `PROVIDER_MODEL_FAILURE` | Provider model failure | Correct |
| `PROVIDER_UNAVAILABLE` | Provider unavailable | Correct |
| `TRANSPORT_ERROR` | Transport error | Correct |
| `RATE_LIMIT` | Rate limit | Correct |
| `AUTH_ERROR` | Auth error | Correct |
| `ENTITLEMENT_ERROR` | Entitlement error | Correct |
| `QUOTA_EXHAUSTED` | Quota exhausted | Correct |
| `POLICY_DENIED` | Policy denied | Correct |
| `TEST_FAILURE` | Test failure | Correct |
| `REWORK_EXHAUSTED` | Rework exhausted | Correct |
| `ROUTE_EXHAUSTED` | Route exhausted | Correct |
| `INVALID_REPORT` | (missing in DPT) | NEW — should be adopted |
| `TASK_FAILURE` | (missing in DPT) | NEW — task-level structural failure; should be adopted |
| `UNKNOWN` | (missing in DPT) | NEW — fallback classification; should be adopted |

## 6. Disposition Mapping

### 6.1 Lab Disposition Enum

Lab's `Disposition` (10 values) represents the policy outcome — what to do about a failure:

| Lab Disposition | Meaning | DPT Policy Concept |
|----------------|---------|-------------------|
| `NONE` | No action needed | Success / no policy action |
| `REWORK_REQUIRED` | Fix and re-attempt | Retry/fix |
| `REROUTE` | Try alternative route | Replan/reroute |
| `ESCALATE_REPLAN_OR_REROUTE` | Owner must decide between replan or reroute | Escalate |
| `BLOCKED_EXTERNAL_DEPENDENCY` | Blocked on external dependency | Wait (external) |
| `BLOCKED_BY_TASK` | Blocked on another task | Wait (task) |
| `BLOCKED_BY_RESOURCE` | Blocked on resource availability | Wait (resource) |
| `BLOCKED_BY_PERMISSION` | Blocked on permission grant | Wait (permission) |
| `BLOCKED_BY_SECRET` | Blocked on secret/credential provisioning | Wait (secret) |
| `WAITING_FOR_HUMAN_GATE` | Human must act before proceeding | Human gate |

### 6.2 DPT Policy Concepts → Lab Disposition

| DPT Policy Concept | Lab Disposition | Alignment |
|-------------------|----------------|-----------|
| Complete (SUCCESS) | `NONE` (on success path) | ALIGNED |
| Retry/fix | `REWORK_REQUIRED` | ALIGNED |
| Replan/reroute | `REROUTE` | ALIGNED |
| Escalate | `ESCALATE_REPLAN_OR_REROUTE` | ALIGNED |
| Human gate | `WAITING_FOR_HUMAN_GATE` | ALIGNED |
| Block (external) | `BLOCKED_EXTERNAL_DEPENDENCY` | PARTIAL — Lab has 5 BLOCKED_* variants; DPT uses a single Block concept |
| Block (task) | `BLOCKED_BY_TASK` | PARTIAL — Lab distinguishes blocking reason; DPT abstracts |
| Block (resource) | `BLOCKED_BY_RESOURCE` | PARTIAL — Lab distinguishes blocking reason; DPT abstracts |
| Block (permission) | `BLOCKED_BY_PERMISSION` | PARTIAL — Lab distinguishes blocking reason; DPT abstracts |
| Block (secret) | `BLOCKED_BY_SECRET` | PARTIAL — Lab distinguishes blocking reason; DPT abstracts |

### 6.3 Critical Separation: FailureClass ≠ Disposition

Lab correctly separates these:

```
FailureClass = what failed (classification)
Disposition = what to do (policy decision)
```

`decideTaskPolicy()` maps FailureClass → Disposition based on context:
- `TEST_FAILURE` + rework budget available → `REWORK_REQUIRED`
- `TEST_FAILURE` + rework exhausted + alternatives → `REROUTE`
- `TEST_FAILURE` + rework exhausted + no alternatives → `ESCALATE_REPLAN_OR_REROUTE`
- `AUTH_ERROR` → dedicated block (lines 94–101 in task-policy.mjs) returns immediately with `ESCALATE_REPLAN_OR_REROUTE`; NEVER reaches the reroutable check (lines 125–137); always escalates regardless of alternative routes
- `POLICY_DENIED` → always `ESCALATE_REPLAN_OR_REROUTE` (bypass forbidden)

**DPT must not collapse these into a single enum.** The separation is architecturally correct.

## 7. AttemptOutcome Mapping

### 7.1 Lab AttemptOutcome

Lab's `AttemptOutcome` (7 values) captures the worker's reported result:

| Lab AttemptOutcome | DPT Concept | Notes |
|-------------------|-----------|-------|
| `SUCCESS` | Result.success = true | Worker claims success |
| `INVALID_REPORT` | (no DPT equivalent) | Worker output is malformed |
| `TEST_FAILURE` | Result with test failure | Tests failed |
| `TASK_FAILURE` | Result with task failure | Worker reports failure |
| `PROVIDER_FAILURE` | Result with provider failure | Provider error |
| `RUNTIME_FAILURE` | Result with runtime failure | Execution error |
| `UNKNOWN` | Result with unknown outcome | Cannot determine |

### 7.2 AttemptOutcome ≠ FailureClass

AttemptOutcome is what the worker REPORTED. FailureClass is what the classifier DETERMINED. They may differ:
- Worker reports `SUCCESS` but classifier determines `TEST_FAILURE` (tests failed)
- Worker reports `TASK_FAILURE` but classifier determines `AUTH_ERROR` (root cause)

Lab correctly separates these: WorkerResult has `attempt_outcome` (worker claim) AND `failure_class` (classifier determination).

## 8. Classifier Signal Mapping

### 8.1 Lab Failure Classifier Signals

Lab's `failure-classifier.mjs` uses priority-ordered signal matching:

| Signal | Priority | Detection Method | DPT Equivalent |
|--------|----------|-----------------|---------------|
| `timed_out` flag | 1 (highest) | WorkerResult.timed_out | Timeout detection |
| `exit_code === 124` | 2 | Exit code analysis | Timeout (SIGTERM) |
| `exit_code` + stderr patterns | 3 | Exit code + stderr | Provider error detection |
| `attempt_outcome` field | 4 | Worker self-report | Result interpretation |
| `stderr` keyword matching | 5 (lowest) | Text pattern matching | Failure classification |

### 8.2 DPT Signal Concepts → Lab Signals

DPT defines failure classification through evidence analysis. Lab implements this as a priority-ordered signal chain:

| DPT Concept | Lab Signal | Notes |
|------------|-----------|-------|
| Timeout detection | `timed_out` flag + exit code 124 | ALIGNED — DPT should adopt dual-signal approach |
| Provider error detection | stderr pattern matching (55 patterns) | ALIGNED — Lab has comprehensive provider error detection |
| Auth error detection | stderr patterns: "auth", "api key", "token" | ALIGNED |
| Rate limit detection | stderr patterns: "rate limit", "429", "too many requests" | ALIGNED |
| Policy denial detection | stderr patterns: "policy", "not allowed", "denied" | ALIGNED |
| Test failure detection | attempt_outcome = TEST_FAILURE | ALIGNED |
| Worker exit failure | exit_code !== 0 + no other match | ALIGNED |

## 9. Gaps

| Gap | DPT Concept Missing in Lab | Severity | Migration Impact |
|-----|---------------------------|----------|-----------------|
| No product domain | DPT distinguishes product (requirements) from design (architecture) | LOW | Lab's `VALIDATION` domain covers both; acceptable for V1 |
| No performance domain | DPT has no performance failure domain | LOW | Lab has no dedicated performance domain; neither system has one |
| No INVALID_REPORT class | DPT has no class for malformed worker output | MEDIUM | Lab's `INVALID_REPORT` is important for robustness; DPT should adopt |
| No domain strength | DPT has no confidence annotation on domain classification | LOW | Lab's RELIABLE/STRONG/AMBIGUOUS is useful; DPT should adopt |
| No signal priority chain | DPT has no formal signal priority ordering | MEDIUM | Lab's priority-ordered classifier is more robust; DPT should adopt |

## 10. Overlaps

| Overlap | DPT Concept | Lab Implementation | Alignment |
|---------|-----------|-------------------|-----------|
| Failure classification | Domain + runtime classes | FailureClass + FailureDomain | ALIGNED |
| Policy separation | Classification ≠ Policy | FailureClass ≠ Disposition | ALIGNED |
| Timeout detection | Runtime failure | timed_out flag + exit code | ALIGNED |
| Provider error detection | Runtime failure | stderr pattern matching | ALIGNED |
| Test failure | Domain class | FailureClass.TEST_FAILURE | ALIGNED |
| Auth error | Runtime failure | FailureClass.AUTH_ERROR | ALIGNED |
| Rate limit | Runtime failure | FailureClass.RATE_LIMIT | ALIGNED |
| Escalation | Policy concept | Disposition.ESCALATE_REPLAN_OR_REROUTE | ALIGNED |

## 11. Incompatibilities

| Incompatibility | DPT Semantics | Lab Semantics | Resolution |
|----------------|--------------|---------------|-----------|
| Domain granularity | 8 domain classes (product, design, architecture, implementation, data, security, operations, test) | 8 domains (PROVIDER, TRANSPORT, RUNTIME, REPORT, VALIDATION, TASK, POLICY, UNKNOWN) | Different taxonomy axes — DPT categorizes by defect nature; Lab categorizes by execution pipeline location; map DPT domains to Lab domains based on likely pipeline location |
| FailureClass count | ~12 runtime classes | 17 classes | Lab is superset; DPT should adopt Lab's full set |
| Disposition count | ~6 policy outcomes | 10 dispositions | Lab is superset; DPT should adopt Lab's full set |
| Signal priority | No formal priority | Priority-ordered signal chain | Adopt Lab's priority approach |
| Domain strength | No confidence annotation | RELIABLE/STRONG/AMBIGUOUS | Adopt Lab's strength concept |

## 12. Recommended Canonical Interpretation

1. **Adopt Lab's FailureClass (17 values) as the canonical failure classification.** It is a superset of DPT's runtime classes and includes important additions like `INVALID_REPORT`.

2. **Adopt Lab's Disposition (10 values) as the canonical policy outcome.** It is a superset of DPT's policy concepts and includes granular blocking states (`BLOCKED_EXTERNAL_DEPENDENCY`, `BLOCKED_BY_TASK`, `BLOCKED_BY_RESOURCE`, `BLOCKED_BY_PERMISSION`, `BLOCKED_BY_SECRET`) and `WAITING_FOR_HUMAN_GATE`.

3. **Adopt Lab's FailureDomain (8 values) as the canonical domain classification.** These are: `PROVIDER`, `TRANSPORT`, `RUNTIME`, `REPORT`, `VALIDATION`, `TASK`, `POLICY`, `UNKNOWN`. DPT's domain classes (product, design, architecture, implementation, data, security, operations, test) categorize by defect nature; Lab's domains categorize by execution pipeline location. DPT should adopt Lab's pipeline-location domains as an additional classification layer, mapping DPT domain classes to the most likely Lab domain.

4. **Adopt Lab's FailureRecord strength concept (RELIABLE/STRONG/AMBIGUOUS).** This is a useful confidence annotation missing from DPT.

5. **Adopt Lab's priority-ordered signal chain for failure classification.** This is more robust than unstructured signal matching.

6. **DO NOT collapse FailureClass and Disposition into a single enum.** The separation is architecturally correct and must be preserved.

7. **DO NOT collapse AttemptOutcome and FailureClass.** Worker self-report and classifier determination are different concerns.

8. **Map DPT's domain classes to Lab's FailureDomain based on pipeline location.** For V1, map DPT `product`, `design`, `architecture`, `data`, and `test` to Lab's `VALIDATION`; map `implementation` to `RUNTIME`; map `operations` to `TRANSPORT`; map `security` to `POLICY`. Future work can introduce finer-grained mappings.

---

*DPT-MIG-001.B — Generated 2026-09-02 — ApexAIPDT reconciliation*
