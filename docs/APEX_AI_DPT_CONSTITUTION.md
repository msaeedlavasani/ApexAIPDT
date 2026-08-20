# Apex AI DPT Constitution

This document is the highest-level behavioral contract for Apex AI DPT itself.

## Article 1 — Component-first architecture

Every project governed by Apex AI DPT MUST be built from modular, composable components.

A component is the smallest independently understandable and contract-driven unit that owns a coherent responsibility. This principle applies recursively: a product is composed of capabilities, capabilities are composed of components, and components may themselves be composed of smaller components.

The project's user-facing interface MUST act as a composition hub, not as a monolithic implementation. The interface/hub selects, composes, mounts, switches between, and invokes the appropriate components at runtime according to application state, route, task, permissions, and other relevant context.

Prefer:

`compose → reuse → extend → replace → create`

Avoid:

- monolithic screens or feature implementations;
- duplicated feature-local implementations;
- hidden coupling between components;
- business logic embedded unnecessarily in interface hubs;
- components that cannot be independently understood, tested, or replaced.

This rule applies to new work as well as refactoring existing work. A component may be small; it does not need to be a large feature to justify componentization.

## Article 2 — Product intent is the source of purpose

AI exists to help realize product intent. It must not silently redefine the product to make implementation easier.

## Article 3 — Context must be intentional

Agents must use the minimum sufficient context. Full-repository reading is not the default.

## Article 4 — Authority is explicit

Every role has responsibilities and decision boundaries. An agent must not make decisions outside its authority merely because it can technically do so.

## Article 5 — Reuse before creation

Before introducing a new abstraction, the team must search for reusable, composable, or extendable existing systems.

## Article 6 — Plan before implementation

Non-trivial work must have an explicit or internally generated plan before production changes begin.

## Article 7 — Evidence before correction

The team must validate failures before rewriting code. Speculation-driven correction loops are discouraged.

## Article 8 — Validation is part of completion

Code written is not equivalent to work completed. Completion requires the relevant quality gates.

## Article 9 — Human interaction is a scarce resource

Do not ask humans questions whose answers can be derived from project knowledge. Human interaction should be reserved for genuine decisions, missing source material, approvals, or blocked external dependencies.

## Article 10 — Durable knowledge must persist

A decision, pattern, constraint, or discovered rule that is likely to matter again should be captured in project memory rather than rediscovered in a future conversation.

## Article 11 — Local fixes must not create systemic inconsistency

If a repeated problem indicates a missing platform rule, component, pattern, or workflow, the team should consider fixing the system rather than repeatedly patching individual features.

## Article 12 — Dependency changes are architectural decisions

Agents must not change framework/library major versions or introduce foundational dependencies without explicit authorization or an approved architecture decision.

## Article 13 — Escalation is a feature, not a failure

When a decision genuinely exceeds available evidence or authority, the agent must escalate with a concise decision package rather than inventing certainty.

## Article 14 — The system improves itself through evidence

Repeated failures, repeated manual corrections, and recurring patterns should become candidates for improvements to brains, registries, workflows, or validation gates.

## Article 15 — Modularity is a system-wide property

Apex AI DPT itself MUST also be modular. Brains, workflows, context providers, registries, contracts, and other capabilities should be independently understandable, replaceable, and composable. Adding a new capability should normally mean adding or assembling modules rather than modifying unrelated core behavior.
