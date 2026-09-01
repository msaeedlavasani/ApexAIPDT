# Apex AI DPT Terminology

## Brain
A bounded area of product or engineering responsibility with knowledge, rules, authority, inputs, outputs, dependencies, and validation criteria.

## Role
An operational identity assigned to one or more AI agents. A role uses one or more brains to perform work.

## Agent
An execution instance capable of reasoning and acting within an assigned role.

## Orchestrator
The coordinating role responsible for routing work, managing context, enforcing authority and workflow, resolving conflicts, and deciding when human escalation is required.

## Execution Orchestrator
Also named the **Apex Orchestrator**: the Execution Control Plane's runtime coordinating role that converts authorized Intent into Plans and Task DAGs, evaluates readiness and Authority Policy, issues bounded Work Orders, coordinates Resource Claims and Attempts, requires Verification, and decides whether to complete, retry, replan, cancel, or escalate. It is distinct from the Front Agent, Gateway Agent, AI Analyst, executors, and verifiers.

## Front Agent
The project-specific DPT-facing Agent instance through which a connected project communicates with DPT. It represents one project at the DPT boundary and maintains project-specific interaction context. It is not a project coding agent.

## Gateway Agent
The DPT-side network boundary that mediates communication between Project Front Agent instances and the DPT ecosystem. Direct external access to DPT internal services or Pools is not a supported path.

## Project Scout
The discovery role responsible for understanding an existing project's product/technical context, capabilities, architecture, components, dependencies, interfaces, constraints, and evidence. Scout reports facts and observations rather than making final adoption judgments.

## AI Analyst
The analytical role that consumes Project Intelligence, project intent, and DPT Pool intelligence to identify needs, compare solutions, and produce recommendations or a DPT Adoption Proposal. Analyst does not modify the project.

## DPT Adoption Proposal
An advisory output describing how a project could benefit from DPT assets/intelligence, what should remain unchanged, relevant risks/benefits, and what work would be required from the project team. It is not an instruction for DPT to modify the project.

## Project Intelligence
A structured, durable, evidence-backed representation of the minimum sufficient understanding DPT has about a project. It may include product intent, architecture, capabilities, components, dependencies, interfaces, constraints, risks, evidence, confidence, and metadata.

## Capability
A meaningful ability or responsibility of a product or DPT system. Capabilities can be represented and composed through Components, Modules, Skills, Agents, or other bounded assets.

## Authority
The set of decisions a role may make autonomously, the decisions it may recommend, and the decisions it must escalate.

## Authority Policy
The Owner-controlled, scoped, auditable, and revocable rules that determine whether an action is advisory-only, approval-gated, authorized, or prohibited. Specific applicable policy overrides a general Service/Authority Mode.

## Service / Authority Mode
One of the graduated delegation postures: Observe, Advise, Assisted Execution, Managed Execution, Autonomous Within Policy, or Delegated Autonomy. A mode is a default posture, not a blanket permission grant.

## Policy Ceiling
The maximum authority that may be inherited or delegated. Downstream grants may narrow but cannot expand the intersection of applicable upstream authority.

## Risk Envelope
The explicit risk bounds inside which autonomous action may occur, including applicable impact, cost, reversibility, environment, data, security, and operational constraints.

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

## Intent
The requested outcome that originates from the Owner or another authorized source. Intent is not yet a Plan or authorization for a particular action.

## Plan
A structured interpretation of Intent containing proposed Tasks, constraints, success criteria, risks, dependencies, gates, and execution strategy.

## Task
A logical, executor-independent unit of work in a Task Graph, with dependencies, acceptance criteria, required capabilities, risk, authority requirements, Resource Claims, and state.

## Task Graph
A directed acyclic graph of Tasks and prerequisite relationships used to compute readiness and coordinate work.

## Work Order
A bounded, authorized assignment of a Task to an executor with explicit scope, inputs, expected outputs, policy context, Resource Claims, and termination conditions.

## Attempt
One identified execution of a Work Order, including lifecycle, outputs, telemetry, and termination reason.

## Resource Claim
A Task's pre-execution declaration of bounded access to a Resource, including access mode, scope, rationale, authority context, lifecycle status, and any approved expansion lineage. Claims enable safe scheduling and parallelism; executors cannot silently widen them.

## Resource
A hierarchical physical, logical, or external control-plane object whose use matters to concurrency, authority, governance, or execution safety. A Resource may be a path, but logical Resources such as API contracts and services have identities independent of paths.

## Result
The executor-reported outcome of an Attempt. A Result is evidence for Verification and is not Completion.

## Verification
A first-class evaluation of Result and Artifacts against acceptance criteria, quality gates, and Authority Policy using recorded evidence and provenance.

## Completion
The state reached only after required Verification succeeds and an explicit Decision records that the Task or Plan satisfies its completion conditions.

## Escalation
A durable decision package for a matter beyond current evidence or authority, including context, evidence, options, risks, and the smallest required Owner action.

## Decision
A deliberate choice between meaningful alternatives, including rationale, authority, evidence, consequences, and status.

## Workflow
A repeatable sequence of states, responsibilities, gates, and outputs used to accomplish a class of work.

## Gate
A validation or approval condition that must be satisfied before a workflow can advance.

## Registry
A queryable inventory of reusable project resources, such as components, assets, patterns, APIs, or games.

## Pool
A DPT-managed collection of reusable assets or intelligence, such as Components, Modules, Skills, Agents, Pitfalls, Decisions, Patterns, or Templates.

## Analogue
An existing implementation that is structurally similar to a requested feature and can provide a reliable pattern for reuse or extension.

## Source of Truth
The highest-authority source for a particular type of information. Apex AI DPT prefers verified repository state and explicit project contracts over assumptions.

## Evidence
A concrete source or observation supporting a Project Intelligence finding, recommendation input, or durable knowledge record.

## Confidence
A representation of how strongly available evidence supports a finding. Confidence must not be treated as a substitute for evidence.

## Human Decision Boundary
A point where AI cannot responsibly infer the answer from available evidence and authority and must request a human decision.
