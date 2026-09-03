# Apex AI DPT — Human Gate Boundary

**Status:** Accepted architecture direction  
**Scope:** Policy semantics for distinguishing operations that require human judgment from ordinary authorized operations.  
**Depends on:** DPT_AUTHORITY_MODEL.md, APEX_AI_DPT_CONSTITUTION.md, DPT_EXECUTION_CONTROL_MODEL.md, APEX_AI_DPT_TERMINOLOGY.md

## Purpose

A Human Gate is a hard policy boundary: an operation that **must not proceed without explicit human judgment or approval**, regardless of the current Service/Authority Mode or agent confidence. This document defines which operations are Human Gates, which are not, and the semantics of the WAITING_FOR_HUMAN_GATE disposition.

## Definition

A **Human Gate** is a validation or approval condition that:

1. Cannot be satisfied by evidence, analysis, or agent reasoning alone.
2. Requires a genuine human decision, judgment, or explicit approval.
3. Is triggered by operation class, not by uncertainty or missing evidence.

A Human Gate is distinct from an **Escalation**. An Escalation arises from insufficient evidence or authority. A Human Gate arises from an operation class that policy places outside AI delegation regardless of evidence or authority level.

## Genuine Human Gates

The following operations MUST be gated behind explicit human judgment. No Service/Authority Mode, agent confidence, or policy delegation can substitute for human approval on these operations.

### HG-01: Merge to real main branch

Merging code to the protected main branch of a production or shared repository. This includes:

- Direct merge to `main`, `master`, `production`, or equivalent protected branch.
- Merge via pull request where the merge action itself is the gate (not the PR creation).
- Rebase or fast-forward that advances a protected branch.

Feature branches, personal branches, task branches, and temporary integration branches are not Human Gates.

### HG-02: Production deployment or release

Any action that causes code, configuration, or data to become live in a production environment. This includes:

- Deploying to production infrastructure.
- Publishing a release artifact (package, image, binary, npm, PyPI, etc.).
- Activating a feature flag that exposes new behavior to production users.
- Running production database migrations that alter schema or data.
- Flipping a production traffic route or DNS entry.

Staging, preview, development, and test environment deployments are not Human Gates (unless policy explicitly classifies them otherwise).

### HG-03: Destructive database or data mutation (policy-gated)

Database or data mutations that destroy, irreversibly alter, or corrupt authoritative data, where policy requires human approval. This includes:

- `DROP TABLE`, `DROP DATABASE`, `TRUNCATE`, or equivalent destructive DDL.
- Mass data deletion, overwriting, or corruption of production datasets.
- Migration that destroys rollback capability without a verified backup.
- Any data mutation that cannot be undone by the system itself.

Non-destructive migrations (additive column, index creation, reversible migration with verified rollback) are not Human Gates. A migration that is destructive but occurs in a disposable environment (e.g., local dev, ephemeral test) is not a Human Gate.

### HG-04: Secret or credential disclosure or elevated secret access

Actions that expose, transfer, rotate, or grant access to secrets, credentials, or high-privilege tokens. This includes:

- Disclosing a secret value to an output, log, artifact, or external system.
- Creating, rotating, or revoking production credentials, API keys, or certificates.
- Granting elevated secret access (e.g., decryption key access, vault policy change).
- Exfiltrating secrets from one environment to another.

Reading an already-authorized secret within a scoped, auditable workflow is not a Human Gate. Routine credential rotation within a fully automated, policy-approved pipeline with existing human authorization at the pipeline level is not a Human Gate per invocation.

### HG-05: Permission or ACL escalation

Actions that expand the permission set of a role, agent, service, or user beyond its current authorized scope. This includes:

- Granting new IAM roles, policies, or permissions.
- Expanding repository, namespace, or service access.
- Elevating an agent's Service/Authority Mode.
- Modifying ACLs, RBAC policies, or capability grants.

Revoking or narrowing permissions is not a Human Gate (it reduces risk). Granting permissions within an already-authorized policy ceiling is not a Human Gate.

### HG-06: Destructive or hard-to-reverse operations

Operations that destroy significant value, state, or capability and cannot be practically undone. This includes:

- Deleting a repository, project, or major component.
- Destroying infrastructure (Terraform destroy on production, cluster deletion).
- Overwriting a published artifact with incompatible content.
- Removing or disabling a critical service with no rollback path.

Operations that are destructive only in a disposable context (e.g., deleting a local `/tmp` workspace) are not Human Gates.

### HG-07: High-cost or hard-to-reverse architecture decisions (policy-gated)

Architecture decisions that commit the project to a direction that is expensive or impractical to reverse, where policy requires Owner approval. This includes:

- Adopting or replacing a foundational framework or language.
- Introducing a new cloud provider, runtime, or core infrastructure dependency.
- Committing to a data model or API contract that becomes a public surface.
- Selecting a storage engine, message broker, or protocol that constrains future options.

Low-cost or easily replaceable decisions (switching a utility library, choosing a test framework) are not Human Gates. The boundary is determined by policy-defined cost and reversibility thresholds.

## Operations That Are NOT Human Gates

The following operations are ordinary authorized operations. They proceed within the current Authority Policy without requiring explicit human judgment per invocation.

