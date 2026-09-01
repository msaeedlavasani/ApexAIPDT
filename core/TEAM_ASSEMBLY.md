# Dynamic Team Assembly

Apex AI DPT does not assume every project or Task needs the same team. Dynamic Team Assembly supplies capable workers and verifiers to the Execution Orchestrator; it does not grant authority or execute work by itself.

## Assembly principles

1. Start with the smallest capable team.
2. Add a brain when the task crosses its expertise or authority boundary.
3. Add independent review when risk warrants it.
4. Avoid assigning every brain to every task.
5. Preserve one clear coordinating role.
6. Distinguish executor, verifier, integrator, and release responsibilities when risk or policy requires separation.
7. Bind every execution assignment to a Work Order whose scope, inputs, outputs, Resource Claims, policy context, and termination conditions fit the assignee's capability.

## Baseline brain catalog

- Product
- Design / UX
- Architecture
- Engineering
- QA
- Data / Analytics
- Security
- DevOps / Operations
- Domain specialist
- Monetization / Growth
- Asset / Content

## Example: generic SaaS

Product, Design, Architecture, Engineering, QA, Data, Security, DevOps.

## Example: online board-game platform

Product, Game Design, Design, Game Architecture, Frontend, Backend, Realtime, QA, Data, Monetization, Asset/Content.

## Example: AI application

Product, UX, Architecture, Frontend, Backend, AI/ML, Evaluation, QA, Data, Security, Operations.

## Team manifest

A project initialization should produce a team manifest containing:

- role ID;
- brain(s);
- responsibilities;
- authority;
- required inputs;
- expected outputs;
- escalation targets;
- validation responsibilities.
- eligible executor/verifier/integrator/release responsibilities;
- capability and environment constraints;
- delegation ceiling and required human gates.

## Runtime assembly flow

```text
Ready Task + effective Authority Policy
  → capability and risk routing
  → executor/verifier selection
  → bounded Work Order
  → Attempt and Result/Artifacts
  → required Verification
  → integration/release Work Orders and gates, when applicable
  → Orchestrator Decision
```

Workers may be project developers, AI development agents, tools, or services. They remain bounded by the Work Order and inherited policy ceiling; membership in an assembled team never permits silent scope expansion.
