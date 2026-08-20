# Component Registry

This registry is project-specific and should be populated from verified code.

## Entry schema

### Component
[NAME]

Path: [PATH]

Purpose: [PURPOSE]

Reuse when: [USAGE]

Do not use when: [NON-USAGE]

Variants/states: [VARIANTS]

Dependencies: [DEPENDENCIES]

## Registry rules

1. Verify registry entries against code before relying on them.
2. Search the registry before creating a new reusable component.
3. Prefer reuse → compose → extend → create.
4. Register genuinely reusable new components.
5. Do not register feature-local implementation details as platform components.