| Code | Operation | Why it is not a Human Gate |
|---|---|---|
| NG-01 | Reading authorized repositories | Non-invasive observation; no mutation or risk. |
| NG-02 | Writing authorized task artifacts | Scoped, expected output of authorized work. |
| NG-03 | Task-specific `/tmp` workspace operations | Disposable workspace; no persistent impact. |
| NG-04 | Authorized validation commands | Read-only or reversible verification. |
| NG-05 | Authorized tests | Expected quality gate; no production impact. |
| NG-06 | Authorized subagent spawning | Delegation within already-authorized scope. |
| NG-07 | Authorized parallel execution | Concurrency within claimed, compatible resources. |
| NG-08 | Read-only Git inspection | `git log`, `git diff`, `git show`, branch listing, etc. |
| NG-09 | Ordinary autonomous rework | Fixing, refactoring, or iterating within task scope. |
| NG-10 | Independent review | Code review, analysis, or recommendation without mutation. |
| NG-11 | Report persistence | Writing advisory reports, audit records, or task status. |

These operations may still be subject to Authority Policy, Resource Claims, and approval gates, but they do not require a Human Gate.

## Critical Distinction: PROVIDER_PERMISSION_REQUEST ≠ DPT_HUMAN_GATE

A provider asking for permission (e.g., an AI model requesting confirmation before executing a tool call) is a **runtime event**, not a **policy requirement**.

| Aspect | PROVIDER_PERMISSION_REQUEST | DPT_HUMAN_GATE |
|---|---|---|
| Origin | Runtime behavior of a specific provider or tool | Authority Policy defined by the Owner |
| Trigger | Agent uncertainty, safety filter, or tool policy | Operation class or action type |
| Scope | Per-invocation, provider-specific | Global, applies to all agents and modes |
| Substitutability | May be bypassed by a different provider or tool | Cannot be substituted by any agent or mode |
| Persistence | Transient; does not survive session | Durable; enforced across sessions and agents |

A DPT Human Gate is a policy requirement that persists regardless of provider behavior. A provider permission request is a runtime safety mechanism that may or may not coincide with a Human Gate.

## WAITING_FOR_HUMAN_GATE Disposition

### When to use WAITING_FOR_HUMAN_GATE

A Task or Attempt enters the `WAITING_FOR_HUMAN_GATE` disposition when:

1. The next action on the Task is a Human Gate (HG-01 through HG-07).
2. The Authority Policy requires explicit human approval for that action.
3. The gate cannot be satisfied by evidence, analysis, or agent confidence alone.
4. The Task cannot proceed, retry, or be completed until the human decision is recorded.

The disposition is a **control-plane state**, not a provider prompt. It persists until the human responds or the Task is cancelled.

### When NOT to use WAITING_FOR_HUMAN_GATE

The disposition must NOT be used for:

- **Provider permission requests.** If a provider asks for confirmation, that is a runtime event, not a policy gate. Use the provider's own confirmation mechanism.
- **Insufficient evidence.** If the agent lacks evidence to decide, that is an Escalation, not a Human Gate.
- **Exceeded authority.** If the action exceeds the agent's mode or policy ceiling, that is an Escalation or policy violation, not a Human Gate.
- **Routine decisions.** If the decision can be derived from project knowledge, evidence, or policy without human input, it is not a Human Gate.

### Semantics

```text
Task in WAITING_FOR_HUMAN_GATE
├── execution is suspended; no autonomous rework or retry
├── the gate condition and required human action are recorded
├── the Task remains in this state until:
│   ├── human approves → gate satisfied → Task resumes
│   ├── human rejects → Task is cancelled or replanned
│   ├── human does not respond within timeout → Task is escalated or cancelled per policy
│   └── Owner revokes authority → Task follows revocation/kill-switch protocol
├── the disposition is auditable with timestamp, gate ID, and human identity
└── the disposition is distinct from BLOCKED, ESCALATED, or PAUSED
```

## Gate Evaluation Sequence

When evaluating whether an action requires a Human Gate:

```text
1. Identify the action class (merge, deploy, mutate, disclose, escalate, destroy, commit).
2. Match against HG-01 through HG-07.
3. If matched → WAITING_FOR_HUMAN_GATE; do not proceed.
4. If not matched → continue to Authority Policy evaluation.
5. If Authority Policy requires approval → approval-required (may be agent-resolvable if within mode).
6. If Authority Policy authorizes → authorized; proceed.
```

A Human Gate match short-circuits the Authority Policy evaluation. The action is blocked regardless of mode, confidence, or delegation level.

## Relationship to Authority Modes

| Mode | Human Gate behavior |
|---|---|
| 0 Observe | Human Gates are irrelevant (no execution). |
| 1 Advise | Human Gates are irrelevant (no execution). |
| 2 Assisted Execution | Human Gates are approval-required; they coincide with the mode's gate structure. |
| 3 Managed Execution | Human Gates override the mode's independent execution bounds. |
| 4 Autonomous Within Policy | Human Gates remain hard boundaries within the policy envelope. |
| 5 Delegated Autonomy | Human Gates remain hard boundaries even within broad operational mandates. |

Mode 5 is not unlimited authority. A Human Gate applies at every mode.

## Audit Requirements

Every Human Gate event must produce a durable audit record including:

- Task and Attempt identity
- Gate class (HG-01 through HG-07)
- Action description and evidence
- Timestamp
- Human identity and decision (approve / reject / timeout)
- Resulting Task state

Human Gate audit records are governance artifacts and must not be purged by operational cleanup.
