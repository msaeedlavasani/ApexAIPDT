# DPT-DECISION-023-CANONICALIZATION — Decision #23 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #23 (Section 23 — Pool architecture) is canonically **ACCEPTED** and recorded as **ADR-049**. Pool is a typed, audit-chained, capability-routed, versioned registry of design-time definitions with 3 validation tiers, 5-state lifecycle, and 6 mandatory compatibility dimensions. Pool ≠ Project Intelligence. 10/10 falsifications survived.

## Canonical Model

> **Pool stores DESIGN-TIME definitions, not runtime instances (ADR-029).**
> **Pool ≠ Project Intelligence: public-by-design vs project-private (ADR-009).**
> **Validation tier is mandatory metadata on every entry.**

### Pool Types (8)

`POOL_COMPONENT`, `POOL_MODULE`, `POOL_SKILL`, `POOL_AGENT_DEFINITION`, `POOL_PITFALL`, `POOL_PATTERN`, `POOL_DECISION_EVIDENCE`, `POOL_DECISION`.

### Lifecycle (5 states)

`DRAFT → UNDER_REVIEW → PUBLISHED → DEPRECATED → REMOVED`. Re-publishing DEPRECATED creates new version; never resurrects.

### Validation Tiers (3)

`VALIDATED` (continuous), `CERTIFIED` (bounded versioned per ADR-042), `REJECTED` (not queryable). Mandatory metadata.

### Compatibility Dimensions (6, all mandatory)

`framework`, `runtime`, `language`, `os`, `sensitivity_class`, `governance_class`. Empty → not published.

### Discovery (per ADR-039)

Exact → Capability → Semantic → Fallback. Returns `RELEVANCE_BREAKDOWN`. Advisory; owner selects.

### Pool vs Project Intelligence

| Aspect | Pool | PI |
|--------|------|----|
| Visibility | Public | Private |
| Contents | Definitions | Findings |
| Owner | DPT | Project |
| Audit | Public | Internal |

### Privacy Boundary (ADR-009)

Pool entries anonymized; no project identifiers. Border case: `ASSET_CAN_BE_CONTRIBUTED` with explicit owner approval. Cross-project reuse only via `CONTRIBUTION_CANDIDATE` (ADR-042).

## Falsifications Survived (10/10)

Flat bag / unidirectional lifecycle / no validation tier / semver-only / binary compat / unranked discovery / no audit / project-visible default / project-specific in pool / missing dimensions.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-049 appended (now 2765 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 23 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-023 appended (21 total)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

| Claim | Status |
|-------|--------|
| ADR-049 appended | ✓ VERIFIED (2765 lines) |
| 8 POOL_* types | ✓ VERIFIED |
| 5-state lifecycle | ✓ VERIFIED |
| 3 validation tiers per ADR-042 | ✓ VERIFIED |
| 6 mandatory compatibility dimensions | ✓ VERIFIED |
| Capability-routed discovery per ADR-039 | ✓ VERIFIED |
| Audit-chained mutations per ADR-041 | ✓ VERIFIED |
| Pool ≠ Project Intelligence per ADR-009 | ✓ VERIFIED |
| Re-publish from DEPRECATED creates new version per ADR-043 | ✓ VERIFIED |
| 10/10 falsifications | ✓ VERIFIED |
| OD-023 in JSON | ✓ VERIFIED (total=21) |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 23 ACCEPTED | ✓ VERIFIED |
| Compatibility with ADR-029, 039, 041, 042, 043, 009, 047, 048 | ✓ VERIFIED |

**Verdict:** Canonical. All 14 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
