# Apex AI DPT — Canonical Authority & Permission Model

**Status:** Accepted architecture direction  
**Scope:** Authority semantics, permission model, decision outcomes, and mode interaction.  
**Supersedes:** Ad-hoc authority reasoning in any prior informal model.

---

## 1. Foundational Principle

Authority belongs to the **Owner**. DPT receives only delegated authority that is **explicit, scoped, auditable, and revocable**. Capability is never permission. Technical ability to perform an action does not constitute authorization to perform it.

> **Article 11 (Constitution):** Every role has responsibilities and decision boundaries. An agent must not make decisions outside its authority merely because it can technically do so.

---

## 2. Authority Properties

Every delegation or grant of authority carries all of the following properties. A grant that lacks any one of them is not a valid DPT authority grant.

| Property | Definition |
|---|---|
| **Scoped** | Authority is bounded to a specific task, workspace, resource, or context. Unbounded authority is not authority — it is an uncontrolled risk. |
| **Auditable** | Every authority grant, evaluation, decision, and revocation is recorded as a durable governance record with actor, rationale, policy version, and evidence. |
| **Revocable** | The Owner may narrow or revoke authority at any time. Revocation prevents new work and moves active work toward the safest permitted stop. |
| **Explicit** | Authority is stated in a policy, Work Order, or grant. It is never inferred from capability, confidence, role seniority, mode level, or prior successful actions. |
| **Durable** | Authority state persists across restarts, sessions, and context resets. It does not evaporate when a conversation ends. |
| **Action-specific** | Where required by policy, authority is granted per action type (e.g., `file.write`, `deploy`, `dependency.change`) rather than as a blanket mode-level grant. |

---

## 3. Distinguished Concepts

The following concepts are **distinct and must not be conflated**. Conflating them is an authority-model defect that leads to either over-permissioning or false denials.

### 3.1 Authorization

**What the DPT Authority Policy permits.**  
Authorization is the result of evaluating the applicable Authority Policy against an action, actor, scope, environment, risk, and cost. It is the DPT control-plane answer to "may this actor do this thing in this context?"

Authorization is:
- Defined by the Owner through the Authority Policy
- Evaluated by the Execution Orchestrator before every Work Order and at material action boundaries
- Scoped, auditable, explicit, and revocable
- Subject to mode defaults, task-specific overrides, inheritance ceilings, and risk envelopes

### 3.2 Permission

**What the provider or runtime environment allows.**  
Permission is the infrastructure or platform answer to "does this executor have access to this resource or system?" Examples: OS user permissions, file-system ACLs, cloud IAM roles, container capabilities, network policies.

Permission is:
- Defined by the infrastructure operator
- Evaluated by the runtime or provider
- Independent of DPT authorization — a DPT-authorized action can fail on provider permission, and vice versa
- **Not a substitute for DPT authorization** — satisfying provider permission does not grant DPT authority

### 3.3 Capability

**What the provider or executor can physically do.**  
Capability is the technical ability to perform an action. An LLM can generate arbitrary code. A shell can execute destructive commands. A cloud API can provision resources.

Capability is:
- A property of the executor or environment
- **Never permission and never authorization** — the ability to do something does not mean it is authorized
- A necessary but insufficient condition for execution

### 3.4 Policy

**The DPT rules governing behavior.**  
Policy is the Owner-controlled specification of what is permitted, prohibited, gated, or required. It includes mode defaults, task-specific overrides, risk envelopes, approval gates, budget limits, escalation rules, provider constraints, and revocation state.

Policy is:
- The authoritative source for all DPT authorization decisions
- Evaluated before action, not after
- Subject to inheritance and the policy ceiling
- Versioned and auditable

### 3.5 Provider Prompt

**A runtime permission request from a provider or platform.**  
A provider prompt (e.g., "Do you want to allow this app to access your files?") is an infrastructure-level permission gate. It is **not** a Human Gate.

Provider prompts are:
- Infrastructure permission checks, not DPT policy decisions
- Often coarse-grained and not task-scoped
- Not evidence of DPT authority — even if the user grants a provider prompt, DPT authorization must still be satisfied
- Not escalation — they do not constitute a DPT decision package

### 3.6 Human Gate

**A genuine DPT policy requirement for human judgment.**  
A Human Gate occurs when the Authority Policy explicitly requires human decision-making for a specific action, context, or risk level. It is a **first-class DPT concept**, not a provider artifact.

