# Apex AI DPT Terminology

## Brain
A bounded area of product or engineering responsibility with knowledge, rules, authority, inputs, outputs, dependencies, and validation criteria.

## Role
An operational identity assigned to one or more AI agents. A role uses one or more brains to perform work.

## Agent
An execution instance capable of reasoning and acting within an assigned role.

## Orchestrator
The coordinating role responsible for routing work, managing context, enforcing authority and workflow, resolving conflicts, and deciding when human escalation is required.

## Authority
The set of decisions a role may make autonomously, the decisions it may recommend, and the decisions it must escalate.

## Context
Information made available to an agent for a specific decision or task.

## Context Map
A routing structure that tells agents which sources of context are relevant and in what priority.

## Memory
Durable project knowledge that should survive an individual task or conversation.

## Component
An independently understandable, contract-driven unit with a coherent responsibility. Components may be composed recursively and should be reusable, testable, replaceable, and explicit about their dependencies.

## Component Hub
A composition/orchestration point that selects, mounts, switches between, and invokes components according to application state and context. A hub coordinates components but should not absorb their internal responsibilities.

## Component Contract
The explicit interface describing a component's inputs, outputs, dependencies, capabilities, lifecycle, and validation expectations.

## Artifact
A structured output of work, such as a product requirement, design specification, architecture decision, test plan, or asset request.

## Decision
A deliberate choice between meaningful alternatives, including rationale, authority, evidence, consequences, and status.

## Workflow
A repeatable sequence of states, responsibilities, gates, and outputs used to accomplish a class of work.

## Gate
A validation or approval condition that must be satisfied before a workflow can advance.

## Registry
A queryable inventory of reusable project resources, such as components, assets, patterns, APIs, or games.

## Analogue
An existing implementation that is structurally similar to a requested feature and can provide a reliable pattern for reuse or extension.

## Source of Truth
The highest-authority source for a particular type of information. Apex AI DPT prefers verified repository state and explicit project contracts over assumptions.

## Human Decision Boundary
A point where AI cannot responsibly infer the answer from available evidence and authority and must request a human decision.
