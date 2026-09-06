# DPT-DECISION-025-CANONICALIZATION — Decision #25 Canonicalization Report

**Date:** 2026-09-06
**Status:** PASS
**REPORT_STATUS:** NO_FURTHER_ATTENTION

## Executive Summary

Decision #25 (Section 25 — API monetization) is canonically **ACCEPTED** and recorded as **ADR-051**. Monetization is a policy-layer mapping between API endpoints and credit consumption rules, fully integrated with ADR-050 economy, fully observable, and decoupled from payment processing. 10/10 falsifications survived.

## Canonical Model

> **Monetization = value-flow mapping within governance abstraction (ADR-050).**
> **DPT API does NOT process payments; it emits credit-consumption events.**
> **Rate limits ≠ quotas; congestion control ≠ budgetary gate.**

### Monetization Rule Schema

`MONETIZATION_RULE = { api_method, tier_required, credit_cost_per_call (CONFIGURABLE/TBD), free_tier_exemption, audit_mode }`. Follows ADR-043 versioning.

### Integration with ADR-050 Economy

`ECONOMY_POLICY.cost_per_*` and `MONETIZATION_RULE.credit_cost_per_call` reference the same slot. Dual naming; single source of truth.

### Billing vs Accounting

Credit consumption (internal) → Economy (ADR-050).
Usage auditing (internal) → Audit chain (ADR-041).
External payment processing → OUT OF SCOPE (downstream adapter if any).

### Monetized Operation Record (mandatory, ADR-041)

`MONETIZED_OPERATION_RECORD` emitted for every monetized call. Includes: api_method, caller, subscription_tier, credit_cost, policy_version_ref, audit_chain_ref. No payment amount; no fiat.

### Rate Limit ≠ Quota

Two independent mechanisms on same endpoint: congestion control (ADR-045) vs budgetary gate (ADR-050). Separate configs.

### Pricing Visibility

Default: owner-only. Configurable to audit-trail-only. Never publicly broadcast via API or discovery.

### Decision Lifecycle (ADR-043)

All monetization changes: versioned supersession. Prior versions preserved.

### Explicitly UNRESOLVED

- `credit_cost_per_<operation>`: CONFIGURABLE_WITH_DEFAULTS, TBD
- Free tier exemption scope: policy-defined, not architecture-defined

## Falsifications Survived (10/10)

Monetization=billing / bypass tiers / public pricing / API is payment processor / free tier needs payment info / unversioned decisions / internal=external pricing / silent monetized ops / rate limit = quota / monetization changes API surface.

## Files Changed

- `docs/DPT_ARCHITECTURE_DECISIONS.md` → ADR-051 appended (now 3111 lines)
- `docs/DPT_OPEN_DECISIONS.md` → Section 25 → ACCEPTED
- `docs/v1-decision-resolutions.json` → OD-025 appended (23 total)
- `docs/TASKS.md` → DELTA appended

## LINEAGE DISPOSITION — Independent Review

| Claim | Status |
|-------|--------|
| ADR-051 appended | ✓ VERIFIED |
| Credits mapped to ADR-050 economy (same slot) | ✓ VERIFIED |
| No payment processing in DPT core | ✓ VERIFIED (explicitly out of scope) |
| Rate limit ≠ quota (two mechanisms) | ✓ VERIFIED |
| Monetized_operation_record mandatory | ✓ VERIFIED |
| Pricing visibility default = owner-only | ✓ VERIFIED |
| Versioned via ADR-043 | ✓ VERIFIED |
| 10/10 falsifications | ✓ VERIFIED |
| OD-025 in JSON | ✓ VERIFIED |
| DELTA in TASKS.md | ✓ VERIFIED |
| Section 25 ACCEPTED | ✓ VERIFIED |
| Compatibility with ADR-009, 029, 033, 040, 041, 043, 045, 048, 050 | ✓ VERIFIED |

**Verdict:** Canonical. All 12 verification points pass. No further attention required.

## Disposition

**REPORT_STATUS:** NO_FURTHER_ATTENTION
**Action:** Move to `docs/validation/Retired/`