Human Gates are:
- Triggered by DPT policy, not by provider infrastructure
- Scoped to the specific decision requiring human judgment
- Recorded as an escalation with context, evidence, options, and the smallest required Owner action
- Not a failure — escalation is a feature, not a bug (Constitution Article 19)

**Distinction from provider prompts:** A provider prompt asks "do you allow this app?" A Human Gate asks "given this specific task context, risk, and policy, should the Owner or operator make this decision?"

### 3.7 Scope Violation

**An operation outside the authorized task scope.**  
A scope violation occurs when an action falls outside the boundaries defined by the current Work Order, Authority Policy, or delegated grant. Scope violations are policy-level denials, not permission errors.

Scope violations:
- Are detected by the Execution Orchestrator during policy evaluation
- Indicate the action was never within the delegated authority
- Require re-authorization, a new Work Order, or escalation — not silent execution
- May occur during execution-time discovery (claim expansion) if the Orchestrator does not approve the expanded scope

---

## 4. Decision Outcomes

Every authority evaluation produces exactly one of the following outcomes. These are mutually exclusive and exhaustive.

### 4.1 AUTO_ALLOW

**Operation is pre-authorized by DPT policy; no human interruption required.**

- The action falls within an existing policy grant, mode allowance, risk envelope, budget, and all applicable constraints
- No approval gate or Human Gate applies
- The executor may proceed without pausing for human input
- The evaluation and its evidence are recorded in the audit trail

AUTO_ALLOW is **not** unconditional. It applies only for the specific action, actor, scope, environment, time window, and risk level evaluated. A change in any of these factors triggers re-evaluation.

### 4.2 DENY

**Operation is forbidden by DPT policy; fail-closed.**

- The action violates an explicit prohibition, exceeds the policy ceiling, falls outside the risk envelope, breaches a budget, or fails any other applicable constraint
- Execution is **not permitted** — the system fails closed
- The denial is recorded with the policy version, rationale, and evidence
- The executor must not attempt a workaround, retry, or alternative path that targets the same forbidden outcome
- DENY is **never overridden** by executor confidence, capability, or repeated failure

### 4.3 HUMAN_GATE

**Operation requires explicit human judgment; genuine DPT policy requirement.**

- The Authority Policy explicitly requires human decision-making for this action type, risk level, context, or ambiguity
- The action cannot proceed without a recorded human decision (approve, deny, or modify)
- An escalation package is constructed with the blocked decision, Intent/Task/Attempt context, evidence, options, risks, time sensitivity, and the smallest required human action
- The human decision becomes the authoritative grant or denial for this and potentially future evaluations

HUMAN_GATE is **not** a fallback for ambiguous policy. If the policy is ambiguous, see §6 (Fail-Closed Behavior). HUMAN_GATE is a **deliberate policy design choice** that a class of decisions requires human judgment.

---

## 5. Precedence

### 5.1 Task-Specific Policy Overrides Generic Mode Policy

When evaluating an action:

1. Start with the project default mode and its associated permissions.
2. Check for task-specific overrides: a Work Order, Plan constraint, or action-level grant/prohibition that narrows or specifies permissions for this particular task.
3. **Task-specific policy wins.** If a task-specific rule prohibits an action that the default mode would allow, the action is denied. If a task-specific rule gates an action that the default mode would AUTO_ALLOW, the gate applies.
4. Within a task, check action-level overrides before falling back to mode-level defaults.

The rule: **more specific always wins over more general.** A task-specific prohibition overrides a mode-level allowance. A mode-level allowance overrides a project-default posture.

### 5.2 DPT Authority Overrides Provider Defaults

When evaluating an action that has both DPT policy implications and provider/runtime permission implications:

1. **DPT authority is the primary gate.** The Execution Orchestrator evaluates DPT policy first.
2. If DPT authority is granted (AUTO_ALLOW or approved HUMAN_GATE), the action proceeds to provider permission checks.
3. If DPT authority is DENY, the action is blocked regardless of provider permission — **a provider-level "yes" cannot override a DPT "no."**
4. If DPT authority is granted but provider permission is denied, the action fails on provider permission — this is an infrastructure error, not an authority error.

The rule: **DPT authorization is necessary and provider permission is necessary. Both must be satisfied. DPT authority has precedence in the evaluation sequence.**

### 5.3 Inheritance Ceiling

