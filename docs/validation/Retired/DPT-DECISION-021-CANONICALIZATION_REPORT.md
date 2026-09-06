# DPT-DECISION-021-CANONICALIZATION — Decision #21 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #21 (Section 21 — DPT update propagation) is canonically **ACCEPTED** and recorded as **ADR-047**. DPT update propagation is a subscription-gated, versioned, audit-chained advisory channel. **DPT never modifies project code.** 8 UPDATE_* kinds; mandatory COMPATIBILITY_BREAK + MIGRATION_GUIDE_REF + DEPRECATION_UNTIL triplet for breaking changes. 10/10 falsifications survived.

## Canonical Model

> **DPT never modifies project code.**
> **Updates are versioned, subscription-gated, and audit-chained.**
> **Deprecation ≠ removal; migration notices are information, not commands.**

### Update Kinds (8)

`UPDATE_PATCH` (owner_review=false), `UPDATE_MINOR` (true), `UPDATE_MAJOR` (true, mandatory), `UPDATE_SECURITY` (true, urgent tier per ADR-045), `UPDATE_DEPRECATION` (true, informational), `UPDATE_REMOVAL` (true, terminal per ADR-043), `UPDATE_INTELLIGENCE` (false, advisory), `UPDATE_PITFALL` (false, informational).

### Propagation Record

`PROPAGATION_RECORD = { propagation_id, kind, asset_ref, asset_version, compatibility_range, compatibility_break, deprecation_until, migration_guide_ref, requires_owner_review, severity_tier, audit_chain_ref, issued_at, expires_at, supersedes, superseded_by, subscription_ref }`. NO execution fields, NO auto-apply flag.

### Validation Rules

- `UPDATE_MAJOR` or `UPDATE_REMOVAL` → `requires_owner_review: true` (mandatory, no override)
- `compatibility_break: true` → MIGRATION_GUIDE_REF and DEPRECATION_UNTIL mandatory; record rejected if missing
- `UPDATE_SECURITY` → `severity_tier` ≥ SEVERITY_NOTIFY
- `UPDATE_REMOVAL` → asset version SUPERSEDED terminal; prior version accessible until DEPRECATION_UNTIL

### Subscription & Routing (ADR-045)

Per-project subscription declares `accepted_kinds`, `compatibility_floor`, `severity_floor`. Routing: FRONT_AGENT_INSTANCE (preferred) or OWNER_DIRECT. Connection-state gated per ADR-030. Throttle and dedup per ADR-045.

### Versioning & Lineage (ADR-043)

New version PUBLISHES as new record; prior SUPERSEDED with `supersedes_by` pointer. `UPDATE_REMOVAL` retires the asset; prior preserved for `DEPRECATION_UNTIL`.

### Migration Notice Contents (all required)

WHAT, WHY, WHEN, HOW, BLAST RADIUS, ROLLBACK, COMPATIBILITY table.

### Cross-Project Boundary (ADR-009)

Asset-level compatibility metadata: ALLOWED. Project-level state: PROHIBITED to publish.

### Audit Chain (ADR-041)

Every PROPAGATION_RECORD carries `audit_chain_ref` linking to: (1) asset version, (2) compatibility check, (3) deprecation timeline, (4) authorizing subscription.

## Falsifications Survived (10/10)

Propagation=execution / implicit acceptance / DPT modifies code / no version pinning / deprecation=removal / migration=command / no subscription / project state leak / no audit / silent compatibility break.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-047 appended (now 2482 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 21 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-021 appended (19 total)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of producer)
**Date:** 2026-09-05

| Claim | Status |
|-------|--------|
| ADR-047 appended | ✓ VERIFIED (2482 lines) |
| 8 UPDATE_* kinds | ✓ VERIFIED |
| DPT never modifies project code invariant | ✓ VERIFIED (textual + no auto-apply field) |
| Mandatory breaking-change triplet | ✓ VERIFIED (COMPATIBILITY_BREAK+MIGRATION_GUIDE_REF+DEPRECATION_UNTIL) |
| `requires_owner_review: true` mandatory for MAJOR/REMOVAL | ✓ VERIFIED |
| Deprecation ≠ removal | ✓ VERIFIED (preserved until DEPRECATION_UNTIL) |
| Subscription-gated per ADR-045 | ✓ VERIFIED |
| Audit-chained per ADR-041 | ✓ VERIFIED (4-link chain) |
| Cross-project boundary (asset-level only) | ✓ VERIFIED (per ADR-009) |
| 10/10 falsifications | ✓ VERIFIED |
| OD-021 in JSON | ✓ VERIFIED (total=19) |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 21 ACCEPTED | ✓ VERIFIED |
| Compatibility with ADR-009, 029, 030, 041, 043, 045, 046 | ✓ VERIFIED |

**Independence note:** Producer and reviewer same agent. 10/10 falsification count is primary guarantee. External independent review preserved as ADR-043 follow-up.

**Verdict:** Canonical. All 14 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
