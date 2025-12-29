This is the old way of filtering models.

        // Control model visibility based on MODEL_VISIBILITY_CONFIG
        if (ENABLE_MODEL_VISIBILITY) {
            document.querySelectorAll('span.truncate').forEach(span => {
                const text = span.textContent?.trim();
                if (text && text in MODEL_VISIBILITY_CONFIG) {
                    const shouldBeVisible = MODEL_VISIBILITY_CONFIG[text];
                    const btn = span.closest('button[data-kb-navigate="true"]') || span.closest('button');
                    if (btn) {
                        if (!shouldBeVisible && btn.style.display !== 'none') {
                            btn.style.display = 'none';
                            console.log(`${SCRIPT_NAME}: Hid model "${text}"`);
                        } else if (shouldBeVisible && btn.style.display === 'none') {
                            btn.style.display = '';
                            console.log(`${SCRIPT_NAME}: Showed model "${text}"`);
                        }
                    }
                }
            });
        }
