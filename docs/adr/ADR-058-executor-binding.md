# ADR-058 — Provider-Neutral Executor Binding

**Status:** ACCEPTED — 2026-09-08  
**Prerequisite:** Live execution of bounded authorized Work Orders  
**Initial consumer:** Catan authority migration  

## Decision

The canonical live executor binding is split into three distinct layers:

```text
Core Executor Contract
→ Initial Execution Transport: bounded child process
→ Provider/Substrate Adapter
```

The Core Executor Contract is provider-neutral. The child process is only the initial bounded transport and is not itself a provider or authority source. Provider/Substrate Adapters translate a provider-specific execution mechanism into the Core Executor Contract without changing authority semantics.

## Execution path

```text
Task / Stage
→ Task Passport
→ Work Order (durable)
→ Permission Envelope (derived)
→ Materialized child-process transport
→ Provider/Substrate Adapter
→ Attempt
→ repository effects
→ Result / Artifacts
→ independent readback and Verification
→ closure decision
```

A stage cannot close because an executor callback returned. Closure requires a durable Work Order, materialized Permission Envelope and preflight, terminal Attempt, observed repository effects, acceptance evidence, independent verification, and durable closure commit.

## Core Executor Contract

The provider-neutral contract exposes:

```text
prepare(workOrder, envelope) → runtime identity + preflight
execute(workOrder, materialized permissions) → Attempt Result
interrupt(attempt) → termination result
recover(attempt) → reconciled state
collectEffects(attempt) → immutable effect references
```

The contract does not select providers, grant authority, or widen scope.

## Work Order and authority

Existing Task, Passport, Work Order, Permission Envelope, Attempt, Result, Artifact, Verification, lease, fencing, retry, cancellation, revocation, and independent-verification contracts remain authoritative. No Attempt enters RUNNING before governance rehydration, envelope derivation, materialization, and provider preflight.

The Permission Envelope is the intersection of policy, delegated authority, Task Passport, resource claims, repository scope, and runtime constraints. The child transport receives only the materialized bounded permissions.

## Initial implementation ceiling

The first implementation is limited to:

- one local repository;
- one bounded worktree;
- one child-process transport;
- one Work Order at a time;
- one Permission Envelope;
- one Provider/Substrate Adapter boundary;
- one independent verifier;
- structured Attempt/Result/Effect records;
- timeout, interruption, cleanup, and process-boundary recovery.

It does not include remote workers, queues, databases, production deployment, packaging, signing, multi-host execution, arbitrary provider plugins, or unrestricted shell access.

## Evidence and closure

Effect evidence must include repository identity, base and ending revisions, worktree/branch, changed paths, command/test results, artifact references, executor identity, and timestamps. The verifier independently reads the repository and checks expected effects, denied paths, acceptance criteria, and test results.

```text
POOL_PUBLICATION ≠ EXECUTION_AUTHORITY
EXECUTOR_RESULT ≠ VERIFICATION
CALLBACK_RETURN ≠ STAGE_CLOSURE
```

## Recovery

The live Orchestrator owns child-process lifecycle, unknown-outcome reconciliation, retry/cancellation/revocation, and continuation. Durable Work Order and Attempt state is rehydrated after process exit. Effects are reconciled before retry or closure.

## Scope

This decision enables implementation of the missing executor binding. It does not modify Catan capability requirements, ISS-005 acceptance criteria, authority ceilings, public contracts, or provider-specific architecture. No Human Gate is required for the bounded implementation under existing authority.
