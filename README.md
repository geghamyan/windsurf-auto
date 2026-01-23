Windsurf Auto Button Presser
============================

Automation helper for the Windsurf desktop UI. It watches for key actions and clicks them for you—no synthetic key events required.

## Features
- Auto-presses the main **Continue** button (text begins with "continue").
- Auto-presses the **RunAlt+⏎** run button.
- Optional unlocks for disabled dropdown options in **Auto Web Requests** and **Auto Execution** settings.
- Optional model filtering for the selector (show/hide models via `MODEL_VISIBILITY_CONFIG`).

## Quick start
1) Open the Windsurf desktop app, launch DevTools, and paste the contents of `windsurf-auto-continue.js` into the console.
2) The script starts immediately and runs every second by default.
3) To stop it, run: `window.stopWindsurfAutoPressContinue_v13_2()`.

## Configuration (in `windsurf-auto-continue.js`)
- `Feature`: enum of feature names (ModelVisibility, Clicker, Settings, Lifecycle, AutoWebRequestsUnlock, AutoExecutionUnlock).
- `LogLevel`: enum of log levels (Error, Warn, Info, Debug, Trace).
- `BUTTON_TARGETS` / `BTN_SELECTORS`: buttons to consider for auto-click.
- `COOLDOWN_MS` / `CHECK_MS`: click cooldown and poll interval.
- `MODEL_VISIBILITY_CONFIG`: which models to show/hide in the selector.

## Configuring `FEATURE_CONFIG`
Use per-feature `{ enabled, level }` entries to control behavior and log noise:

```js
const FEATURE_CONFIG = {
  [Feature.ModelVisibility]:      { enabled: true,  level: LogLevel.Info },
  [Feature.AutoWebRequestsUnlock]:{ enabled: false, level: LogLevel.Info },
  [Feature.AutoExecutionUnlock]:  { enabled: false, level: LogLevel.Info },
};
```

- Toggle a feature: set `enabled` to `true` (on) or `false` (off).
- Adjust logs per feature: set `level` to `Error | Warn | Info | Debug | Trace`.

## Examples
- Disable model filtering entirely: `{ enabled: false, level: LogLevel.Info }` for `Feature.ModelVisibility`.
- Enable Auto Web Requests unlock with verbose logs: `{ enabled: true, level: LogLevel.Debug }` for `Feature.AutoWebRequestsUnlock`.
- Keep Auto Execution unlock off but quiet: `{ enabled: false, level: LogLevel.Error }` for `Feature.AutoExecutionUnlock`.

## Logging tips
- `LOG_LEVEL` is the fallback when a feature is missing from `FEATURE_CONFIG`.
- Raise a specific feature to `Debug` or `Trace` when diagnosing it; keep others at `Info` to avoid noise.

## Maintenance
- If Windsurf UI/CSS changes, revisit `BTN_SELECTORS` and settings row selectors.
- Add new button behaviors by extending `BUTTON_TARGETS` and reusing `evaluateButton` visibility checks.
- Project conventions live in `openspec/project.md`.
