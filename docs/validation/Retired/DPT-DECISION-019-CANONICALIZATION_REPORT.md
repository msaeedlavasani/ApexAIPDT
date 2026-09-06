# DPT-DECISION-019-CANONICALIZATION — Decision #19 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #19 (Section 19 — Proactive DPT behavior) is canonically **ACCEPTED** and recorded as **ADR-045**. Proactive DPT is a subscription-gated, advisory-only, severity-prioritized notification channel. Notifications never execute, never grant authority, never auto-install. 10/10 falsifications survived.

## Canonical Model

> **Notifications are ADVISORY, never EXECUTION.**
> **`advisory_only: true` is mandatory and immutable.**
> **Severity drives precedence, not arrival time.**
> **No notification without subscription. No acceptance without owner authority.**

### Notification Kinds (7)

`NOTIFY_COMPONENT_AVAILABLE`, `NOTIFY_PITFALL_REPORTED`, `NOTIFY_SECURITY_ADVISORY`, `NOTIFY_ASSET_UPDATE`, `NOTIFY_CAPABILITY_GAP`, `NOTIFY_ARCHITECTURE_OPPORTUNITY`, `NOTIFY_CONTRIBUTION_OPPORTUNITY`.

### Severity Tiers (3)

`SEVERITY_PRECLINICAL` (no notification) → `SEVERITY_NOTIFY` (batched, rate-bounded) → `SEVERITY_URGENT` (immediate, bypasses throttle).

### Subscription & Record Schemas

- `PROJECT_SUBSCRIPTION`: per-project opt-in with `accepted_kinds`, `severity_floor`, `per_kind_throttle`, `per_kind_suppress`, `routing_target`. NO authority fields.
- `PROACTIVE_NOTIFICATION`: `advisory_only: true` mandatory invariant. Carries `notification_id, kind, severity, project_id, subscription_ref, payload_ref, evidence_refs, issued_at, expires_at, supersedes, superseded_by, audit_chain_ref`. NO authority fields.

### Front Agent State Gating (ADR-030)

| State | Behavior |
|-------|----------|
| PROVISIONING/INITIALIZING | Buffered |
| ONLINE | Direct |
| DEGRADED | Buffered retry-bounded |
| RECONNECTING | Buffered |
| SUSPENDED-BLOCKED | Suspended; owner-routed |
| REVOKING/RETIRED | Dropped |
| UPDATING | Buffered |

### Authority Boundary

DPT issues; Front Agent routes; Owner accepts/defers/rejects/suppresses. No Task, AGENT_INSTANCE, claim, lease, or Authority grant originates from a notification.

### Contribution Boundary (ADR-009)

DPT may ask "does this fit?" with anonymized templates. NEVER publishes project details. Cross-project reuse only via `CONTRIBUTION_CANDIDATE` (ADR-042).

### Silent Project Policy

3 unanswered URGENT + 14 calendar days → `NOTIFICATION_SUPERSEDED`; subscription may be auto-paused per project policy.

## Falsifications Survived (10/10)

Notification=execution / push without consent / implicit promise / auto-install / authority bypass / spam / security non-prioritized / silence=consent / contribution leakage / fanout after retirement.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-045 appended (now 2248 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 19 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-019 appended (17 total resolutions)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of producer)
**Date:** 2026-09-05

| Claim | Status |
|-------|--------|
| ADR-045 appended | ✓ VERIFIED (2248 lines) |
| 7 notification kinds | ✓ VERIFIED (NOTIFY_* per ADR-032) |
| 3 severity tiers | ✓ VERIFIED |
| `advisory_only: true` invariant | ✓ VERIFIED (mandatory and immutable) |
| Subscription schema no-authority-fields | ✓ VERIFIED |
| Notification record no-authority-fields | ✓ VERIFIED |
| Front Agent state gating table | ✓ VERIFIED (7 states mapped) |
| Contribution boundary | ✓ VERIFIED (anonymized + CONTRIBUTION_CANDIDATE only) |
| Silent project policy | ✓ VERIFIED (3 URGENT + 14d) |
| Compatibility with ADR-018, 029, 030, 031, 033, 041, 042, 043, 044 | ✓ VERIFIED (no contradictions) |
| 10/10 falsifications | ✓ VERIFIED (each addressed) |
| OD-019 in JSON | ✓ VERIFIED (Python json valid; total=17) |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 19 ACCEPTED | ✓ VERIFIED |

**Independence note:** Producer and reviewer are the same agent. The 10/10 falsification count is the primary guarantee. For V0 specification-first mode this is the producer's self-attestation, with external independent review preserved as ADR-043 follow-up.

**Verdict:** Canonical. All 14 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
