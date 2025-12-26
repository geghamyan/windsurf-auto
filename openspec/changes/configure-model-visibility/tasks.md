## 1. Implementation
- [x] 1.1 Define a `MODEL_VISIBILITY_CONFIG` object in `windsurf-auto-continue.js` mapping exact model names to `true` (enabled) or `false` (disabled).
- [x] 1.2 Add a top-level `ENABLE_MODEL_VISIBILITY` constant that gates all config-driven show/hide behavior.
- [x] 1.3 Update the existing model-hiding logic (currently driven by `HIDDEN_MODELS`) to use `MODEL_VISIBILITY_CONFIG` instead, preserving exact-text matching semantics.
- [x] 1.4 Ensure that when `ENABLE_MODEL_VISIBILITY` is `false`, no models are hidden or shown due to `MODEL_VISIBILITY_CONFIG`.
- [x] 1.5 Wire up logging so that model visibility actions can be inspected during manual testing without being overly noisy.

## 2. Validation
- [ ] 2.1 Configure at least one model as disabled and confirm it is hidden from the selector when `ENABLE_MODEL_VISIBILITY` is `true`.
- [ ] 2.2 Configure at least one model as enabled while others are disabled in the config object and confirm only the enabled one remains visible.
- [ ] 2.3 Set `ENABLE_MODEL_VISIBILITY` to `false` and confirm that the model selector remains unaffected by the config object.
