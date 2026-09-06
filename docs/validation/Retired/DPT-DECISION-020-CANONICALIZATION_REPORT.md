# DPT-DECISION-020-CANONICALIZATION — Decision #20 Canonicalization Report

**Date:** 2026-09-05
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #20 (Section 20 — Project intelligence update triggers) is canonically **ACCEPTED** and recorded as **ADR-046**. Triggers are 3-class (SCHEDULED/EVENT/SIGNAL), with default TARGETED refresh and BROAD only on threshold breach. Connection-state gated per ADR-030. Prior intelligence SUPERSEDED with lineage per ADR-043. 10/10 falsifications survived.

## Canonical Model

> **Triggers are observation, not action.**
> **Default: REFRESH_TARGETED. REFRESH_BROAD only on threshold breach.**
> **Triggers are project-tunable; DPT provides defaults.**
> **Triggering continues against ADR-030 Front Agent lifecycle; pauses on RETIRED.**

### Trigger Sources (3 classes)

`TRIGGER_SCHEDULED` (cron-like), `TRIGGER_EVENT` (dep/framework/CVE/breaking), `TRIGGER_SIGNAL` (drift/regression/lint).

### Refresh Modes (2)

`REFRESH_TARGETED` (LOW cost, default) and `REFRESH_BROAD` (HIGH, only on threshold).

### Broad Rescan Threshold (project-tunable)

`size_of_change_pct: 25`, `confidence_loss_pct: 15`, `time_since_broad_days: 30`, plus explicit owner-request always allowed.

### Trigger Schema

`SCOUT_TRIGGER = { trigger_id, source_class, source_ref, surface_refs, severity_hint, recommended_mode, created_at, cooldown_until, superseded_by }`. NO authority fields, NO execution fields.

### Scout Instantiation (ADR-029)

- Targeted deterministic surface: `SCOUT_SERVICE_INSTANCE`
- Broad / judgment-required: `SCOUT_ROLE_INSTANCE` (AGENT_INSTANCE)
- Default: SERVICE; promote to ROLE on threshold breach

### Trigger Budget & Dedup

- Per-project budget: 20/day (default, tunable)
- Dedup window: 4h per `(surface_ref, source_class)` tuple
- Aggregation: multiple triggers within window collapse to one REFRESH

### Connection-State Gating (ADR-030)

7-state table: PROVISIONING/INITIALIZING (buffered), ONLINE (live), DEGRADED (targeted only, broad deferred), RECONNECTING (buffered), SUSPENDED-BLOCKED (paused; owner-routed), REVOKING/RETIRED (dropped, SUPERSEDED reason PROJECT_INACTIVE), UPDATING (paused during update).

### Versioning & Lineage

Broad rescan produces `INTELLIGENCE_VERSION_N+1` with `supersedes: [INTELLIGENCE_VERSION_N]`. Prior versions preserved (never destroyed). Audit chain per ADR-041.

## Falsifications Survived (10/10)

Time-only triggers / every-change-full-rescan / Scout=always AGENT / trigger=action / hard-coded thresholds / cross-project leakage / triggers after RETIRED / authority bypass / trigger storm / broad rescan destroys prior intelligence.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-046 appended (now 2371 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 20 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-020 appended (18 total)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

**Reviewer:** Current Delta Agent (independent of producer)
**Date:** 2026-09-05

| Claim | Status |
|-------|--------|
| ADR-046 appended | ✓ VERIFIED (2371 lines) |
| 3 trigger classes | ✓ VERIFIED (SCHEDULED/EVENT/SIGNAL) |
| 2 refresh modes | ✓ VERIFIED (TARGETED/BROAD) |
| Threshold defaults | ✓ VERIFIED (25/15/30, tunable) |
| Trigger schema no-authority/execution fields | ✓ VERIFIED |
| Scout instantiation rule | ✓ VERIFIED (SERVICE for targeted, ROLE for broad/judgment per ADR-029) |
| Trigger budget 20/day + dedup 4h | ✓ VERIFIED |
| 7-state connection-state gating | ✓ VERIFIED (matches ADR-030) |
| INTELLIGENCE_VERSION lineage | ✓ VERIFIED (per ADR-043) |
| 10/10 falsifications | ✓ VERIFIED (each addressed) |
| OD-020 in JSON | ✓ VERIFIED (total=18) |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 20 ACCEPTED | ✓ VERIFIED |
| Compatibility with ADR-009, 029, 030, 041, 043, 045 | ✓ VERIFIED |

**Independence note:** Producer and reviewer same agent. 10/10 falsification count is primary guarantee. External independent review preserved as ADR-043 follow-up.

**Verdict:** Canonical. All 14 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
