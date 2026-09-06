# DPT-FOUNDATION-017 — Validation/Reporting Schemas

**Status:** VALIDATED
**Test Date:** 2026-09-05T17:07:39.756Z
**Task ID:** DPT-FOUNDATION-017

## Objective

Define validation and reporting schemas for V0.2.

## Schemas Defined

| Schema | File | Status |
|--------|------|--------|
| Validation | v02-validation.schema.json | ✅ DEFINED |
| Reporting | v02-reporting.schema.json | ✅ DEFINED |

## Validation Schema Fields

- task_id: string
- status: enum (PASS, FAIL, VALIDATED)
- test_date: date-time
- tests_passed: integer
- tests_failed: integer
- owner_permission_popups: integer
- assertions: array
- artifacts: array
- conclusions: string

## Reporting Schema Fields

- report_id: string
- type: enum (phase, release_gate, evidence, audit)
- phase: string
- date: date-time
- findings: array
- recommendations: array
- next_phase: string

## Conclusions

✅ **VALIDATION_REPORTING_SCHEMAS_COMPLETE**

Validation and reporting schemas defined for V0.2. Standardizes
how validation results and reports are structured.

## Artifacts

- Validation schema: `/Users/msl/Documents/GitHub/ApexAIPDT/docs/schemas/v02-validation.schema.json`
- Reporting schema: `/Users/msl/Documents/GitHub/ApexAIPDT/docs/schemas/v02-reporting.schema.json`
- Validation report: `/Users/msl/Documents/GitHub/ApexAIPDT/docs/validation/DPT-FOUNDATION-017_VALIDATION_REPORTING_REPORT.md`
- Test script: `providers/goose/test-foundation-017.mjs`
