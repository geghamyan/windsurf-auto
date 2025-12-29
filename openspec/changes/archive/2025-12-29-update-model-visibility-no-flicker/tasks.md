## 1. Implementation
- [x] 1.1 Add an event-driven hook to detect when the model selector dropdown opens (MutationObserver scoped to the dropdown container).
- [x] 1.2 Apply model visibility filtering immediately on open, scoped to the dropdown content (no global scans).
- [x] 1.3 Prevent flicker by temporarily hiding the dropdown container during the initial filter pass and restoring visibility immediately after.
- [x] 1.4 Ensure the observer disconnects promptly to avoid background overhead.
- [x] 1.5 Add minimal logging for: detected dropdown open, filtering applied (once per open), and failure-to-detect hints.

## 2. Manual Validation
- [ ] 2.1 Open the model selector dropdown and confirm disallowed models never appear (no flash).
- [ ] 2.2 Scroll / expand the list (e.g., "See more") and confirm disallowed models remain hidden if additional items load.
- [ ] 2.3 Close and reopen the dropdown multiple times and confirm no gradual slowdown (observer not leaking).
- [ ] 2.4 Confirm the script continues to click intended buttons and does not introduce extra interval noise.
