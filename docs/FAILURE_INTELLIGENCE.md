# Apex AI DPT — Failure Intelligence & Pitfall System

## Purpose

DPT treats failures as reusable organizational knowledge. A meaningful failure should become cheaper to resolve the next time it appears.

## Failure Intelligence Agent

The Failure Intelligence Agent is preventive, not merely reactive.

It should enter the flow when a meaningful failure is first detected, not only after a failed fix is repeated.

Its responsibilities include:

- classify the failure;
- search the Pitfall Pool;
- inspect authoritative documentation;
- identify known patterns and likely root causes;
- prevent speculative modification loops;
- recommend evidence-based resolution;
- validate the resolution;
- capture reusable root cause and prevention knowledge;
- contribute validated knowledge to the Pitfall Pool.

## First-failure protocol

```text
Failure detected
  ↓
Failure Intelligence Agent
  ↓
Pitfall Pool search
  ↓
Authoritative documentation
  ↓
Diagnosis / root cause hypothesis
  ↓
Evidence-based resolution
  ↓
Validation
  ↓
Pitfall contribution
```

AI MUST NOT treat repeated guessing as the default debugging strategy when authoritative documentation or reliable evidence can be consulted.

## No speculative correction loop

A project should not repeatedly modify unrelated code based on guesses. If evidence is insufficient, the Failure Intelligence Agent must investigate the underlying technology, inspect authoritative sources, or escalate when necessary.

## Pitfall Pool as shared memory

Pitfalls do not need to be duplicated into every project as a separate permanent library. The project accesses the shared DPT Pitfall Pool through the DPT Connector/API.

The project may maintain temporary/local cache data for resilience and performance, but the authoritative shared Pitfall knowledge belongs to DPT.

## Pitfall record

A reusable Pitfall should capture, as applicable:

- problem identity;
- symptoms/signature;
- affected technologies/versions;
- root cause;
- incorrect approaches tried;
- authoritative sources;
- validated resolution;
- prevention guidance;
- compatibility conditions;
- confidence/evidence;
- provenance;
- usage history.

## Learning loop

```text
Project A encounters failure
        ↓
Resolve + validate
        ↓
Contribute to Pitfall Pool
        ↓
Project B encounters similar failure
        ↓
Retrieve known Pitfall
        ↓
Use evidence-based resolution
        ↓
Add new evidence if discovered
```

The result is a compounding failure-prevention system.

## Relationship to reusable assets

If a Pitfall identifies a defect in a shared Component or Module, the correct action may be to fix the shared asset, create a new version, and evaluate affected projects for safe updates.

```text
Pitfall
  ↓
Root cause = shared asset
  ↓
Fix shared asset
  ↓
New asset version
  ↓
Compatibility / impact analysis
  ↓
Affected projects
```
