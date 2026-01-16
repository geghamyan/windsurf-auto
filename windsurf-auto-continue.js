/**
 * Windsurf Auto Button Presser (based on v13.2 script from https://gist.github.com/steipete/799f4f7a6ed6e96a02a5539d4a03b5b7)
 *
 * What it does:
 *  - Periodically scans the Windsurf UI for specific action buttons.
 *  - Auto-clicks any matching, fully visible, and enabled buttons (no synthetic key presses).
 *  - Currently supports both the "Continue" button (text starts with "continue") and the "RunAlt+⏎" run button.
 *  - Can unlock disabled options in the "Auto Web Requests" and "Auto Execution" settings.
 *  - Optionally hides/shows specific models in the model selector based on MODEL_VISIBILITY_CONFIG.
 *
 * Configuration (see "// --- Config ---" below):
 *  - Feature: enum-like object defining feature names (ModelVisibility, Clicker, Settings, etc.)
 *  - LogLevel: enum-like object defining log levels (Error, Warn, Info, Debug, Trace)
 *  - FEATURE_CONFIG: per-feature configuration with { enabled, level } for each feature
 *    - Feature.ModelVisibility: controls model dropdown filtering
 *    - Feature.AutoWebRequestsUnlock: controls unlocking Auto Web Requests dropdown options
 *    - Feature.AutoExecutionUnlock: controls unlocking Auto Execution dropdown options
 *  - LOG_LEVEL: global default log level (fallback when feature not in FEATURE_CONFIG)
 *  - BUTTON_TARGETS / BTN_SELECTORS: define which buttons are considered for auto-click
 *  - COOLDOWN_MS / CHECK_MS: control how often clicks are attempted and the cooldown between clicks
 *  - MODEL_VISIBILITY_CONFIG: control which models are shown or hidden in the selector
 *
 * Logging:
 *  - Per-feature log levels allow debugging specific features without noise from others
 *  - Set FEATURE_CONFIG[Feature.X].level to LogLevel.Debug for verbose output
 *  - Set FEATURE_CONFIG[Feature.X].enabled to false to disable a feature entirely
 *
 * Usage:
 *  - Paste this script into the Windsurf desktop app web UI (e.g., DevTools console) to start it.
 *  - To stop it, call: window.stopWindsurfAutoPressContinue_v13_2().
 *
 * Maintenance notes:
 *  - If the Windsurf UI or CSS classes change, review BTN_SELECTORS and the settings row selectors.
 *  - When adding new button behaviors, prefer extending BUTTON_TARGETS and reusing evaluateButton's visibility checks.
 *  - For project-wide conventions, see openspec/project.md.
 */
