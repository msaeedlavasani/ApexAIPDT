# Apex AI DPT — Agent Architecture

**Status:** Architecture direction / V0 concept

## Purpose

Define the responsibilities and boundaries of the principal DPT agents discussed so far. Agent boundaries should remain modular and should not be interpreted as a frozen implementation topology.

## 1. Project-side Front Agent

Every connected project has a project-specific DPT Front Agent instance derived from the DPT Front Agent reference/template.

Primary responsibilities:

- represent the project in DPT interactions;
- maintain project-specific DPT context;
- receive project requests/events;
- receive DPT recommendations, updates, and relevant intelligence;
- communicate through the approved DPT Gateway boundary;
- enforce project-side interaction policy where applicable.

It is the official communication face of DPT for that project.

It is not a project coding agent, does not implement DPT recommendations, and is not the Execution Orchestrator. Receiving a request does not give it task-graph, scheduling, retry, or completion authority.

## 2. Gateway Agent

The Gateway Agent is the DPT-side boundary between Project Front Agent instances and the DPT ecosystem.

Primary responsibilities:

- receive information from authenticated/recognized Front Agent instances;
- route information into the appropriate DPT capability, Pool, or intelligence service;
- return approved results/events through the originating Front Agent;
- maintain the network boundary and protocol semantics.

Direct external access to DPT internal services and Pools is not a supported communication path.

The Gateway is not an Orchestrator. It enforces and mediates a trust/protocol boundary; it does not turn a routed request into an authorized Plan or Work Order.

## 3. Project Scout

Project Scout is the discovery role for existing projects.

Primary responsibilities:

- understand the project's product and technical context to the extent available;
- discover architecture and technology;
- map capabilities;
- identify components/modules and important boundaries;
- map dependencies and interfaces;
- identify constraints, risks, and relevant existing solutions;
- collect evidence and confidence for important findings;
- produce/update Project Intelligence.

Scout does not modify the project.

Scout should not make final DPT adoption judgments.

## 4. AI Analyst

The Analyst consumes Project Intelligence, project intent, and DPT Pool intelligence.

Primary responsibilities:

- identify project needs;
- compare existing project capabilities with DPT capabilities;
- perform compatibility/value analysis;
- identify opportunities to consume DPT assets;
- identify strong project-owned assets that may be contribution candidates;
- generate a DPT Adoption Proposal.

Analyst does not modify the project.

Analyst is distinct from the Execution Orchestrator. Its recommendation may be an input to planning, but it does not grant execution authority.

## 5. Greenfield Product / Architecture Agent

For a project starting from an idea, DPT may provide an advisory agent that processes product intent and proposes:

- product capability structure;
- architectural direction;
- component/module boundaries;
- relevant DPT assets;
- capability gaps;
- suggested project team/agent needs.

The resulting blueprint is advisory. The project development team implements it.

## 6. Failure / Pitfall Agent

Failure Intelligence should become active at the first meaningful failure rather than waiting for repeated failures.

It should:

1. search existing Pitfalls;
2. consult authoritative documentation;
3. diagnose before proposing speculative correction;
4. validate the resolution;
5. produce durable failure knowledge;
6. submit validated knowledge to the shared Pitfall Pool according to policy.

## 7. Capability Assembly

DPT must be able to identify capability gaps and assemble appropriate skills and agents before substantive work and during a project.

A capability gap should trigger:

```text
Search existing capability
        ↓
Reuse / compose / extend
        ↓
If still missing:
Create or acquire capability
```

The exact boundary between a Skill, Agent, Workflow, and Brain remains an architectural decision to be finalized.

## 8. Agent boundaries

DPT agents should not accumulate unrelated responsibilities merely because they can access the same context.

In particular:

- Scout discovers;
- Analyst interprets and recommends;
- Front Agent represents a project;
- Gateway Agent mediates network access;
- Greenfield Product/Architecture Agent advises on initial structure;
- Pitfall Agent handles failure intelligence.
- Execution Orchestrator coordinates only explicitly authorized execution.

These boundaries are intended to reduce context overload, token waste, accidental authority, and repeated work.

## 9. Execution Orchestrator

The Execution Orchestrator belongs to the Execution Control Plane. It is activated only when Authority Policy permits execution.

Primary responsibilities:

- turn authorized Intent into a Plan and Task DAG;
- compute deterministic Task readiness where practical;
- evaluate policy and approval gates before Work Orders and material actions;
- select capable executors and issue bounded Work Orders;
- coordinate Resource Claims and safe parallel execution;
- track Attempts, Artifacts, Results, Verification, budget, and risk;
- decide to complete, retry, replan, cancel, or escalate within authority;
- react safely to policy changes, revocation, or the kill switch;
- maintain an auditable execution history.

The Orchestrator does not replace the Owner, Front Agent, Gateway, Analyst, verifier, or executor. It coordinates those contracts while remaining below the inherited policy ceiling.
