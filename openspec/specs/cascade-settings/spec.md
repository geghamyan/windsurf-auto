# cascade-settings Specification

## Purpose
Controls automation around Windsurf Cascade settings, including unlocking disabled dropdown options.
## Requirements
### Requirement: Auto Execution dropdown becomes interactive when settings are visible
The automation script SHALL detect the Cascade "Auto Execution" combobox within the Windsurf settings panel and remove any disabled state so the user can choose among the existing options without additional clicks from the script.

#### Scenario: Settings panel opens
- **WHEN** the user opens Windsurf settings and the Cascade section's Auto Execution combobox is present
- **THEN** the script removes `disabled` attributes or classes blocking user interaction from the combobox and its options
- **AND** the script does not change the currently selected value
- **AND** the script logs that the combobox was unlocked exactly once per settings session

