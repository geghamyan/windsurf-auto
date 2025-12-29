/**
 * Windsurf Auto Button Presser (based on v13.2 script from https://gist.github.com/steipete/799f4f7a6ed6e96a02a5539d4a03b5b7)
 *
 * What it does:
 *  - Periodically scans the Windsurf UI for specific action buttons.
 *  - Auto-clicks any matching, fully visible, and enabled buttons (no synthetic key presses).
 *  - Currently supports both the "Continue" button (text starts with "continue") and the "RunAlt+⏎" run button.
 *  - Can unlock disabled options in the "Auto Web Requests" and "Auto Execution" settings (see ENABLE_AUTO_WEB_REQUESTS / ENABLE_AUTO_EXECUTION).
 *  - Optionally hides/shows specific models in the model selector based on MODEL_VISIBILITY_CONFIG (toggled via ENABLE_MODEL_VISIBILITY).
 *
 * Configuration (see "// --- Config ---" below):
 *  - BUTTON_TARGETS / BTN_SELECTORS: define which buttons are considered for auto-click.
 *  - COOLDOWN_MS / CHECK_MS: control how often clicks are attempted and the cooldown between clicks.
 *  - ENABLE_AUTO_WEB_REQUESTS / ENABLE_AUTO_EXECUTION: control whether dropdown options are force-unlocked.
 *  - ENABLE_MODEL_VISIBILITY / MODEL_VISIBILITY_CONFIG: control which models are shown or hidden in the selector.
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
    const LOG_LEVEL = 'debug';
    const ENABLE_AUTO_WEB_REQUESTS = false; // Set to false to disable unlocking Auto Web Requests dropdown
    const ENABLE_AUTO_EXECUTION = false; // Set to false to disable unlocking Auto Execution dropdown
    const ENABLE_MODEL_VISIBILITY = true; // Set to false to disable model visibility filtering
    const DEBUG_MODEL_VISIBILITY = true; // Set to true to log detailed model dropdown + filtering diagnostics

    const LOG_LEVELS = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        trace: 4,
    };

    const log = (level, ...args) => {
        const current = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;
        const target = LOG_LEVELS[level] ?? LOG_LEVELS.info;
        if (target > current) return;

        const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[method](`${SCRIPT_NAME}:`, ...args);
    };

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
        'Gemini 3 Pro High': false,
        'Gemini 3 Pro Low': false,
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
        'GPT-5.2 High Reasoning Fast': true,
        'GPT-5.2 Medium Reasoning': true,
        'GPT-5.2 Medium Reasoning Fast': true,
        'GPT-5.2 Low Reasoning': true,
        'GPT-5.2 Low Reasoning Fast': true,
        'GPT-5.2 No Reasoning': true,
        'GPT-5.2 No Reasoning Fast': true,
        'GPT-5.2 X-High Reasoning': false,
        'GPT-5.2 X-High Reasoning Fast': false,
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
        if (!ENABLE_MODEL_VISIBILITY || !DEBUG_MODEL_VISIBILITY) return;
        log('debug', '[ModelVisibility]', ...args);
    };

    const applyModelVisibilityFiltering = (container) => {
        if (!ENABLE_MODEL_VISIBILITY) return;

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
            if (DEBUG_MODEL_VISIBILITY && sampleTexts.length < 15 && text) sampleTexts.push(text);
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

        if (DEBUG_MODEL_VISIBILITY && sampleTexts.length > 0) {
            mvLog('Model text sample (first 15)', sampleTexts);
        }

        mvLog('applyModelVisibilityFiltering: summary', {
            hiddenCount,
            shownCount,
            configuredModelSpanCount,
            missingConfigCount,
        });

        if (hiddenCount > 0 || shownCount > 0) {
            log('info', `Model visibility applied (hidden: ${hiddenCount}, shown: ${shownCount})`);
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
        if (!ENABLE_MODEL_VISIBILITY) return;

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
                            log('info', 'Model dropdown detected, applying no-flicker filtering');

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
                                        log('info', 'Model dropdown closed, observer disconnected');
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
        log('info', 'Model dropdown observer initialized');
        mvLog('setupModelDropdownObserver complete', { dropdownSelectors });
    };

    const clickBtn = () => {
        if (Date.now() - lastClick < COOLDOWN_MS) {
            log('debug', `${SCRIPT_NAME}: In cooldown.`);
            return;
        }
        const Ctx = (SIDEBAR_SELECTOR ? document.querySelector(SIDEBAR_SELECTOR) : null) ?? document;
        if (SIDEBAR_SELECTOR && Ctx === document && !document.querySelector(SIDEBAR_SELECTOR)) log('warn', `${SCRIPT_NAME}: Sidebar "${SIDEBAR_SELECTOR}" not found.`);

        const allPotentialButtons = Array.from(Ctx.querySelectorAll(BTN_SELECTORS));
        if (allPotentialButtons.length === 0) {
            log('debug', `${SCRIPT_NAME}: No elements found with selector "${BTN_SELECTORS}".`);
        } else {
            log('debug', `${SCRIPT_NAME}: Found ${allPotentialButtons.length} potential buttons with selector "${BTN_SELECTORS}".`);
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
                    log('warn', `Matcher for target "${target.id}" threw`, err);
                    return false;
                }
            });

            if (!matchingTarget) return null;

            const isVisibleAndInteractive = isActuallyVisible && isNotHidden && isDisplayed && isOpaqueEnough && isEnabled;

            // If it matches text, log why it might not be considered clickable
            if (!isVisibleAndInteractive) {
                log('debug', `Button "${btn.textContent?.trim()}" matched "${matchingTarget.id}", but was not fully visible/interactive. Details:`);
                if (!isActuallyVisible) log('debug', `  - Not actually visible (offsetWidth/offsetHeight/getClientRects check failed)`);
                if (!isNotHidden) log('debug', `  - Visibility was 'hidden'`);
                if (!isDisplayed) log('debug', `  - Display was 'none'`);
                if (!isOpaqueEnough) log('debug', `  - Opacity was not > 0 (Value: ${style.opacity})`);
                if (!isEnabled) log('debug', `  - Button was disabled`);
            }

            return isVisibleAndInteractive ? { button: btn, target: matchingTarget } : null;
        };

        const btnMatch = allPotentialButtons
            .map(evaluateButton)
            .find(match => !!match);

        if (btnMatch) {
            log('info', `Clicking [${btnMatch.target.id}] "${btnMatch.button.textContent.trim()}"`, btnMatch.button);
            btnMatch.button.click();
            lastClick = Date.now();
        } else {
            if (allPotentialButtons.length > 0) { // Only log this if we found some candidates but none passed all checks
                log('debug', `${SCRIPT_NAME}: No suitable button to click this interval.`);
            }
        }

        // Enable Auto Web Requests dropdown options (remove disabled class)
        if (!autoWebRequestsUnlocked && ENABLE_AUTO_WEB_REQUESTS) {
            const settingRows = document.querySelectorAll('.setting-row');
            for (const row of settingRows) {
                const label = row.querySelector('.setting-label span');
                if (label && label.textContent?.trim() === 'Auto Web Requests') {
                    const disabledOptions = row.querySelectorAll('.setting-dropdown-option.disabled');
                    if (disabledOptions.length > 0) {
                        disabledOptions.forEach(opt => opt.classList.remove('disabled'));
                        autoWebRequestsUnlocked = true;
                        log('info', 'Unlocked Auto Web Requests dropdown options.');
                    }
                    break;
                }
            }
        }

        // Enable Auto Execution dropdown options (remove disabled class)
        if (!autoExecutionUnlocked && ENABLE_AUTO_EXECUTION) {
            const settingRows = document.querySelectorAll('.setting-row');
            for (const row of settingRows) {
                const label = row.querySelector('.setting-label span');
                if (label && label.textContent?.trim() === 'Auto Execution') {
                    const disabledOptions = row.querySelectorAll('.setting-dropdown-option.disabled');
                    if (disabledOptions.length > 0) {
                        disabledOptions.forEach(opt => opt.classList.remove('disabled'));
                        autoExecutionUnlocked = true;
                        log('info', 'Unlocked Auto Execution dropdown options.');
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
            log('info', 'Stopped.');
        } else {
            log('info', 'Not running or already stopped.');
        }
        cleanupModelVisibilityAll();
    };

    if (ENABLE_MODEL_VISIBILITY) {
        setupModelDropdownObserver();
    }
    window[STATE_KEY].intervalId = setInterval(clickBtn, CHECK_MS);
    log('info', `Started (ID: ${window[STATE_KEY].intervalId}). Checks every ${CHECK_MS/1000}s. To stop: window.stopWindsurfAutoPressContinue_v13_2()`);
    clickBtn(); // Initial check
})();