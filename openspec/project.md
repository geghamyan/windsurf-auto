# Project Context

## Purpose
This repository contains a single-file JavaScript snippet intended to be executed in the Windsurf desktop app’s web UI (i.e., in a browser/Chromium DOM context).

Its purpose is to automate repetitive UI actions:

- Periodically scan the Windsurf UI for specific action buttons.
- Click matching buttons only when they are fully visible and enabled (no synthetic key presses).
- Optionally hide selected model entries from the model selector dropdown.

## Tech Stack
- JavaScript (plain ES runtime; runs in the page context)
- Browser DOM APIs (`document`, `querySelectorAll`, `getComputedStyle`, `setInterval`)
- No build system, package manager, or framework in this repo

## Project Conventions

### Code Style
- Prefer plain JavaScript and browser APIs; avoid adding dependencies.
- Keep the implementation self-contained in one file unless there is a clear need to split.
- Use `const` by default; use `let` only for mutable state (e.g., interval IDs, timestamps).
- Use ALL_CAPS for configuration constants (e.g., `BTN_SELECTORS`, `CHECK_MS`).
- Prefer small helper functions for clarity (e.g., `normalizeText`).
- When interacting with DOM elements:
  - Normalize text before matching.
  - Gate actions behind visibility and “enabled” checks.
- Logging:
  - Use `console.log` for key events (start/stop, click action, hiding a model).
  - Avoid noisy interval logs by default (keep verbose logs commented out or behind a flag).

### Architecture Patterns
- Single IIFE wrapper to avoid leaking symbols.
- Minimal, explicit global surface area:
  - Expose exactly one stop function on `window` (currently `window.stopWindsurfAutoPressContinue_v13_2`).
  - Store the active interval ID and other runtime handles on `window[STATE_KEY]` to allow cleanup on re-run.
- Configuration-driven behavior:
  - Button matching rules live in `BUTTON_TARGETS` and are predicate-based.
  - DOM queries are centralized via `BTN_SELECTORS`.
- Safety-first clicking:
  - Only click if element is actually visible, not hidden, displayed, opaque, and enabled.

### Testing Strategy
No automated tests are currently set up in this repo.

Preferred verification approach is manual:

- Run the snippet in the Windsurf UI context.
- Confirm only intended buttons are clicked (and only when interactive).
- Confirm stop/start behavior works and multiple runs do not leak multiple intervals/observers.
- For changes to selectors or matchers, validate against the current Windsurf UI version.

### Git Workflow
- Keep changes small and reviewable.
- Prefer descriptive commit messages focused on behavior (e.g., “Improve visibility checks”, “Add matcher for RunAlt+⏎”).
- If adopting OpenSpec for larger changes, follow `openspec/AGENTS.md` and use a change proposal under `openspec/changes/`.

## Domain Context
- The script runs inside Windsurf’s embedded web UI; it is not a Node.js program.
- The UI is subject to change (CSS classnames/selectors can break); selectors may need periodic updates.
- “Continue” and “RunAlt+⏎” are UI action buttons that can appear/disappear based on Windsurf state.
- Model entries are rendered as `span.truncate` elements within buttons in the model selector.

## Important Constraints
- Do not add heavy tooling unless necessary; keep this repo lightweight.
- Avoid behavior that could spam clicks:
  - Respect cooldown (`COOLDOWN_MS`).
  - Require visibility/interactivity checks.
- Avoid synthetic key presses; click the actual DOM element.
- This is “best-effort” automation: if the UI changes, the script should fail safely (do nothing) and log actionable hints.

## External Dependencies
- Windsurf desktop app UI (DOM and styling) is the primary external dependency.
- This script is based on a community gist (see header in `windsurf-auto-continue.js` for reference).
