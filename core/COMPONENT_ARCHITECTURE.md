# Component-First Architecture

This is the operational specification of Apex AI DPT's first architectural rule.

## 1. Principle

A DPT-managed product is a composition of components.

Componentization is recursive. A product is composed of capabilities; capabilities are composed of components; components may be composed of smaller components when that creates a useful boundary.

The objective is not maximum fragmentation. The objective is clear ownership, replaceability, reuse, testability, and predictable composition.

## 2. Component contract

Every component should make the following explicit where applicable:

- identity;
- purpose;
- responsibility;
- inputs;
- outputs;
- dependencies;
- state;
- lifecycle;
- events/actions;
- permissions;
- validation criteria.

## 3. Interface hub

The project interface is a hub over components.

The hub is responsible for composition and routing. Depending on the product, it may:

- select a component based on route or state;
- mount and unmount components;
- switch between components;
- pass context and contracts;
- coordinate navigation;
- expose shared shell behavior;
- invoke component actions.

The hub MUST NOT absorb the internal responsibility of the components it coordinates.

## 4. Component selection

When a request arrives:

1. identify the relevant component type;
2. search the component registry;
3. find the closest analogue;
4. reuse or compose existing components when possible;
5. extend an existing component when its responsibility genuinely covers the new behavior;
6. create a new component only when the responsibility is genuinely new.

## 5. Runtime composition

Components should be independently loadable or invokable when the technology and product architecture support it.

The system should prefer:

`discover → select → compose → invoke`

rather than:

`discover → rewrite parent → duplicate child behavior`.

## 6. Boundary rules

A component MUST NOT reach through another component's contract to manipulate its internal implementation unless an explicitly documented low-level contract requires it.

Shared state, services, APIs, and infrastructure should have their own explicit component/module boundaries where appropriate.

## 7. Validation

A component is not considered well-formed merely because it renders or executes.

Validate, as applicable:

- contract correctness;
- independent behavior;
- composition behavior;
- loading/error/empty states;
- responsive behavior;
- accessibility;
- dependency boundaries;
- regression impact.

## 8. Anti-patterns

Avoid:

- giant page components;
- giant game components;
- feature logic hidden in layout hubs;
- duplicated components with minor differences;
- components coupled through undocumented internals;
- a component registry that is never maintained;
- micro-components created only to satisfy a rule without a useful responsibility.

## 9. DPT-level modularity

The same principle applies to Apex AI DPT itself. Brains, workflows, registries, context providers, contracts, and other capabilities should be modules that can be assembled, replaced, or upgraded without rewriting unrelated DPT behavior.
