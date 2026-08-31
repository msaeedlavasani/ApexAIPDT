# Apex AI DPT — Authority Model

**Status:** Accepted architecture direction  
**Scope:** Governance semantics; exact schemas and enforcement technology remain open.

## Principle

Authority belongs to the Owner. DPT receives only delegated authority that is explicit, scoped, auditable, and revocable. Capability is never permission.

## Service / Authority Modes

| Mode | Name | Default delegation posture |
|---:|---|---|
| 0 | Observe | Inspect and report only. |
| 1 | Advise | Analyze, recommend, and plan; do not execute. |
| 2 | Assisted Execution | Prepare and execute work with approval at defined major gates. |
| 3 | Managed Execution | Execute independently inside predefined bounds; escalate material exceptions. |
| 4 | Autonomous Within Policy | Plan, delegate, execute, verify, retry, and replan while policy permits. |
| 5 | Delegated Autonomy | Hold broad operational responsibility within the Owner's mandate, policy, and risk envelope. |

Modes are defaults, not flat access levels. Mode 5 is not unlimited authority, and Mode 0/1 preserve the non-invasive Advisory Plane.

## Authority Policy

An Authority Policy should be able to express at least:

```text
Authority Policy
├── project default mode
├── scope overrides
├── action-level permissions and prohibitions
├── risk envelope
├── approval gates
├── budget and time limits
├── provider, privacy, and data constraints
├── environment constraints
├── escalation rules
├── inheritance and delegation ceiling
├── effective period
└── revocation / kill-switch state
```

The exact serialization is intentionally not defined in V0.

## Evaluation rules

1. Identify the action, actor, target, environment, Resource Claims, Resource sensitivity/governance classification, risk, cost, and applicable time window.
2. Resolve inherited policies from general to specific.
3. Apply the most specific applicable rule; a specific prohibition or approval gate overrides a general mode allowance.
4. Enforce the strictest inherited ceiling. A delegate cannot grant authority it did not receive.
5. Produce one of: advisory-only, approval-required, authorized, or prohibited/escalate.
6. Record the policy version, evidence, decision, actor, and resulting action in the audit trail.

Ambiguity does not widen authority. If applicable rules cannot be resolved safely, execution pauses and escalates.

Resource sensitivity is an Authority/Governance input, not scheduling metadata alone. A compatible claim may still require a narrower actor, provider, environment, action, or explicit approval. Runtime claim expansion requires Orchestrator approval and a fresh policy evaluation; an executor cannot use discovery to expand its own authority or Resource scope.

## Revocation and kill switch

The Owner may narrow or revoke authority at any time. Revocation prevents issuance of new Work Orders and invalidates unused delegated authority. Active Attempts must follow the safest permitted cancellation or containment behavior for their action type. If immediate cancellation would cause greater harm, the Orchestrator records the condition and escalates while performing only the minimum authorized containment.

## Inheritance and policy ceiling

Authority may be delegated from Owner to DPT, from DPT to an Orchestrator, and from an Orchestrator to an executor through a Work Order. Each step must narrow or preserve scope; it cannot expand it. The effective permission is the intersection of all applicable grants and restrictions.

## Auditability

Policy definitions, changes, approvals, evaluations, delegations, revocations, and kill-switch events are durable governance records. Auditability is required even when an action is fully autonomous within policy.
