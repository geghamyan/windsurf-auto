---
change-id: configure-model-visibility
status: DRAFT
---

# Change: Configurable per-model visibility via config object

## Why
Users want fine-grained control over which models appear in the Windsurf model selector, without editing code logic. Today, `HIDDEN_MODELS` is a hard-coded list with no feature-level toggle and no ability to express both enabled and disabled states in a single structure. A configuration-driven approach will make it easier to maintain and reason about model visibility.

## What Changes
- Introduce a single configuration object in the script that maps each known model name to an explicit enabled/disabled flag.
- Add a top-level constant that turns the entire model-visibility feature on or off.
- Use exact, case-sensitive matching on the model labels as they appear in the UI.
- When the feature is enabled, hide or show models strictly according to the configuration object.
- When the feature is disabled, leave the UI unchanged by this feature (no hiding/showing driven by the config object).
- Align or replace existing `HIDDEN_MODELS` behavior with the new configuration-driven mechanism.

## Impact
- Affected specs: `model-visibility`
- Affected code: `windsurf-auto-continue.js`
