# Apex AI DPT — System Model

**Status:** Accepted architecture direction  
**Scope:** Platform responsibilities and separation of concerns; no runtime or protocol implementation is defined here.

## One platform, two planes

Apex AI DPT is one governed platform with two distinct planes:

```text
Owner Intent
    ↓
Front Agent → Gateway
    ↓
┌──────────────────────────────┐
│ Intelligence / Advisory Plane│
│ Scout → Intelligence → Analyst
└──────────────────────────────┘
    ↓ advisory artifacts
┌──────────────────────────────┐
│ Execution Control Plane      │
│ Policy → Plan/DAG → Execute  │
│        → Verify → Decide     │
└──────────────────────────────┘
    ↓
Auditable outcome / escalation
```

The planes may share authoritative intent, Project Intelligence, decisions, policies, and audit evidence. They do not share authority implicitly.

## Intelligence / Advisory Plane

This plane is non-invasive. It:

- observes and discovers evidence;
- maintains Project Intelligence;
- analyzes needs and compares alternatives;
- recommends and creates advisory artifacts;
- identifies risks, opportunities, and contribution candidates.

It does not write, refactor, migrate, deploy, or otherwise change a consuming project. A recommendation is not authorization.

## Execution Control Plane

This plane coordinates action only when an Owner-controlled Authority Policy explicitly permits it. It:

- translates authorized Intent into Plans and Task DAGs;
- evaluates authority at action boundaries;
- creates Work Orders and manages Attempts;
- models physical, logical, and external Resources and schedules parallel work only when declared Resource Claims are compatible;
- records Artifacts and Results;
- requires Verification before Completion;
- decides whether to complete, retry, replan, cancel, or escalate;
- stops or narrows work when authority is revoked.

The plane may delegate work to project developers, AI development agents, tools, or services. DPT remains accountable for control-plane policy evaluation and orchestration within the granted mandate; executors remain bounded by their Work Orders.

## Boundary roles

The **Front Agent** represents one project and maintains its DPT-facing interaction context. The **Gateway** enforces the DPT-side trust/protocol boundary and routes approved messages. Neither role becomes the Execution Orchestrator.

The **AI Analyst** belongs to the Advisory Plane. The **Execution Orchestrator** belongs to the Execution Control Plane. They may exchange structured artifacts, but recommendation generation and action coordination remain separate responsibilities.

## Governance invariant

No plane, role, mode, or technical capability grants authority by implication. An executable action requires a current, applicable, auditable policy decision. Specific restrictions override broad delegation, and inherited authority can only stay within its policy ceiling.
