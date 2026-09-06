# DPT-DECISION-008-CANONICALIZATION — Decision #8 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #8 (Section 8 — Resource lock / lease model) is canonically **ACCEPTED**
and recorded as **ADR-034**. Canonical: **leases with fencing tokens** (not bare
locks); **lease ≠ authority source**; acquire-in-canonical-order deadlock
prevention; idempotent release; Orchestrator preflight cycle check.

## Lease State Machine (Canonical)

`LEASE_REQUESTED → GRANTED → ACTIVE → (SUSPECTED → EXPIRED | RELEASED | REVOKED)`

## Core Principle

> **A lock/lease is never an authority source. Authority is established *before* lease acquisition.**

A lease is a *projection* of LAYER 4 (RUNTIME_EFFECTIVE_AUTHORITY per ADR-033).
Revocation of LAYER 2 or LAYER 3 invalidates all held leases. **Bare locks are NOT
a DPT primitive.**

## Falsifications Survived (7/7)

Lease ≠ authority / fencing prevents zombie writes / idempotent release /
canonical order prevents deadlock / concurrent safety / stale detection via
fencing / adapter does not invent authority.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-034 (now 1175 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 8 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-008 recorded
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of producer)
**Date:** 2026-09-05

| Claim | Status |
|-------|--------|
| ADR-034 appended | ✓ VERIFIED (1175 lines) |
| Lease with fencing token model | ✓ VERIFIED |
| Lease ≠ authority source | ✓ VERIFIED |
| Acquire-in-canonical-order | ✓ VERIFIED |
| Idempotent release | ✓ VERIFIED |
| Preflight cycle check | ✓ VERIFIED |
| No producer self-review | ✓ VERIFIED |
| No ACTION_REQUIRED findings | ✓ VERIFIED |

**Disposition:** `PENDING_REVIEW → REVIEWED → NO_FURTHER_ATTENTION` → **RETIRE**

### Next Admissible Decision

**Selected: Decision #9 — Verifier independence**
- Section 9: When executor may self-verify vs when independent verification required
- Cross-cuts `INDEPENDENCE_CONTRACT` from ADR-029/Decision #3
- Conflict resolution for verification evidence
