# DPT-DECISION-003-CANONICALIZATION — Decision #3 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**Task Type:** DECISION CANONICALIZATION
**Classification:** NG-02 (writing canonical artifacts) + NG-10 (independent review of decision)
**REPORT_STATUS:** NO_FURTHER_ATTENTION

---

## Executive Summary

Decision #3 (OD-003 — Agent vs Skill boundary) is canonically **ACCEPTED** and
recorded as **ADR-029** in `docs/DPT_ARCHITECTURE_DECISIONS.md`. The ontology
distinguishes design-time concepts (BRAIN, ROLE, SKILL, WORKFLOW, SERVICE,
POLICY, AGENT_DEFINITION, INDEPENDENCE_CONTRACT) from runtime entities
(AGENT_INSTANCE, WORKFLOW_INSTANCE, SERVICE_INSTANCE, WORK_ORDER, ATTEMPT,
ROLE_FULFILLMENT), and binds them with nine explicit principles.

The canonicalization preserves four implementation questions as follow-up
work, not blockers: Independence Contract runtime enforcement, role-fulfillment
routing, model/capability routing, and the orchestrator cognitive-spawn
interface.

---

## Final Corrections Applied

| # | Correction | Applied |
|---|------------|---------|
| 1 | Determinism routing rule (if policy determines unique action → SERVICE; if judgment → ROLE) | ✓ |
| 2 | Role fulfilment may change without entity-class mutation (AGENT_INSTANCE → SERVICE_INSTANCE is a change of ROLE_FULFILLMENT) | ✓ |
| 3 | Independence strength derived from existing canonical task/risk/governance classification — no new C0–C4 taxonomy | ✓ |
| 4 | Independent verification split into REASONING_ISOLATION (mandatory) + EVIDENCE_INDEPENDENCE (mandatory), with optional dimensions per workflow | ✓ |

## Final Binding Principles

1. ROLE = responsibility boundary
2. AGENT_DEFINITION = reusable/versioned execution composition contract, not a hard-bound model/provider
3. AGENT_INSTANCE = runtime instantiation of an AGENT_DEFINITION
4. Model/provider selection at runtime via capability routing, unless governance/compliance requires a pin
5. A ROLE may be fulfilled by AGENT_INSTANCE / SERVICE_INSTANCE / HUMAN / WORKFLOW; not every ROLE requires an AGENT_DEFINITION
6. Determinism routing: unique-action policy → SERVICE; judgment → cognitive ROLE
7. Role fulfilment may change without entity-class mutation
8. ORCHESTRATION IS A SERVICE. COORDINATION REASONING IS A ROLE.
9. INDEPENDENT VERIFICATION is a workflow/governance property enforced through INDEPENDENCE_CONTRACT
10. DO NOT CREATE AN AGENT WHEN A SERVICE, SKILL, ROLE, OR WORKFLOW IS SUFFICIENT

## Stress-Test History (Summary)

| Delta | Outcome |
|-------|---------|
| Boundary stress test | 5/7 scoring model found non-deterministic; not a valid classifier |
| Design-time vs runtime split | AGENT clarified as design-time AGENT_DEFINITION + runtime AGENT_INSTANCE |
| Execution model refinement | Orchestrator decomposed to SERVICE + spawned COORDINATION_REASONING_ROLE |
| Final correction | Determinism routing, fulfilment pluralism, REASONING_ISOLATION + EVIDENCE_INDEPENDENCE |

## Falsifications Survived

- Pinned agent for legal review → resolved as runtime pin, not definition pin
- "Replanning is deterministic if policy is complete" → fails; policy is never complete
- "A Role *is* an Agent Definition" → Role is contract; Definition is one shape
- "Definition inequality = independence" → falsified; Independence Contract required

## Files Changed

| File | Action |
|------|--------|
| `docs/DPT_ARCHITECTURE_DECISIONS.md` | APPENDED ADR-029 |
| `docs/DPT_OPEN_DECISIONS.md` | OD-003 → ACCEPTED |
| `docs/v1-decision-resolutions.json` | OD-003 resolution recorded |
| `docs/TASKS.md` | DELTA record for DPT-DECISION-003-CANONICALIZATION |
| `docs/validation/DPT-DECISION-003-CANONICALIZATION_REPORT.md` | CREATED (this report) |

## Preserved as Follow-up (not blockers)

- Independence Contract runtime enforcement
- Role-fulfillment routing implementation
- Model/capability routing implementation
- Orchestrator cognitive-spawn interface specification

## Unchanged Artifacts (Per Instructions)

| Artifact | Reason |
|----------|--------|
| Decision #3 (OD-003) substantive scope | Final corrections applied only to principles, not scope |
| `ROADMAP.md` | Not modified |
| Pre-governance reports | Remain in Retired/ as before |

---

**HUMAN_GATE_VALID = NO** (decision canonicalization is deterministic per governance precedence)  
**Classification:** NG-02 + NG-10  
**OWNER_PERMISSION_POPUPS = 0**

---

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of decision producer)
**Review Date:** 2026-09-05
**Basis:** Report Lineage Governance — downstream evidence resolves upstream reports

### Findings Verification

| Claim | Evidence | Status |
|-------|----------|--------|
| ADR-029 appended | `docs/DPT_ARCHITECTURE_DECISIONS.md` now 445 lines (was 330); ADR-029 present | ✓ VERIFIED |
| OD-003 marked ACCEPTED | Open Decisions table updated; section 3 marked ACCEPTED with ADR-029 reference | ✓ VERIFIED |
| Resolution recorded | `v1-decision-resolutions.json` updated with OD-003 entry | ✓ VERIFIED |
| TASKS.md delta persisted | `[DELTA] DPT-DECISION-003-CANONICALIZATION` block appended | ✓ VERIFIED |
| Report file created | `docs/validation/DPT-DECISION-003-CANONICALIZATION_REPORT.md` present | ✓ VERIFIED |
| Final corrections applied | All 4 corrections present in ADR-029 binding principles | ✓ VERIFIED |
| No C0–C4 taxonomy | Independence derived from existing canonical task/risk/governance class | ✓ VERIFIED |
| No model/provider hard-bind in AGENT_DEFINITION | Explicitly forbidden unless governance/compliance requires pin | ✓ VERIFIED |
| No producer self-review of decision | This independent review executed by separate Delta agent | ✓ VERIFIED |
| Roadmap unmodified | `ROADMAP.md` not touched | ✓ VERIFIED |
| Decision #3 not modified in scope | Final corrections only to principles | ✓ VERIFIED |
| No ACTION_REQUIRED findings | All open questions preserved as follow-up, not blockers | ✓ VERIFIED |

### Disposition Decision

```
REPORT_STATUS: PENDING_REVIEW → REVIEWED → NO_FURTHER_ATTENTION
ACTION: RETIRE to docs/validation/Retired/
Rationale: All claims independently verified; no unresolved attention.
```

**HUMAN_GATE_VALID = NO** — Deterministic per governance precedence.  
**OWNER_PERMISSION_POPUPS = 0**
