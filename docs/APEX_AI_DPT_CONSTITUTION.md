# Apex AI DPT Constitution

This document is the highest-level behavioral and architectural contract for Apex AI DPT and for projects governed by it.

## Article 1 — Component-first architecture

Every DPT-managed project MUST be built from modular, composable components.

Every meaningful product capability, including the smallest functional or interface unit, should be represented as a component with a clear responsibility and contract. This principle applies recursively: a product is composed of capabilities, capabilities are composed of components, and components may themselves be composed of smaller components.

The project's user-facing interface MUST act as a composition hub, not as a monolithic implementation. The interface/hub selects, composes, mounts, switches between, and invokes the appropriate components at runtime according to application state, route, task, permissions, and other relevant context.

Prefer:

`compose → reuse → extend → replace → create`

Avoid:

- monolithic screens or feature implementations;
- duplicated feature-local implementations;
- hidden coupling between components;
- business logic embedded unnecessarily in interface hubs;
- components that cannot be independently understood, tested, or replaced.

This rule applies to new work as well as refactoring existing work. A component may be small; it does not need to be a large feature to justify componentization. This rule does not justify meaningless micro-components or abstraction for its own sake.

## Article 2 — DPT is LEGO-like and modular at every layer

Apex AI DPT MUST be modular. Brains, agents, skills, workflows, contexts, registries, contracts, pools, and reusable assets should be independently understandable, replaceable, and composable.

Adding a capability should normally mean adding, assembling, or replacing modules rather than modifying unrelated core behavior.

## Article 3 — Capability before execution

Before substantive implementation begins, DPT MUST analyze the capabilities required by the project and assemble the appropriate skills and agents.

The capability process is:

`reuse → extend → compose → create`

If a material capability gap is discovered during a project, DPT MUST be able to create, acquire, extend, or compose the required skill/agent before continuing the affected work.

## Article 4 — DPT is a two-way intelligence network

A DPT-managed project is both a consumer and a potential contributor.

DPT provides reusable assets, capabilities, knowledge, Pitfall intelligence, and validated updates to subscribed projects. Projects may contribute validated reusable assets, improvements, Pitfalls, decisions, patterns, evidence, skills, and agents back to DPT according to subscription and data-governance policy.

The authoritative shared relationship is mediated through the DPT Network API and Project Connector. Projects MUST NOT couple agents directly to Pool storage or infrastructure.

## Article 5 — Failure Intelligence starts at the first meaningful failure

A Failure Intelligence Agent SHOULD enter the flow when a meaningful failure is first detected, not only after a fix has failed repeatedly.

Before speculative correction, the agent should:

1. search the Pitfall Pool;
2. inspect authoritative documentation;
3. diagnose the failure and likely root cause;
4. propose an evidence-based resolution;
5. validate the result;
6. contribute reusable knowledge to the Pitfall Pool.

A repeated speculative correction loop is not an acceptable default debugging strategy when authoritative evidence can be obtained.

## Article 6 — Reuse before creation

Before introducing a new component, module, capability, pattern, or abstraction, the team MUST search the relevant DPT Pools and project registries.

If a suitable reusable asset exists, integrate or extend it rather than recreating it.

## Article 7 — Shared assets improve and propagate safely

Reusable DPT assets are living assets. Projects may receive validated updates from DPT.

Updates MUST be compatibility-aware and MUST NOT silently break consuming projects. Breaking changes require migration planning and appropriate validation.

## Article 8 — Project connection is established before substantive work

A DPT-managed project MUST establish its DPT runtime boundary and project identity before substantive product implementation begins.

Initialization MUST establish, at minimum, the project manifest, connector/API boundary, enabled Pool access, capability assessment, and relevant team assembly.

The exact transport/package implementation is an engineering decision and is not frozen by this Constitution.

## Article 9 — Product intent is the source of purpose

AI exists to help realize product intent. It must not silently redefine the product to make implementation easier.

## Article 10 — Context must be intentional

Agents must use the minimum sufficient context. Full-repository reading is not the default.

## Article 11 — Authority is explicit

Every role has responsibilities and decision boundaries. An agent must not make decisions outside its authority merely because it can technically do so.

## Article 12 — Plan before implementation

Non-trivial work must have an explicit or internally generated plan before production changes begin.

## Article 13 — Evidence before correction

The team must validate failures before rewriting code. Speculation-driven correction loops are discouraged.

## Article 14 — Validation is part of completion

Code written is not equivalent to work completed. Completion requires the relevant quality gates.

## Article 15 — Human interaction is a scarce resource

Do not ask humans questions whose answers can be derived from project knowledge. Human interaction should be reserved for genuine decisions, missing source material, approvals, or blocked external dependencies.

## Article 16 — Durable knowledge must persist

A decision, pattern, constraint, failure, or discovered rule that is likely to matter again should become reusable DPT or project knowledge rather than being rediscovered in a future conversation.

## Article 17 — Local fixes must not create systemic inconsistency

If a repeated problem indicates a missing platform rule, component, module, pattern, capability, or workflow, the team should consider fixing the shared system rather than repeatedly patching individual features.

## Article 18 — Dependency changes are architectural decisions

Agents must not change framework/library major versions or introduce foundational dependencies without explicit authorization or an approved architecture decision.

## Article 19 — Escalation is a feature, not a failure

When a decision genuinely exceeds available evidence or authority, the agent must escalate with a concise decision package rather than inventing certainty.

## Article 20 — The system improves itself through evidence

Repeated failures, repeated manual corrections, recurring patterns, successful reusable assets, and recurring capability gaps should become candidates for improvements to brains, registries, workflows, Pools, or validation gates.
