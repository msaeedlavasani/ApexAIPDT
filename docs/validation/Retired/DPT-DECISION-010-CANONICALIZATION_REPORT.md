# DPT-DECISION-010-CANONICALIZATION — Decision #10 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #10 (Section 10 — Retry, cancellation, revocation semantics) is canonically **ACCEPTED** and recorded as **ADR-036**. Three semantically distinct operations canonical with strict precedence: **REVOCATION > CANCELLATION > RETRY**.

## Canonical Model

| Operation | Trigger | Authority | Precedence |
|-----------|---------|-----------|------------|
| `RETRY` | Transient failure | Producer | Lowest |
| `CANCELLATION` | Owner/Orchestrator | Owner/Orchestrator | Medium |
| `REVOCATION` | Authority invalidation | DPT (owner co-signature) | Highest |

> **Revocation invalidates authority before further execution.** Leases become `LEASE_REVOKED` (per ADR-034). Closure denied if revocation precedes closure event.

## Falsifications Survived (7/7)

Retry=revocation / cancellation sufficient / revoc queued / retry idempotent-by-default / revocation gradual / cancellation overrides revocation / parallel attempts safe.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-036 (now 1376 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 10 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-010 recorded
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of producer)
**Date:** 2026-09-05

| Claim | Status |
|-------|--------|
| ADR-036 appended | ✓ VERIFIED (1376 lines) |
| Three distinct operations | ✓ VERIFIED |
| Precedence rule | ✓ VERIFIED |
| Revocation invalidates authority | ✓ VERIFIED |
| Lease revocation integration | ✓ VERIFIED |
| Post-closure revocation flow | ✓ VERIFIED |
| No producer self-review | ✓ VERIFIED |
| No ACTION_REQUIRED findings | ✓ VERIFIED |

**Disposition:** `PENDING_REVIEW → REVIEWED → NO_FURTHER_ATTENTION` → **RETIRE**

### Next Admissible Decision

**Selected: Decision #11 — Task graph mutation rules**
- Section 11: Who may add/remove/split/merge/reorder tasks; cycle detection; graph versioning; invalidation of downstream readiness/verification
- High architectural leverage
