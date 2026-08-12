Windsurf Auto Button Presser
============================

Automation helper for the Windsurf desktop UI. It watches for key actions and clicks them for you—no synthetic key events required.

Based on code from https://gist.github.com/steipete/799f4f7a6ed6e96a02a5539d4a03b5b7 (v13.2).

## Features
- Auto-presses the main **Continue** button (text begins with "continue").
- Auto-presses the **RunAlt+⏎** run button.
- Auto-presses the **Allow** button on command execution approval cards.
- Optional model filtering for the selector (show/hide models via `MODEL_VISIBILITY_CONFIG`).

## Quick start
1) Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac).
2) Search for and select `Developer: Toggle Developer Tools`.
3) Go to the **Sources** tab, then the **Snippets** panel.
4) Create a new snippet and paste the contents of `windsurf-auto-continue.js`.
5) Right-click on the snippet and select **Run**.

*Note: You need to run the snippet every time a new Windsurf window is opened.*

**Alternative (Console):**
1) Open the Windsurf desktop app, launch DevTools, and paste the contents of `windsurf-auto-continue.js` into the console.
2) The script starts immediately and runs every second by default.
3) To stop it, run: `window.stopWindsurfAutoPressContinue_v13_2()`.

## Configuration (in `windsurf-auto-continue.js`)
- `Feature`: enum of feature names (`ModelVisibility`, `Clicker`, `Settings`, `Lifecycle`, `AutoExecutionUnlock`, `AutoAllow`, `AutoContinue`, `AutoRunAltEnter`).
- `LogLevel`: enum of log levels (Error, Warn, Info, Debug, Trace).
- `BUTTON_TARGETS` / `BTN_SELECTORS`: buttons to consider for auto-click; each target declares a `feature` for per-target toggles.
- `COOLDOWN_MS` / `CHECK_MS`: click cooldown and poll interval.
- `MODEL_VISIBILITY_CONFIG`: which models to show/hide in the selector.

## Configuring `FEATURE_CONFIG`
Use per-feature `{ enabled, level }` entries to control behavior and log noise:

```js
const FEATURE_CONFIG = {
  [Feature.ModelVisibility]:     { enabled: true,  level: LogLevel.Info },
  [Feature.AutoExecutionUnlock]:   { enabled: false, level: LogLevel.Info },
  [Feature.AutoAllow]:             { enabled: true,  level: LogLevel.Info },
  [Feature.AutoContinue]:          { enabled: false, level: LogLevel.Info },
  [Feature.AutoRunAltEnter]:       { enabled: true,  level: LogLevel.Info },
};
```

- Toggle a feature: set `enabled` to `true` (on) or `false` (off).
- Adjust logs per feature: set `level` to `Error | Warn | Info | Debug | Trace`.

## Examples
- Disable model filtering entirely: `{ enabled: false, level: LogLevel.Info }` for `Feature.ModelVisibility`.
- Enable auto-clicking the **Allow** button: `{ enabled: true, level: LogLevel.Info }` for `Feature.AutoAllow`.
- Enable auto-clicking the **Continue** button: `{ enabled: true, level: LogLevel.Info }` for `Feature.AutoContinue`.

## Logging tips
- `LOG_LEVEL` is the fallback when a feature is missing from `FEATURE_CONFIG`.
- Raise a specific feature to `Debug` or `Trace` when diagnosing it; keep others at `Info` to avoid noise.

## Maintenance
- If Windsurf UI/CSS changes, revisit `BTN_SELECTORS` and settings row selectors.
- Add new button behaviors by extending `BUTTON_TARGETS` with a `feature` property and reusing `evaluateButton` visibility checks.
- Project conventions live in `openspec/project.md`.