Authority is inherited: Owner → DPT → Orchestrator → executor (via Work Order). Each step in the chain may **narrow** authority but must **never expand** it. The effective permission is the intersection of all applicable grants and restrictions across the entire inheritance chain.

A delegate cannot grant authority it did not receive. A Work Order cannot authorize an action that the Orchestrator was not itself authorized to authorize.

---

## 6. Fail-Closed Behavior

When authority is **ambiguous**, the system **fails closed**:

1. If applicable rules cannot be resolved unambiguously, the action is **not AUTO_ALLOW** — it requires escalation or a Human Gate.
2. If the policy does not explicitly address the action, the default is **deny** — absence of authorization is not authorization.
3. If the risk level or impact of an action cannot be determined, the action is treated as high-risk and subjected to the strictest applicable constraints.
4. If the identity, scope, or context of an actor is uncertain, the system applies the narrowest applicable authority.
5. Ambiguity **never widens authority.** Every ambiguous case resolves toward less permissive, not more.

| Situation | Resolution |
|---|---|
| Policy is silent on the action | DENY — escalate to Owner |
| Policy version mismatch between grant and evaluation | DENY — re-evaluate under current version |
| Actor identity or scope is uncertain | Apply narrowest applicable authority |
| Risk level cannot be determined | Treat as highest applicable risk tier |
| Multiple conflicting rules, specificity cannot be resolved | DENY — escalate with decision package |
| Resource sensitivity classification is unknown | Apply strictest applicable governance constraint |
| Effective period of grant is unclear | DENY — require explicit renewal |

---

## 7. Mode 0–5 Interaction with Authority

Authority scales with autonomy mode. Higher modes grant broader pre-authorized action but remain subject to all authority properties, policy ceilings, and fail-closed behavior.

| Mode | Name | Authority posture | Human involvement |
|---|---|---|---|
| 0 | Observe | Read-only. No mutation authority. Any write attempt is DENY. | No Human Gate needed for observation. Any mutation triggers HUMAN_GATE. |
| 1 | Advise | Analyze, recommend, plan. No execution authority. Execution attempts are DENY. | No Human Gate for advice. Any execution trigger HUMAN_GATE. |
| 2 | Assisted Execution | Prepare and execute under approval at defined major gates. AUTO_ALLOW for preparation actions. HUMAN_GATE for execution at each gate. | Explicit approval required at each major gate. |
| 3 | Managed Execution | Execute independently inside predefined bounds. AUTO_ALLOW for in-scope actions. HUMAN_GATE for material exceptions, scope changes, or policy ambiguities. | Escalation at material exceptions and scope boundaries. |
| 4 | Autonomous Within Policy | Plan, delegate, execute, verify, retry, replan while policy permits. AUTO_ALLOW for all actions within the risk envelope, budget, and policy constraints. HUMAN_GATE when policy explicitly requires it or when risk/budget thresholds are approached. | Human judgment reserved for genuine policy gates and high-risk decisions. |
| 5 | Delegated Autonomy | Broad operational responsibility within the Owner's mandate, policy, and risk envelope. AUTO_ALLOW for the full range of operational actions within bounds. HUMAN_GATE for mandate changes, new risk categories, or actions exceeding the risk envelope. | Owner sets policy, risk envelope, and mandate. Human judgment at boundary conditions and mandate-level decisions. |

### Mode interaction rules:

1. **Mode does not override policy.** A Mode 5 executor with a task-specific prohibition on `deploy.production` is DENY for that action regardless of mode.
2. **Mode is a default posture, not a flat permission level.** Each mode defines a set of default permissions and gates. Specific policy overrides always apply.
3. **Lower modes preserve the Advisory Plane.** Modes 0 and 1 are non-invasive — they produce advice, not execution. An advisory artifact is not execution authority (Constitution Article 21).
4. **Higher modes do not eliminate Human Gates.** Even in Mode 5, the Owner's policy may require human judgment for specific action categories, risk levels, or contexts.
5. **Mode transitions are auditable.** Changing the mode for a project, task, or actor is a policy change that must be recorded.

---

## 8. Authority Evaluation Sequence

For every action, the Execution Orchestrator performs the following evaluation:

