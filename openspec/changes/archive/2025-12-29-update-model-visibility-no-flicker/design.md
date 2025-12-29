## Context
Model visibility filtering currently runs as part of a periodic scan loop. When the model selector dropdown opens, the UI can render the full list before the next scan pass runs, causing a visible flash where models are briefly shown and then hidden.

## Goals / Non-Goals
- Goals:
  - Apply model visibility filtering immediately when the dropdown opens.
  - Prevent flicker by ensuring disallowed models are never visible to the user.
  - Keep overhead low by scoping DOM work to the dropdown container and disconnecting observers promptly.
- Non-Goals:
  - Replacing the interval loop for button clicking.
  - Adding dependencies or multi-file architecture.

## Decisions
- Decision: Use a `MutationObserver` to detect the dropdown container opening and apply model filtering immediately.
  - Rationale: Observing DOM insertion is event-driven and avoids waiting for the next interval tick.
- Decision: Use a short-lived “hide container while filtering” approach.
  - Rationale: Guarantees no flicker even if the list content populates over multiple microtasks/frames.
- Decision: Scope filtering to the dropdown container.
  - Rationale: Avoid accidental matches elsewhere and reduce per-pass work.

## Risks / Trade-offs
- Selector fragility:
  - Risk: The dropdown container selectors may change.
  - Mitigation: Use a small set of fallback selectors for the dropdown root and log a one-time warning when none match.
- Virtualization / incremental loading:
  - Risk: Items may be added after initial open.
  - Mitigation: Keep the observer attached while the dropdown is open and apply filtering to newly added nodes only; disconnect on close.

## Migration Plan
- Add event-driven dropdown detection.
- Apply filtering on open with container hidden.
- Disconnect observer on close.
- Validate manually (open/close, scroll/"See more", performance).

## Open Questions
- Whether the model list is virtualized or lazily loaded in all Windsurf versions.
