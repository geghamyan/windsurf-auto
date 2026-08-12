# auto-allow Specification

## Purpose
TBD - created by archiving change fix-allow-button-dom. Update Purpose after archive.
## Requirements
### Requirement: Auto-Allow clicks the Allow button on command execution cards
The automation script SHALL detect the "Allow" button on command execution approval cards and click it automatically when the auto-allow feature is enabled.

#### Scenario: Feature enabled and Allow button is visible
- **WHEN** `Feature.AutoAllow` is enabled in `FEATURE_CONFIG`
- **AND** a command execution approval card is rendered with a visible, enabled "Allow" button
- **THEN** the script SHALL click the Allow button
- **AND** the script SHALL log the click at Info level

#### Scenario: Feature disabled (default)
- **WHEN** `Feature.AutoAllow` is disabled in `FEATURE_CONFIG` (the default)
- **AND** a command execution approval card is rendered with a visible "Allow" button
- **THEN** the script SHALL NOT click the Allow button

#### Scenario: Reject button is not matched
- **WHEN** a command execution approval card is rendered with both "Allow" and "Reject" buttons
- **THEN** the script SHALL NOT match or click the "Reject" button regardless of the feature flag state

### Requirement: Auto-Allow uses the existing button target and selector infrastructure
The auto-allow feature SHALL be implemented as a new entry in `BUTTON_TARGETS` using the existing selector and matcher pattern.

#### Scenario: Selector matches the Allow button
- **WHEN** the Allow button is rendered with `bg-ide-button-background` in its CSS class
- **THEN** the existing `BTN_SELECTORS` query SHALL find it as a candidate
- **AND** the new `BUTTON_TARGETS` entry SHALL match its normalized text starting with "allow"

#### Scenario: Cooldown applies equally
- **WHEN** the Allow button is clicked by the script
- **THEN** the standard `COOLDOWN_MS` cooldown SHALL apply before any subsequent button click

### Requirement: Auto-Allow is gated behind a feature flag
The auto-allow feature SHALL be controlled by a dedicated feature flag following the existing `Feature` / `FEATURE_CONFIG` pattern.

#### Scenario: Feature flag structure
- **WHEN** the script initializes
- **THEN** `Feature` SHALL contain an `AutoAllow` entry
- **AND** `FEATURE_CONFIG` SHALL contain a corresponding entry with `enabled: false` and `level: LogLevel.Info` as defaults

