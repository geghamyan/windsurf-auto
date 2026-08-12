# button-target-feature-gates Specification

## Purpose
TBD - created by archiving change feature-gate-button-targets. Update Purpose after archive.
## Requirements
### Requirement: Each button target is individually controllable via FEATURE_CONFIG
Every entry in `BUTTON_TARGETS` SHALL declare a `feature` property referencing a `Feature` enum value. The shared `evaluateButton()` logic SHALL check `featureEnabled(target.feature)` and skip the target when its feature is disabled.

#### Scenario: Target with feature enabled
- **WHEN** a `BUTTON_TARGETS` entry has `feature: Feature.AutoContinue`
- **AND** `FEATURE_CONFIG[Feature.AutoContinue]` has `enabled: true`
- **AND** the button's text matches the target's matcher
- **THEN** the script SHALL consider the button clickable (subject to visibility checks)

#### Scenario: Target with feature disabled
- **WHEN** a `BUTTON_TARGETS` entry has `feature: Feature.AutoContinue`
- **AND** `FEATURE_CONFIG[Feature.AutoContinue]` has `enabled: false`
- **AND** the button's text matches the target's matcher
- **THEN** the script SHALL NOT click the button
- **AND** the script SHALL log at Debug level that the target matched but was feature-disabled

#### Scenario: Feature gate is checked uniformly in evaluateButton
- **WHEN** `evaluateButton()` finds a matching target via the `matches` predicate
- **THEN** it SHALL check `featureEnabled(matchingTarget.feature)` before proceeding with visibility checks
- **AND** this check SHALL apply to all targets uniformly (no inline feature checks in matchers)

### Requirement: AutoContinue and AutoRunAltEnter feature flags exist with enabled defaults
The `Feature` enum SHALL contain `AutoContinue` and `AutoRunAltEnter` entries. `FEATURE_CONFIG` SHALL contain corresponding entries with `enabled: true` and `level: LogLevel.Info` as defaults.

#### Scenario: Feature enum entries
- **WHEN** the script initializes
- **THEN** `Feature.AutoContinue` SHALL equal `'autoContinue'`
- **AND** `Feature.AutoRunAltEnter` SHALL equal `'autoRunAltEnter'`

#### Scenario: FEATURE_CONFIG defaults
- **WHEN** the script initializes with unmodified defaults
- **THEN** `FEATURE_CONFIG[Feature.AutoContinue]` SHALL have `enabled: true`
- **AND** `FEATURE_CONFIG[Feature.AutoRunAltEnter]` SHALL have `enabled: true`

### Requirement: Allow target matcher becomes a pure text matcher
The `allow` target's `matches` function SHALL only perform text matching (`normalizedText.startsWith('allow')`). It SHALL NOT call `featureEnabled()` internally — the shared `evaluateButton()` gate handles this.

#### Scenario: Allow matcher is pure
- **WHEN** the `allow` target entry is defined in `BUTTON_TARGETS`
- **THEN** its `matches` function SHALL NOT reference `featureEnabled` or `Feature.AutoAllow`
- **AND** its `feature` property SHALL be set to `Feature.AutoAllow`

