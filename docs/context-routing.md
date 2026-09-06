# DPT Context Routing (V0.2)

**Version:** 0.2.0
**Generated:** 2026-09-05T17:07:39.529Z

## Overview

Deterministic context routing rules for DPT V0.2. Context is routed
based on brain, role, task type, authority, and component boundaries.

## Routing Rules

| Route ID | Input | Output | Priority |
|----------|-------|--------|----------|
| brain-router | brain_id | docs/brains/*.md | 1 |
| role-router | role_id | docs/governance/*.md | 2 |
| task-router | task_class | docs/DPT_*.md, docs/governance/*.md | 3 |
| authority-router | required_capabilities | docs/governance/AUTHORITY_PERMISSION_MODEL.md | 4 |
| component-router | component_id | docs/component-registry.json | 5 |

## Principles

- Minimum sufficient context: provide only what is needed
- Source-of-truth priority: authoritative docs first
- Dependency awareness: route based on task dependencies
- Authority boundaries: never expose context beyond authority

## Usage

Context routing is applied automatically based on:
1. Task type and class
2. Required capabilities
3. Authority scope
4. Component boundaries
