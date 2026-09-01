# Workflow Engine

## Workflow model

A workflow is a versioned state machine with explicit entry conditions, responsible roles, artifacts, Authority Policy checks, gates, and exit conditions. The Workflow Engine is the state-transition mechanism used by the Apex Orchestrator; it does not grant authority on its own.

## Universal lifecycle

INTENT → DISCOVERY/ADVICE → POLICY → PLAN/TASK DAG → ASSEMBLE → WORK ORDER → ATTEMPT → RESULT/ARTIFACT → VERIFY → DECIDE → INTEGRATE/RELEASE (as authorized Tasks) → LEARN/REPORT

Not every task requires every state explicitly, but non-trivial work must not skip discovery, planning, or verification merely for speed.

## State ownership

The Apex Orchestrator owns execution routing and authorized state transitions. Advisory roles own evidence and recommendations but do not advance work into execution.

Specialist brains own domain work inside their authority.

Executors perform bounded Attempts. A designated verifier owns Verification where the risk or policy profile requires independence. Integration and release owners act only through explicit Work Orders and applicable human/protected-environment gates.

## Gate behavior

A failed gate produces evidence and routes work back to the smallest state capable of correcting the problem.

Do not restart an entire workflow when a local correction is sufficient.

A successful Result does not advance a Task to Completion. Required Verification must pass and the Orchestrator must record an explicit complete/retry/replan/cancel/escalate Decision. Revocation or a failed policy check prevents new Work Orders and moves active Attempts toward the safest permitted cancellation or containment state.

## Change classification

### Small local change
Targeted discovery → implement → targeted validation.

### Standard feature
Discovery → team assembly → plan → implementation → relevant validation → report.

### Cross-domain feature
Discovery → team assembly → domain decisions → architecture/design coordination → implementation → independent validation.

### High-risk change
Human approval and/or independent review before implementation, as required by project policy.

## Feedback loop

The first meaningful runtime failure creates failure evidence and activates Failure Intelligence. Its classification informs retry, replan, cancellation, containment, or escalation; it does not authorize speculative modification. Repeated failure patterns should become candidates for changes to project rules, registries, Pitfalls, or DPT workflows.
