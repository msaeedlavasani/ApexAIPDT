# DPT Roadmap

## V0 — Operating model

- [x] Vision and scope
- [x] Constitution
- [x] Core terminology
- [x] Brain contract
- [x] Orchestrator model
- [x] Context system
- [x] Decision system
- [x] Memory system
- [x] Dynamic team assembly
- [x] Human/AI boundary
- [x] Workflow model
- [x] Project templates
- [x] Reference validation profile

## V0.1 — Real project validation

- [x] Install DPT artifacts into reference project
- [x] Generate project constitution
- [x] Generate context map from actual repository
- [x] Build verified component registry
- [x] Build asset registry
- [x] Run small feature autonomy test
- [x] Run visual change test
- [x] Run new-game/Catan discovery test
- [x] Measure token/context usage and human interventions
- [x] Validate the Execution Orchestrator Task/Work Order/Attempt/Verification flow on bounded real-project work
- [x] Record runtime, transport, persistence, packaging, failure, and human-gate evidence without freezing implementation choices

## V0.2 — Machine-readable layer

- [x] Define schemas for brains, roles, authority, artifacts, decisions, registries, and workflows
- [x] Generate manifests from schemas
- [x] Add deterministic context routing
- [x] Add validation/reporting schemas

## V0.3 — Bootstrap tooling

- [x] Project initializer
- [x] Project scanner
- [x] Context-map generator
- [x] Registry generator
- [x] Team-assembly assistant

## V1 — Production runtime (after validation evidence)

- [x] Provider-neutral orchestrator runtime (RUNTIME_PROVEN: orchestrator-core.mjs, test-v1-runtime-023.mjs 7/7 PASS)
- [x] Agent adapters (RUNTIME_PROVEN: goose-adapter.mjs existing + test-v1-runtime-024.mjs 5/5 PASS)
- [x] Persistent project memory (RUNTIME_PROVEN: memory-runtime.mjs, test-v1-runtime-025.mjs 8/8 PASS)
- [x] Workflow state management (RUNTIME_PROVEN: workflow-runtime.mjs, test-v1-runtime-026.mjs 11/11 PASS)
- [x] Quality-gate execution (RUNTIME_PROVEN: qualitygate-runtime.mjs, test-v1-runtime-027.mjs 4/4 PASS)
- [x] Human approval interface (RUNTIME_PROVEN: approval-ui-runtime.mjs, test-v1-runtime-028.mjs 8/8 PASS)
- [x] Freeze transport, persistence, deployment topology, and packaging decisions (RUNTIME_PROVEN: freeze-decisions-runtime.mjs, test-v1-runtime-029.mjs 5/5 PASS)

## V2 — Learning system

- [ ] Intervention measurement
- [ ] Token/context efficiency measurement
- [ ] Failure pattern detection
- [ ] Automatic improvement proposals
- [ ] Cross-project reusable pattern extraction
