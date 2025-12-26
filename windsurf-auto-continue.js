/**
 * Windsurf Auto Button Presser (based on v13.2 script from https://gist.github.com/steipete/799f4f7a6ed6e96a02a5539d4a03b5b7)
 *
 * What it does:
 *  - Periodically scans the Windsurf UI for specific action buttons.
 *  - Auto-clicks any matching, fully visible, and enabled buttons (no synthetic key presses).
 *  - Currently supports both the “Continue” button (text starts with “continue”) and the “RunAlt+⏎” button shown in the screenshot.
 *  - Hides specified models from the model selector dropdown (configured via HIDDEN_MODELS array).
 *
 * How to extend it:
 *  - Add entries to BUTTON_TARGETS below; each entry defines how to detect a new button via the predicate.
 *  - Add model names to HIDDEN_MODELS to hide them from the model selector.
 *  - Keep selectors consistent unless Windsurf UI changes (BTN_SELECTORS).
 *  - Make sure to reuse/adjust the visibility checks in `evaluateButton` if new UI widgets behave differently.
 */
//
(() => {
    const SCRIPT_NAME = 'Windsurf Auto Button Presser';
    let intervalId = null, lastClick = 0;
    let autoWebRequestsUnlocked = false;
    let autoExecutionUnlocked = false;

    // --- Config ---
    const ENABLE_AUTO_WEB_REQUESTS = false; // Set to false to disable unlocking Auto Web Requests dropdown
    const ENABLE_AUTO_EXECUTION = false; // Set to false to disable unlocking Auto Execution dropdown

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
    const HIDDEN_MODELS = [
        'Claude Opus 4.1 (Thinking)',
        'Claude Sonnet 4.5 (1M)',
    ];
    // --- End Config ---

    const normalizeText = (rawText) => (rawText ?? "").replace(/[\s\u00A0]+/g, ' ').trim().toLowerCase();

    const clickBtn = () => {
        if (Date.now() - lastClick < COOLDOWN_MS) {
            // console.log(`${SCRIPT_NAME}: In cooldown.`); // Optional: very verbose
            return;
        }
        const Ctx = (SIDEBAR_SELECTOR ? document.querySelector(SIDEBAR_SELECTOR) : null) ?? document;
        if (SIDEBAR_SELECTOR && Ctx === document && !document.querySelector(SIDEBAR_SELECTOR)) console.log(`${SCRIPT_NAME}: Sidebar "${SIDEBAR_SELECTOR}" not found.`);

        const allPotentialButtons = Array.from(Ctx.querySelectorAll(BTN_SELECTORS));
        if (allPotentialButtons.length === 0) {
            // console.log(`${SCRIPT_NAME}: No elements found with selector "${BTN_SELECTORS}".`); // Optional: can be verbose if it runs often
        } else {
            // console.log(`${SCRIPT_NAME}: Found ${allPotentialButtons.length} potential buttons with selector "${BTN_SELECTORS}".`); // Optional: can be verbose
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
                    console.warn(`${SCRIPT_NAME}: Matcher for target "${target.id}" threw`, err);
                    return false;
                }
            });

            if (!matchingTarget) return null;

            const isVisibleAndInteractive = isActuallyVisible && isNotHidden && isDisplayed && isOpaqueEnough && isEnabled;

            // If it matches text, log why it might not be considered clickable
            if (!isVisibleAndInteractive) {
                console.log(`${SCRIPT_NAME}: Button "${btn.textContent?.trim()}" matched "${matchingTarget.id}", but was not fully visible/interactive. Details:`);
                if (!isActuallyVisible) console.log(`  - Not actually visible (offsetWidth/offsetHeight/getClientRects check failed)`);
                if (!isNotHidden) console.log(`  - Visibility was 'hidden'`);
                if (!isDisplayed) console.log(`  - Display was 'none'`);
                if (!isOpaqueEnough) console.log(`  - Opacity was not > 0 (Value: ${style.opacity})`);
                if (!isEnabled) console.log(`  - Button was disabled`);
            }

            return isVisibleAndInteractive ? { button: btn, target: matchingTarget } : null;
        };

        const btnMatch = allPotentialButtons
            .map(evaluateButton)
            .find(match => !!match);

        if (btnMatch) {
            console.log(`${SCRIPT_NAME}: Clicking [${btnMatch.target.id}] "${btnMatch.button.textContent.trim()}"`, btnMatch.button);
            btnMatch.button.click();
            lastClick = Date.now();
        } else {
            if (allPotentialButtons.length > 0) { // Only log this if we found some candidates but none passed all checks
                 // console.log(`${SCRIPT_NAME}: No suitable button to click this interval.`); // Optional: can be verbose
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
                        console.log(`${SCRIPT_NAME}: Unlocked Auto Web Requests dropdown options.`);
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
                        console.log(`${SCRIPT_NAME}: Unlocked Auto Execution dropdown options.`);
                    }
                    break;
                }
            }
        }

        // Hide models from the model selector
        if (HIDDEN_MODELS.length > 0) {
            document.querySelectorAll('p').forEach(p => {
                const text = p.textContent?.trim();
                if (text && HIDDEN_MODELS.includes(text)) {
                    const btn = p.closest('button[data-kb-navigate="true"]') || p.closest('button');
                    if (btn && btn.style.display !== 'none') {
                        btn.style.display = 'none';
                        console.log(`${SCRIPT_NAME}: Hid model "${text}"`);
                    }
                }
            });
        }
    };

    window.stopWindsurfAutoPressContinue_v13_2 = () => {
        if (intervalId) {
            clearInterval(intervalId);
            console.log(`${SCRIPT_NAME}: Stopped (ID: ${intervalId}).`);
            intervalId = null;
        } else {
            console.log(`${SCRIPT_NAME}: Not running or already stopped.`);
        }
    };

    if (window.stopWindsurfAutoPressContinue_v13_2.intervalId) { // Check for a globally stored ID from a previous run
        clearInterval(window.stopWindsurfAutoPressContinue_v13_2.intervalId);
        console.log(`${SCRIPT_NAME}: Cleared pre-existing interval.`);
    }

    intervalId = setInterval(clickBtn, CHECK_MS);
    window.stopWindsurfAutoPressContinue_v13_2.intervalId = intervalId; // Store globally for easier clearing if script is re-run
    console.log(`${SCRIPT_NAME}: Started (ID: ${intervalId}). Checks every ${CHECK_MS/1000}s. To stop: window.stopWindsurfAutoPressContinue_v13_2()`);
    clickBtn(); // Initial check
})();