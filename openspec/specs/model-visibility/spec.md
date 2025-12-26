# model-visibility Specification

## Purpose
TBD - created by archiving change configure-model-visibility. Update Purpose after archive.
## Requirements
### Requirement: Configurable model visibility via a single config object
The automation script SHALL control which models appear in the Windsurf model selector via a single configuration object and a global feature toggle.

#### Scenario: Feature enabled with explicit per-model flags
- **GIVEN** a `MODEL_VISIBILITY_CONFIG` object where keys are exact UI model labels and values are booleans indicating enabled (`true`) or disabled (`false`)
- **AND** `ENABLE_MODEL_VISIBILITY` is set to `true`
- **WHEN** the script scans the model selector entries
- **THEN** any model with a config value of `false` SHALL be hidden from the selector
- **AND** any model with a config value of `true` SHALL remain visible

#### Scenario: Models missing from config object
- **GIVEN** `MODEL_VISIBILITY_CONFIG` does not contain an entry for a particular model label
- **AND** `ENABLE_MODEL_VISIBILITY` is `true`
- **WHEN** the script encounters that model in the selector
- **THEN** the script SHALL leave the model unchanged (neither forcibly hidden nor shown by this feature)

#### Scenario: Feature disabled via global flag
- **GIVEN** any contents of `MODEL_VISIBILITY_CONFIG`
- **AND** `ENABLE_MODEL_VISIBILITY` is set to `false`
- **WHEN** the script runs
- **THEN** the script SHALL NOT hide or show any models based on `MODEL_VISIBILITY_CONFIG`

#### Scenario: Exact label matching
- **GIVEN** an entry in `MODEL_VISIBILITY_CONFIG` whose key exactly matches the visible model label text in the UI, including case and punctuation
- **WHEN** the script evaluates that model for visibility
- **THEN** the script SHALL use an exact, case-sensitive string comparison between the UI label and the config key to determine whether the config applies

