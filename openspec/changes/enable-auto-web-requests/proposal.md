---
change-id: enable-auto-web-requests
status: DRAFT
---

# Change: Enable Auto Web Requests dropdown when settings open

## Why
Windsurf’s Cascade section exposes an “Auto Web Requests” combobox whose options are disabled in the settings UI. Users want the automation snippet in this repository to un-disable the dropdown when settings are visible so they can manually choose between the existing options (“Disabled”, “Allowlist”, “Turbo”) without the script selecting a value automatically.

## What Changes
- Detect the Cascade “Auto Web Requests” setting whenever the settings panel is in the DOM.
- Remove the disabled state from the combobox and any option elements so the user may interact with them.
- Keep all options intact and do not auto-select a choice; simply surface native interactivity.
- Log once per settings open to document when the dropdown was unlocked.

## Impact
- Affected specs: `cascade-settings`
- Affected code: `windsurf-auto-continue.js`