//
(() => {
    const SCRIPT_NAME = 'Windsurf Auto Button Presser';
    const STATE_KEY = '__windsurfAutoButtonPresser__';
    window[STATE_KEY] ||= { intervalId: null, modelVisibility: null };

    const cleanupModelVisibilitySession = () => {
        const mv = window[STATE_KEY].modelVisibility;
        if (!mv) return;

        if (mv.contentObserver) {
            mv.contentObserver.disconnect();
            mv.contentObserver = null;
        }
        if (mv.removalCheckIntervalId) {
            clearInterval(mv.removalCheckIntervalId);
            mv.removalCheckIntervalId = null;
        }
    };

    const cleanupModelVisibilityAll = () => {
        const mv = window[STATE_KEY].modelVisibility;
        if (!mv) return;

        if (mv.dropdownObserver) {
            mv.dropdownObserver.disconnect();
            mv.dropdownObserver = null;
        }

        cleanupModelVisibilitySession();
    };

    if (window[STATE_KEY].intervalId) {
        clearInterval(window[STATE_KEY].intervalId);
        window[STATE_KEY].intervalId = null;
        console.log(`${SCRIPT_NAME}: Cleared previous interval.`);
    }

    let lastClick = 0;
    let autoWebRequestsUnlocked = false;
    let autoExecutionUnlocked = false;
    window[STATE_KEY].modelVisibility ||= {
        dropdownObserver: null,
        contentObserver: null,
        removalCheckIntervalId: null,
        currentDropdownContainer: null,
    };
    cleanupModelVisibilityAll();

    // --- Config ---
    const Feature = Object.freeze({
        General: 'general',
        Clicker: 'clicker',
        Settings: 'settings',
        Lifecycle: 'lifecycle',
        ModelVisibility: 'modelVisibility',
        AutoWebRequestsUnlock: 'autoWebRequestsUnlock',
        AutoExecutionUnlock: 'autoExecutionUnlock',
    });

    const LogLevel = Object.freeze({
        Error: 'error',
        Warn: 'warn',
        Info: 'info',
        Debug: 'debug',
        Trace: 'trace',
    });

    const LOG_LEVEL = LogLevel.Info;
    const FEATURE_CONFIG = {
        [Feature.ModelVisibility]: { enabled: true, level: LogLevel.Info },
        [Feature.AutoWebRequestsUnlock]: { enabled: false, level: LogLevel.Info },
        [Feature.AutoExecutionUnlock]: { enabled: false, level: LogLevel.Info },
    };

    const LOG_LEVELS = {
        [LogLevel.Error]: 0,
        [LogLevel.Warn]: 1,
        [LogLevel.Info]: 2,
        [LogLevel.Debug]: 3,
        [LogLevel.Trace]: 4,
    };

    const getFeatureLogLevel = (feature) => {
        if (!feature) return LOG_LEVEL;
        const cfg = FEATURE_CONFIG?.[feature];
        if (cfg?.enabled === false) return null;
        return cfg?.level ?? LOG_LEVEL;
    };

    const featureEnabled = (feature) => {
        const cfg = FEATURE_CONFIG?.[feature];
        if (!cfg) return true;
        return cfg.enabled !== false;
    };

    const logFeature = (feature, level, ...args) => {
        const configuredLevel = getFeatureLogLevel(feature);
        if (configuredLevel == null) return;
        const current = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS[LogLevel.Info];
        const target = LOG_LEVELS[level] ?? LOG_LEVELS[LogLevel.Info];
        if (target > current) return;

        const method = level === LogLevel.Error ? 'error' : level === LogLevel.Warn ? 'warn' : 'log';
        console[method](`${SCRIPT_NAME}:`, ...args);
    };

    // Backwards-compatible default logger (uses the global/default feature).
    const log = (level, ...args) => logFeature(Feature.General, level, ...args);

    const BTN_SELECTORS = 'span[class*="bg-ide-button-secondary-background"], button[class*="bg-ide-button-background"]';
    const BUTTON_TARGETS = [
        {
            id: 'continue',
            description: 'Auto-press main Continue button (text begins with "continue").',
            matches: ({ normalizedText }) => normalizedText.startsWith('continue'),
        },
        {
            id: 'run-alt-enter',
            description: 'Auto-press Run button that shows "RunAlt+⏎" (Run Alt+Enter shortcut).',
            matches: ({ collapsedText }) => collapsedText.includes('runalt+⏎'),
        },
    ];
    const SIDEBAR_SELECTOR = null;
    const COOLDOWN_MS = 3000;
    const CHECK_MS = 1000;
    const MODEL_VISIBILITY_CONFIG = {
        'Claude 3.5 Sonnet': false,
        'Claude 3.7 Sonnet': true,
        'Claude 3.7 Sonnet (Thinking)': true,
        'Claude Haiku 4.5': true,
        'Claude Opus 4.1 (Thinking)': false,
        'Claude Opus 4.5': true,
        'Claude Opus 4.5 (Thinking)': true,
        'Claude Sonnet 4': false,
        'Claude Sonnet 4 (Thinking)': false,
        'Claude Sonnet 4.5': true,
        'Claude Sonnet 4.5 (1M)': false,
        'Claude Sonnet 4.5 Thinking': true,
        'Gemini 2.5 Pro': false,
        'Gemini 3 Pro High': true,
        'Gemini 3 Pro Low': true,
        'GPT-4.1': false,
        'GPT-4o': false,
        'GPT-5 (high reasoning)': false,
        'GPT-5 (medium reasoning)': false,
        'GPT-5 (low reasoning)': false,
        'GPT-5-Codex': false,
        'GPT-5.1 (high reasoning)': true,
        'GPT-5.1 (high, priority)': false,
        'GPT-5.1 (medium reasoning)': true,
        'GPT-5.1 (medium, priority)': false,
        'GPT-5.1 (low reasoning)': true,
        'GPT-5.1 (low, priority)': false,
        'GPT-5.1 (no reasoning)': true,
        'GPT-5.1 (no reasoning, priority)': false,
        'GPT-5.1-Codex': true,
        'GPT-5.1-Codex Low': true,
        'GPT-5.1-Codex Max High': true,
        'GPT-5.1-Codex Max Medium': true,
        'GPT-5.1-Codex Max Low': true,
        'GPT-5.1-Codex-Mini': true,
        'GPT-5.1-Codex-Mini Low': true,
        'GPT-5.2 High Reasoning': true,
        'GPT-5.2 High Reasoning Fast': false,
        'GPT-5.2 Medium Reasoning': true,
        'GPT-5.2 Medium Reasoning Fast': false,
        'GPT-5.2 Low Reasoning': true,
        'GPT-5.2 Low Reasoning Fast': false,
        'GPT-5.2 No Reasoning': true,
        'GPT-5.2 No Reasoning Fast': false,
        'GPT-5.2 X-High Reasoning': false,
        'GPT-5.2 X-High Reasoning Fast': false,
        'GPT-5.2-Codex High': true,
        'GPT-5.2-Codex High Fast': false,
        'GPT-5.2-Codex Medium': true,
        'GPT-5.2-Codex Medium Fast': false,
        'GPT-5.2-Codex Low': true,
        'GPT-5.2-Codex Low Fast': false,
        'GPT-5.2-Codex XHigh': false,
        'GPT-5.2-Codex XHigh Fast': false,
        'GPT-OSS 120B (Medium)': false,
        'Grok Code Fast 1': true,
        'o3': false,
        'o3 (high reasoning)': false,
        'SWE-1': true,
        'SWE-1.5': true,
    };
    // --- End Config ---

    const normalizeText = (rawText) => (rawText ?? "").replace(/[\s\u00A0]+/g, ' ').trim().toLowerCase();

    const mvLog = (...args) => {
        if (!featureEnabled(Feature.ModelVisibility)) return;
        logFeature(Feature.ModelVisibility, LogLevel.Debug, '[ModelVisibility]', ...args);
    };

    const applyModelVisibilityFiltering = (container) => {
        if (!featureEnabled(Feature.ModelVisibility)) return;

        const spans = container.querySelectorAll('span.truncate');
        let hiddenCount = 0;
        let shownCount = 0;
        let configuredModelSpanCount = 0;
        let missingConfigCount = 0;

        mvLog('applyModelVisibilityFiltering: start', {
            containerTag: container?.tagName,
            containerClass: container?.className,
            spanCount: spans?.length ?? 0,
            configKeys: Object.keys(MODEL_VISIBILITY_CONFIG).length,
        });

        if (!spans || spans.length === 0) {
            mvLog('No spans matched selector "span.truncate" inside dropdown container. Filtering will be a no-op.', {
                containerSnippet: (container?.outerHTML ?? '').slice(0, 300),
            });
            mvLog('Full dropdown HTML (first 5000 chars):', (container?.outerHTML ?? '').slice(0, 5000));
            mvLog('All text content in dropdown:', container?.textContent?.slice(0, 2000));
        }

        const sampleTexts = [];

        spans.forEach(span => {
            const text = span.textContent?.trim();
            if (!featureEnabled('modelVisibility')) return;
            if (sampleTexts.length < 15 && text) sampleTexts.push(text);
            if (text && text in MODEL_VISIBILITY_CONFIG) {
                configuredModelSpanCount++;
                const shouldBeVisible = MODEL_VISIBILITY_CONFIG[text];
                const btn = span.closest('button[data-kb-navigate="true"]') || span.closest('button');
                if (btn) {
                    if (!shouldBeVisible && btn.style.display !== 'none') {
                        btn.style.display = 'none';
                        hiddenCount++;
                        mvLog('Hid model', { text });
                    } else if (shouldBeVisible && btn.style.display === 'none') {
                        btn.style.display = '';
                        shownCount++;
                        mvLog('Showed model', { text });
                    } else {
                        mvLog('No change for model', {
                            text,
                            shouldBeVisible,
                            currentDisplay: btn.style.display,
                        });
                    }
                }
            } else if (text) {
                missingConfigCount++;
            }
        });

        if (sampleTexts.length > 0) {
            mvLog('Model text sample (first 15)', sampleTexts);
        }

        mvLog('applyModelVisibilityFiltering: summary', {
            hiddenCount,
            shownCount,
            configuredModelSpanCount,
            missingConfigCount,
        });

        if (hiddenCount > 0 || shownCount > 0) {
            logFeature(Feature.ModelVisibility, LogLevel.Info, `Model visibility applied (hidden: ${hiddenCount}, shown: ${shownCount})`);
        }
    };

    const findLikelyModelDropdownContainer = (root) => {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) return null;

        // Prefer a descendant that actually contains model option rows.
        // Tooltips and other poppers also use the same wrapper selector.
        const candidates = [
            root,
            ...Array.from(root.querySelectorAll('div[data-radix-popper-content-wrapper], [role="dialog"].radix-popover-content')),
        ];

        for (const candidate of candidates) {
            const hasModelTextSpans = candidate.querySelectorAll('span.truncate').length > 0;
            const hasNavigableButtons = candidate.querySelectorAll('button[data-kb-navigate="true"]').length > 0;
            if (hasModelTextSpans || hasNavigableButtons) return candidate;
        }

        return null;
    };

    const setupModelDropdownObserver = () => {
        if (!featureEnabled(Feature.ModelVisibility)) return;

        const mv = window[STATE_KEY].modelVisibility;
        if (!mv) return;

        const dropdownSelectors = [
            'div[data-radix-popper-content-wrapper]',
            '[role="dialog"].radix-popover-content'
        ];

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    for (const selector of dropdownSelectors) {
                        const dropdown = node.matches?.(selector) ? node : node.querySelector?.(selector);
                        if (dropdown && !mv.currentDropdownContainer) {
                            const likelyDropdown = findLikelyModelDropdownContainer(dropdown);
                            if (!likelyDropdown) {
                                mvLog('Ignoring popper: does not appear to contain model options (likely tooltip).', {
                                    matchedSelector: selector,
                                    rootTag: dropdown?.tagName,
                                    rootClass: dropdown?.className,
                                    rootRole: dropdown?.getAttribute?.('role'),
                                    textPreview: (dropdown?.textContent ?? '').trim().slice(0, 120),
                                });
                                continue;
                            }

                            mv.currentDropdownContainer = likelyDropdown;
                            logFeature(Feature.ModelVisibility, LogLevel.Info, 'Model dropdown detected, applying no-flicker filtering');

                            mvLog('Dropdown detected', {
                                matchedSelector: selector,
                                dropdownTag: likelyDropdown?.tagName,
                                dropdownClass: likelyDropdown?.className,
                                dropdownRole: likelyDropdown?.getAttribute?.('role'),
                            });

                            const originalVisibility = likelyDropdown.style.visibility;
                            likelyDropdown.style.visibility = 'hidden';
                            mvLog('Dropdown visibility temporarily hidden', { originalVisibility });

                            requestAnimationFrame(() => {
                                mvLog('requestAnimationFrame: applying initial filter');
                                applyModelVisibilityFiltering(likelyDropdown);
                                likelyDropdown.style.visibility = originalVisibility;
                                mvLog('Dropdown visibility restored', { restoredVisibility: '' });

                                cleanupModelVisibilitySession();
                                mvLog('cleanupModelVisibilitySession completed; wiring content observer');

                                const contentObserver = new MutationObserver(() => {
                                    mvLog('contentObserver: mutation observed; re-applying filter');
                                    applyModelVisibilityFiltering(likelyDropdown);
                                });
                                contentObserver.observe(likelyDropdown, { childList: true, subtree: true });
                                mv.contentObserver = contentObserver;

                                const checkRemoval = setInterval(() => {
                                    if (!document.contains(likelyDropdown)) {
                                        cleanupModelVisibilitySession();
                                        mv.currentDropdownContainer = null;
                                        logFeature(Feature.ModelVisibility, LogLevel.Info, 'Model dropdown closed, observer disconnected');
                                        mvLog('Dropdown removed from DOM; session cleaned up');
                                    }
                                }, 500);
                                mv.removalCheckIntervalId = checkRemoval;
                            });

                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        mv.dropdownObserver = observer;
        logFeature(Feature.ModelVisibility, LogLevel.Info, 'Model dropdown observer initialized');
        mvLog('setupModelDropdownObserver complete', { dropdownSelectors });
    };

    const clickBtn = () => {
        if (Date.now() - lastClick < COOLDOWN_MS) {
            logFeature(Feature.Clicker, LogLevel.Debug, 'In cooldown.');
            return;
        }
        const Ctx = (SIDEBAR_SELECTOR ? document.querySelector(SIDEBAR_SELECTOR) : null) ?? document;
        if (SIDEBAR_SELECTOR && Ctx === document && !document.querySelector(SIDEBAR_SELECTOR)) logFeature(Feature.Clicker, LogLevel.Warn, `Sidebar "${SIDEBAR_SELECTOR}" not found.`);

        const allPotentialButtons = Array.from(Ctx.querySelectorAll(BTN_SELECTORS));
        if (allPotentialButtons.length === 0) {
            logFeature(Feature.Clicker, LogLevel.Debug, `No elements found with selector "${BTN_SELECTORS}".`);
        } else {
            logFeature(Feature.Clicker, LogLevel.Debug, `Found ${allPotentialButtons.length} potential buttons with selector "${BTN_SELECTORS}".`);
        }


        const evaluateButton = (btn) => {
            const normalizedText = normalizeText(btn.textContent);
            const collapsedText = normalizedText.replace(/\s+/g, '');
            const style = window.getComputedStyle(btn);
            const isActuallyVisible = !!(btn.offsetWidth || btn.offsetHeight || btn.getClientRects().length);
            const isNotHidden = style.visibility !== 'hidden';
            const isDisplayed = style.display !== 'none';
            const isOpaqueEnough = parseFloat(style.opacity) > 0;
            const isEnabled = !btn.disabled;

            const matchingTarget = BUTTON_TARGETS.find(target => {
                try {
                    return target.matches({ normalizedText, collapsedText, element: btn });
                } catch (err) {
                    logFeature(Feature.Clicker, LogLevel.Warn, `Matcher for target "${target.id}" threw`, err);
                    return false;
                }
            });

            if (!matchingTarget) return null;

            const isVisibleAndInteractive = isActuallyVisible && isNotHidden && isDisplayed && isOpaqueEnough && isEnabled;

            // If it matches text, log why it might not be considered clickable
            if (!isVisibleAndInteractive) {
                logFeature(Feature.Clicker, LogLevel.Debug, `Button "${btn.textContent?.trim()}" matched "${matchingTarget.id}", but was not fully visible/interactive. Details:`);
                if (!isActuallyVisible) logFeature(Feature.Clicker, LogLevel.Debug, `  - Not actually visible (offsetWidth/offsetHeight/getClientRects check failed)`);
                if (!isNotHidden) logFeature(Feature.Clicker, LogLevel.Debug, `  - Visibility was 'hidden'`);
                if (!isDisplayed) logFeature(Feature.Clicker, LogLevel.Debug, `  - Display was 'none'`);
                if (!isOpaqueEnough) logFeature(Feature.Clicker, LogLevel.Debug, `  - Opacity was not > 0 (Value: ${style.opacity})`);
                if (!isEnabled) logFeature(Feature.Clicker, LogLevel.Debug, `  - Button was disabled`);
            }

            return isVisibleAndInteractive ? { button: btn, target: matchingTarget } : null;
        };

        const btnMatch = allPotentialButtons
            .map(evaluateButton)
            .find(match => !!match);

        if (btnMatch) {
            logFeature(Feature.Clicker, LogLevel.Info, `Clicking [${btnMatch.target.id}] "${btnMatch.button.textContent.trim()}"`, btnMatch.button);
            btnMatch.button.click();
            lastClick = Date.now();
        } else {
            if (allPotentialButtons.length > 0) { // Only log this if we found some candidates but none passed all checks
                logFeature(Feature.Clicker, LogLevel.Debug, 'No suitable button to click this interval.');
            }
        }

        // Enable Auto Web Requests dropdown options (remove disabled class)
        if (!autoWebRequestsUnlocked && featureEnabled(Feature.AutoWebRequestsUnlock)) {
            const settingRows = document.querySelectorAll('.setting-row');
            for (const row of settingRows) {
                const label = row.querySelector('.setting-label span');
                if (label && label.textContent?.trim() === 'Auto Web Requests') {
                    const disabledOptions = row.querySelectorAll('.setting-dropdown-option.disabled');
                    if (disabledOptions.length > 0) {
                        disabledOptions.forEach(opt => opt.classList.remove('disabled'));
                        autoWebRequestsUnlocked = true;
                        logFeature(Feature.Settings, LogLevel.Info, 'Unlocked Auto Web Requests dropdown options.');
                    }
                    break;
                }
            }
        }

        // Enable Auto Execution dropdown options (remove disabled class)
        if (!autoExecutionUnlocked && featureEnabled(Feature.AutoExecutionUnlock)) {
            const settingRows = document.querySelectorAll('.setting-row');
            for (const row of settingRows) {
                const label = row.querySelector('.setting-label span');
                if (label && label.textContent?.trim() === 'Auto Execution') {
                    const disabledOptions = row.querySelectorAll('.setting-dropdown-option.disabled');
                    if (disabledOptions.length > 0) {
                        disabledOptions.forEach(opt => opt.classList.remove('disabled'));
                        autoExecutionUnlocked = true;
                        logFeature(Feature.Settings, LogLevel.Info, 'Unlocked Auto Execution dropdown options.');
                    }
                    break;
                }
            }
        }

    };

    window.stopWindsurfAutoPressContinue_v13_2 = () => {
        if (window[STATE_KEY].intervalId) {
            clearInterval(window[STATE_KEY].intervalId);
            window[STATE_KEY].intervalId = null;
            logFeature(Feature.Lifecycle, LogLevel.Info, 'Stopped.');
        } else {
            logFeature(Feature.Lifecycle, LogLevel.Info, 'Not running or already stopped.');
        }
        cleanupModelVisibilityAll();
    };

    if (featureEnabled(Feature.ModelVisibility)) {
        setupModelDropdownObserver();
    }
    window[STATE_KEY].intervalId = setInterval(clickBtn, CHECK_MS);
    logFeature(Feature.Lifecycle, LogLevel.Info, `Started (ID: ${window[STATE_KEY].intervalId}). Checks every ${CHECK_MS / 1000}s. To stop: window.stopWindsurfAutoPressContinue_v13_2()`);
    clickBtn(); // Initial check
})();