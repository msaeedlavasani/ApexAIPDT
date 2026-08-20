# Workflow Engine

## Workflow model

A workflow is a state machine with explicit entry conditions, responsible roles, artifacts, gates, and exit conditions.

## Universal lifecycle

INTENT → DISCOVERY → CLASSIFICATION → CONTEXT → PLAN → EXECUTE → VERIFY → LEARN → REPORT

Not every task requires every state explicitly, but non-trivial work must not skip discovery, planning, or verification merely for speed.

## State ownership

The Orchestrator owns routing and state transitions.

Specialist brains own domain work inside their authority.

Independent QA owns verification where the risk profile requires independent verification.

## Gate behavior

A failed gate produces evidence and routes work back to the smallest state capable of correcting the problem.

Do not restart an entire workflow when a local correction is sufficient.

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

Validation failures should improve the current task first. Repeated failure patterns should become candidates for changes to project rules, registries, or APDT workflows.
