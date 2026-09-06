# DPT-DECISION-005-CANONICALIZATION — Decision #5 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**Task Type:** DECISION CANONICALIZATION
**Classification:** NG-02 (writing canonical artifacts) + NG-10 (independent review of decision)
**REPORT_STATUS:** NO_FURTHER_ATTENTION

---

## Executive Summary

Decision #5 (Section 5 — Gateway and Trust Boundary) is canonically **ACCEPTED**
and recorded as **ADR-031** in `docs/DPT_ARCHITECTURE_DECISIONS.md`. The Gateway
is now formally a **SERVICE** (not an AGENT) with explicit seven-concern boundary
contract, allowlist-based direct-access rejection, signed append-only audit, and
clear separation of boundary policy (Gateway) from execution policy (Orchestrator).

---

## Final Canonical Model

| Layer | Classification |
|-------|----------------|
| Design-time | SERVICE (deterministic trust boundary) |
| Runtime | GATEWAY_SERVICE_INSTANCE (long-lived, per DPT cluster) |

**"Gateway Agent" is DEPRECATED.** Canonical term is "Gateway SERVICE."

## Seven Sub-Concerns (Canonical)

1. **Identity** — issued by DPT Authority SERVICE at provisioning
2. **Authentication** — mutual mTLS, per-instance channel binding
3. **Authorization** — envelope validation, deterministic evaluation
4. **Isolation** — per-instance, per-project; cross-project leakage rejected
5. **Policy Enforcement** — boundary layer (Gateway) vs execution layer (Orchestrator) distinguished
6. **Audit** — signed by both sides, append-only, hash-linked, tamper-evident
7. **Direct-Access Rejection** — allowlist-based, defense in depth

## Contradictions Resolved

| # | Contradiction | Resolution |
|---|---------------|------------|
| 1 | "Gateway Agent" violates ADR-029 determinism routing | Renamed to Gateway SERVICE |
| 2 | Conflation of boundary vs execution policy | Two distinct enforcement layers, two distinct owners |
| 3 | Audit non-repudiation not specified | Both sides sign; hash-linked chain |
| 4 | Direct-access rejection not enumerated | Allowlist-based model |
| 5 | Identity issuance authority unspecified | DPT Authority SERVICE at provisioning |

## Falsifications Survived

| Claim | Attempt | Result |
|-------|---------|--------|
| Gateway is SERVICE | "Semantic intent interpretation" | ✓ Gateway validates envelope form only; semantics is Orchestrator's role |
| Single enforcement layer | "Non-deterministic envelope input" | ✓ Fails closed; schema form validated, semantics upstream |
| Single Gateway per cluster | "HA requires multiple" | ✓ Multi-instance allowed; deployment concern, not model concern |
| Audit must be signed | "What if signing fails?" | ✓ Deterministic signing; failure → HALT + escalate |

## Compatibility Verified

| Prior Decision | Compatibility |
|----------------|---------------|
| Decision #1 (Project Intelligence) | ✓ Project Intelligence never visible to Gateway |
| Decision #2 (Scout) | ✓ Scout outputs PI; Gateway sees only envelopes |
| Decision #3 (ADR-029) | ✓ Gateway is SERVICE; AGENT model respected |
| Decision #4 (ADR-030) | ✓ Front Agent lifecycle aligns; no overlap |
| ADR-007/008/021 | ✓ Reaffirmed; "Gateway Agent" deprecated |
| ADR-022 | ✓ Gateway is neither Analyst nor Orchestrator |
| ADR-024/026 | ✓ Gateway enforces access mode at boundary |
| ADR-027 | ✓ Gateway reads canonical state as projection only |

## Files Changed

| File | Action |
|------|--------|
| `docs/DPT_ARCHITECTURE_DECISIONS.md` | APPENDED ADR-031 (now 746 lines) |
| `docs/DPT_OPEN_DECISIONS.md` | Section 5 → ACCEPTED |
| `docs/v1-decision-resolutions.json` | OD-005 resolution recorded |
| `docs/TASKS.md` | DELTA record appended |
| `docs/validation/DPT-DECISION-005-CANONICALIZATION_REPORT.md` | CREATED (this report) |

## Preserved as Follow-up (not blockers)

- Specific cryptographic envelope format (JWS, COSE, etc.)
- mTLS version and cipher suite policy
- Audit retention policy details
- Rate-limit thresholds per mode
- Multi-Gateway cross-region consistency model
- Audit signing key rotation procedure

---

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of decision producer)
**Review Date:** 2026-09-05
**Basis:** Report Lineage Governance — downstream evidence resolves upstream reports

### Findings Verification

| Claim | Evidence | Status |
|-------|----------|--------|
| ADR-031 appended | `docs/DPT_ARCHITECTURE_DECISIONS.md` now 746 lines (was 584) | ✓ VERIFIED |
| Section 5 marked ACCEPTED | Open Decisions Section 5 updated with ✅ marker | ✓ VERIFIED |
| Resolution recorded | `v1-decision-resolutions.json` updated with OD-005 | ✓ VERIFIED |
| TASKS.md delta persisted | `[DELTA] DPT-DECISION-005-CANONICALIZATION` present | ✓ VERIFIED |
| "Gateway Agent" deprecated | ADR-031 explicitly states "deprecated" | ✓ VERIFIED |
| Seven sub-concerns specified | All 7 enumerated in ADR-031 | ✓ VERIFIED |
| Boundary vs execution policy split | Explicitly distinguished with table | ✓ VERIFIED |
| Allowlist-based direct-access rejection | Explicit in sub-concern 7 | ✓ VERIFIED |
| Audit signed by both sides | Explicit in sub-concern 6 | ✓ VERIFIED |
| No producer self-review | Independent review by current Delta agent | ✓ VERIFIED |
| No ACTION_REQUIRED findings | All open questions preserved as follow-up, not blockers | ✓ VERIFIED |

### Disposition Decision

```
REPORT_STATUS: PENDING_REVIEW → REVIEWED → NO_FURTHER_ATTENTION
ACTION: RETIRE to docs/validation/Retired/
Rationale: All claims independently verified; no unresolved attention; canonical precedence confirms no contradiction.
```

**HUMAN_GATE_VALID = NO** — Deterministic per governance precedence.  
**OWNER_PERMISSION_POPUPS = 0**

### Next Admissible Decision (for cycle continuity)

**Selected: Decision #6 — Exact mode and entity state names**
- Section 6: Finalize machine identifiers and lifecycle states for Plan, Task, Work Order, Attempt, Verification, Decision, Escalation
- Reopens: only the naming layer, not semantics
- Admissibility: HIGH (low risk, high clarity, required for all other runtime mechanisms)
- Dependencies: none (foundational naming layer)
