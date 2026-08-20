# APDT Vision

## 1. Vision

APDT aims to make AI-assisted product development behave like an organized product team rather than a sequence of disconnected coding prompts.

A project should be able to start with an idea, initialize the appropriate AI team, establish the project's sources of truth and decision boundaries, and then move through discovery, design, architecture, implementation, validation, release, and learning with minimal human micromanagement.

## 2. Problem

Current AI coding workflows often optimize for immediate code generation. This creates recurring failure modes:

- agents inspect too much or too little context;
- implementation begins before the problem is understood;
- agents duplicate existing components and patterns;
- design rules are known but not operationalized;
- agents make decisions outside their authority;
- the same mistakes are corrected repeatedly;
- project knowledge remains trapped in conversations;
- expensive end-to-end validation is used for every change;
- humans become the integration layer between specialized AI tasks.

APDT addresses these problems as a system-design problem, not merely a prompting problem.

## 3. Target outcome

For a well-initialized project, a product owner should be able to express an outcome such as:

> Add Catan as a new game.

The AI team should then determine:

- what existing systems can be reused;
- which project rules apply;
- which new implementation is required;
- which assets can be generated or reused;
- which assets must be supplied by the human;
- what validation is appropriate;
- whether any product or architectural decision genuinely requires human input.

## 4. Core model

APDT is built from:

- **Brains** — areas of responsibility and expertise.
- **Roles** — operational identities assigned to agents.
- **Authority** — explicit boundaries on what a role may decide.
- **Context** — task-relevant project knowledge.
- **Memory** — durable project knowledge and decisions.
- **Workflows** — repeatable ways of moving work through the team.
- **Artifacts** — structured outputs such as requirements, design specs, decisions, and test plans.
- **Gates** — conditions that must be satisfied before work can advance.
- **Orchestrator** — coordinates the team and enforces the system.

## 5. Human/AI boundary

Humans own intent, strategy, priorities, brand direction, irreversible product decisions, and explicit approvals.

AI owns discovery, synthesis, implementation planning, implementation, verification, routine technical decisions, and documentation of durable knowledge within its authority.

When information is missing, the system should distinguish between:

1. discoverable information — find it;
2. inferable information — decide using established rules;
3. ambiguous information — present bounded options;
4. genuinely unavailable decisions — ask the human.

## 6. Autonomy model

APDT supports graduated autonomy:

- **Assisted** — plan and wait for approval.
- **Supervised autonomous** — plan internally, execute, validate, report.
- **Established-pattern autonomous** — execute established work without approval, escalating only when a boundary is crossed.
- **Restricted** — human approval required before execution.

Autonomy is granted by task and authority, not by agent confidence.

## 7. Context philosophy

Context is a managed resource.

The objective is not to expose the entire repository to every agent. The objective is to provide the minimum sufficient context required for a correct decision.

Context should be routed through task type, source-of-truth priority, closest analogue, dependency relationships, and authority boundaries.

## 8. V0 scope

V0 defines:

- APDT constitution;
- core terminology;
- brain contract;
- role and authority model;
- context routing model;
- memory model;
- decision model;
- orchestration model;
- project initialization workflow;
- feature development workflow;
- validation gates;
- project templates;
- reference project initialization.

V0 does not attempt to provide a vendor-specific runtime, agent API, dashboard, or autonomous deployment service.

## 9. Non-goals

APDT will not:

- remove humans from product ownership;
- force all projects into one technology stack;
- assume every task needs every brain;
- treat documentation as more authoritative than verified code/configuration;
- encourage agents to rewrite architecture simply because they can;
- maximize agent activity as a measure of success.

## 10. Success criteria

APDT should eventually demonstrate measurable improvement in:

- time from product request to validated feature;
- number of human implementation corrections;
- unnecessary repository context consumed;
- duplicate components/patterns introduced;
- regressions per feature;
- repeated questions asked by agents;
- percentage of tasks completed autonomously;
- percentage of human interactions that represent genuine product decisions.