```text
1. Identify action, actor, target, environment, resource claims, sensitivity, risk, cost, time window
2. Resolve applicable policies: general → specific
3. Apply task-specific overrides before mode defaults
4. Check inheritance ceiling (cannot exceed upstream grants)
5. Check risk envelope, budget, and time constraints
6. Check provider/resource permission (separate from DPT authority)
7. Produce outcome: AUTO_ALLOW | DENY | HUMAN_GATE
8. Record: policy version, evidence, decision, actor, action, outcome in audit trail
```

Steps 2–4 enforce precedence. Step 5 enforces operational constraints. Step 6 enforces infrastructure constraints. Step 7 produces the decision. Step 8 ensures auditability.

---

## 9. Auditability Requirements

All of the following are **durable governance records**:

- Policy definitions and versions
- Policy changes (with effective period)
- Authority grants and delegations
- Authority evaluations (input context, applicable rules, outcome, rationale)
- Work Orders (with scope, policy, claims, and constraints)
- Approval gates (request, decision, actor, timestamp)
- Human Gate decisions (escalation package, human response, rationale)
- Revocations and kill-switch events
- Scope violations and claim expansions
- Mode transitions

Auditability is required **even when an action is fully autonomous within policy.** AUTO_ALLOW decisions are recorded with the same rigor as HUMAN_GATE decisions.

---

## 10. Revocation and Kill Switch

| Event | Behavior |
|---|---|
| **Policy narrowed** | New restrictions apply immediately. Active work re-evaluated under new constraints. Tasks that now violate policy are paused and escalated. |
| **Policy revoked** | No new Work Orders issued. Active Attempts follow safest permitted cancellation or containment. |
| **Kill switch activated** | Immediate suspension of all execution. Active work moves to safe-stop or containment. Audit trail preserved. |
| **Revocation during active work** | If immediate cancellation would cause greater harm (e.g., data corruption, safety risk), the Orchestrator records the condition and escalates while performing only the minimum authorized containment. |

Revocation is:
- Immediate for new work
- Safe-stop for active work (not necessarily immediate termination)
- Always auditable
- Owner-initiated (not agent-initiated)

---

## 11. Resource Sensitivity as Authority Input

Resource sensitivity is an **authority and governance input**, not merely scheduling metadata. A compatible concurrency claim may still require a narrower actor, provider, environment, action, or explicit approval based on resource sensitivity.

A resource's sensitivity classification is evaluated through Authority Policy and Governance. It may narrow eligible actors, environments, actions, providers, or approval paths even when concurrency would otherwise be safe.

Runtime claim expansion requires Orchestrator approval and a fresh policy evaluation. An executor **cannot** use discovery to expand its own authority or resource scope.

---

## 12. Summary Decision Matrix

| Condition | Outcome |
|---|---|
| Action within all policy grants, risk envelope, budget, constraints, and provider permission | AUTO_ALLOW |
| Action violates an explicit prohibition or exceeds policy ceiling | DENY |
| Policy explicitly requires human judgment for this action type or risk level | HUMAN_GATE |
| Policy is silent on the action | DENY — escalate |
| Ambiguity in rules, scope, or identity | DENY — fail-closed |
| DPT authorized but provider denies | Infrastructure failure (not authority error) |
| DPT denies but provider allows | DENY — provider permission is insufficient |
| Scope violation (action outside Work Order bounds) | DENY — re-authorize or escalate |
| Resource sensitivity requires narrower actor/environment | DENY or HUMAN_GATE per policy |
| Kill switch active | DENY all — safe-stop active work |

---

## Appendix: Glossary of Authority Terms

| Term | Definition |
|---|---|
| **Owner** | The human or entity with ultimate authority over the project. Authority originates from the Owner. |
| **Delegation** | The Owner's transfer of bounded authority to DPT or a downstream role. Delegation cannot expand the policy ceiling. |
| **Policy Ceiling** | The maximum authority that may be inherited or delegated. Downstream grants may narrow but cannot expand it. |
| **Risk Envelope** | The explicit risk bounds inside which autonomous action may occur. |
| **Effective Period** | The time window during which an authority grant is valid. |
| **Approval Gate** | A workflow condition requiring explicit human approval before advancement. |
| **Human Decision Boundary** | A point where AI cannot responsibly infer the answer from available evidence and authority and must request a human decision. |
| **Fail-Closed** | The system's default behavior when authority is ambiguous, incomplete, or uncertain: deny the action. |
| **Escalation Package** | A durable decision package including blocked decision, context, evidence, options, risks, time sensitivity, and the smallest required human action. |
