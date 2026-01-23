Windsurf Auto Button Presser

What it does
- Periodically scans the Windsurf UI for specific action buttons.
- Auto-clicks any matching, fully visible, and enabled buttons (no synthetic key presses).
- Supports both the "Continue" button (text starts with "continue") and the "RunAlt+⏎" run button.
- Can unlock disabled options in the "Auto Web Requests" and "Auto Execution" settings.
- Optionally hides/shows specific models in the selector based on `MODEL_VISIBILITY_CONFIG`.

Configuration (see `// --- Config ---` in `windsurf-auto-continue.js`)
- `Feature`: enum-like object defining feature names (ModelVisibility, Clicker, Settings, etc.)
- `LogLevel`: enum-like object defining log levels (Error, Warn, Info, Debug, Trace)
- `FEATURE_CONFIG`: per-feature configuration with `{ enabled, level }` for each feature
  - `Feature.ModelVisibility`: controls model dropdown filtering
  - `Feature.AutoWebRequestsUnlock`: controls unlocking Auto Web Requests dropdown options
  - `Feature.AutoExecutionUnlock`: controls unlocking Auto Execution dropdown options
- `LOG_LEVEL`: global default log level (fallback when a feature is not in `FEATURE_CONFIG`)
- `BUTTON_TARGETS` / `BTN_SELECTORS`: define which buttons are considered for auto-click
- `COOLDOWN_MS` / `CHECK_MS`: control click cadence
- `MODEL_VISIBILITY_CONFIG`: controls which models are shown or hidden in the selector

Configuring `FEATURE_CONFIG`
- Toggle a feature on/off: set `enabled` to `true` or `false` for that feature key.
- Control log noise per feature: set `level` to one of `LogLevel.Error | Warn | Info | Debug | Trace`.
- Defaults are set near the top of `windsurf-auto-continue.js`:
  ```js
  const FEATURE_CONFIG = {
    [Feature.ModelVisibility]: { enabled: true, level: LogLevel.Info },
    [Feature.AutoWebRequestsUnlock]: { enabled: false, level: LogLevel.Info },
    [Feature.AutoExecutionUnlock]: { enabled: false, level: LogLevel.Info },
  };
  ```
- Examples:
  - Disable model filtering entirely: `{ enabled: false, level: LogLevel.Info }` for `Feature.ModelVisibility`.
  - Enable Auto Web Requests unlock with verbose logs: `{ enabled: true, level: LogLevel.Debug }` for `Feature.AutoWebRequestsUnlock`.
  - Keep Auto Execution unlock off but silent: `{ enabled: false, level: LogLevel.Error }` for `Feature.AutoExecutionUnlock`.

Logging
- Per-feature log levels allow debugging specific features without noise from others.
- Set `FEATURE_CONFIG[Feature.X].level` to `LogLevel.Debug` for verbose output.
- Set `FEATURE_CONFIG[Feature.X].enabled` to `false` to disable a feature entirely.

Usage
- Paste `windsurf-auto-continue.js` into the Windsurf desktop app web UI (e.g., DevTools console) to start it.
- To stop it, call: `window.stopWindsurfAutoPressContinue_v13_2()`.

Maintenance notes
- If the Windsurf UI or CSS classes change, review `BTN_SELECTORS` and the settings row selectors.
- When adding new button behaviors, prefer extending `BUTTON_TARGETS` and reuse `evaluateButton` visibility checks.
- For project-wide conventions, see `openspec/project.md`.
