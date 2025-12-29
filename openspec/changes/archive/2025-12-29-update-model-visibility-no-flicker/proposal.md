# Change: Update model visibility filtering to be event-driven and no-flicker

## Why
Model visibility filtering currently happens after the model selector dropdown renders, causing a visible delay where models briefly appear and then get removed. This is distracting and makes the UI feel unstable.

## What Changes
- Apply model visibility filtering immediately when the model selector dropdown opens (event-driven) instead of waiting for the periodic interval tick.
- Ensure **no flicker** by temporarily hiding the dropdown container during the initial filtering pass and restoring visibility immediately after.
- Scope filtering work to the open dropdown content to avoid unintended matches elsewhere in the UI and to keep performance predictable.

## Impact
- Affected specs:
  - `openspec/specs/model-visibility/spec.md`
- Affected code:
  - `windsurf-auto-continue.js` (model visibility filtering logic)
