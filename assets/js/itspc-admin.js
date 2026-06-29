/**
 * Sekkei - Admin Page Scripts
 *
 * Handles tab switching, accordion, and cache reset on the admin settings page.
 * Strings are localized via itspcAdminData (wp_localize_script).
 *
 * @package Sekkei
 */
/* global itspcAdminData */

( function () {
    'use strict';

    document.addEventListener( 'DOMContentLoaded', function () {

        // --- Tab Switching ---
        var tabs     = document.querySelectorAll( '.itspc-tab-btn' );
        var contents = document.querySelectorAll( '.itspc-tab-content' );

        tabs.forEach( function ( tab ) {
            tab.addEventListener( 'click', function () {
                var target = this.getAttribute( 'data-tab' );

                tabs.forEach( function ( t ) { t.classList.remove( 'active' ); } );
                contents.forEach( function ( c ) { c.classList.remove( 'active' ); } );

                this.classList.add( 'active' );
                var targetEl = document.getElementById( 'itspc-tab-' + target );
                if ( targetEl ) {
                    targetEl.classList.add( 'active' );
                }
            } );
        } );

        // --- Reset Browser Cache ---
        var resetBtn = document.getElementById( 'itspc-reset-cache-btn' );
        if ( resetBtn ) {
            resetBtn.addEventListener( 'click', function () {
                var confirmMsg = ( typeof itspcAdminData !== 'undefined' && itspcAdminData.confirmReset )
                    ? itspcAdminData.confirmReset
                    : 'Are you sure you want to reset all Sekkei tool data? This will permanently delete all planner structures, palettes, and checklists from this browser.';

                if ( confirm( confirmMsg ) ) {
                    Object.keys( localStorage ).forEach( function ( key ) {
                        if ( key.indexOf( 'itspc_' ) === 0 ) {
                            localStorage.removeItem( key );
                        }
                    } );

                    var successMsg = ( typeof itspcAdminData !== 'undefined' && itspcAdminData.resetSuccess )
                        ? itspcAdminData.resetSuccess
                        : 'All browser cached data for Sekkei has been successfully cleared.';

                    alert( successMsg );
                    location.reload();
                }
            } );
        }

        // --- FAQ Accordion ---
        document.querySelectorAll( '.itspc-accordion-btn' ).forEach( function ( btn ) {
            btn.addEventListener( 'click', function () {
                var body   = this.nextElementSibling;
                var isOpen = this.classList.contains( 'open' );

                // Close all first
                document.querySelectorAll( '.itspc-accordion-btn' ).forEach( function ( b ) {
                    b.classList.remove( 'open' );
                    if ( b.nextElementSibling ) {
                        b.nextElementSibling.classList.remove( 'open' );
                    }
                } );

                // Open clicked item if it was closed
                if ( ! isOpen ) {
                    this.classList.add( 'open' );
                    if ( body ) {
                        body.classList.add( 'open' );
                    }
                }
            } );
        } );

        // --- Panel Width Slider logic ---
        var panelWidthNum = document.getElementById( 'panel_width' );
        var panelWidthRange = document.getElementById( 'panel_width_range' );
        var panelWidthVal = document.getElementById( 'panel_width_val' );

        function syncPanelWidth( val, clamp ) {
            var numericVal = parseInt( val, 10 );
            if ( isNaN( numericVal ) ) {
                if ( clamp ) {
                    numericVal = 500; // default/fallback on blur
                } else {
                    return; // ignore invalid inputs during typing
                }
            }

            if ( clamp ) {
                if ( numericVal < 380 ) {
                    numericVal = 380;
                }
                if ( numericVal > 680 ) {
                    numericVal = 680;
                }
                panelWidthNum.value = numericVal;
            }

            panelWidthRange.value = numericVal;
            panelWidthVal.textContent = numericVal + 'px';
        }

        if ( panelWidthNum && panelWidthRange && panelWidthVal ) {
            // Initialize from loaded value (clamped)
            syncPanelWidth( panelWidthNum.value, true );

            // Range -> Number + Readout
            panelWidthRange.addEventListener( 'input', function () {
                syncPanelWidth( this.value, false );
                panelWidthNum.value = this.value;
            } );

            // Number -> Range + Readout (No clamp during typing)
            panelWidthNum.addEventListener( 'input', function () {
                syncPanelWidth( this.value, false );
            } );

            // Number Blur -> Clamp + Sync
            panelWidthNum.addEventListener( 'blur', function () {
                syncPanelWidth( this.value, true );
            } );
        }

        // --- Conditional Fields for Welcome Widget ---
        var enableWidgetCheck = document.getElementById( 'show_welcome_widget' );
        var whitelabelFields = document.getElementById( 'itspc-whitelabel-fields' );

        function toggleWhitelabelFields() {
            if ( ! enableWidgetCheck || ! whitelabelFields ) {
                return;
            }
            var isChecked = enableWidgetCheck.checked;
            var inputs = whitelabelFields.querySelectorAll( 'input, textarea' );

            if ( isChecked ) {
                whitelabelFields.classList.remove( 'itspc-disabled' );
                inputs.forEach( function ( input ) {
                    input.disabled = false;
                } );
            } else {
                whitelabelFields.classList.add( 'itspc-disabled' );
                inputs.forEach( function ( input ) {
                    input.disabled = true;
                } );
            }
        }

        if ( enableWidgetCheck && whitelabelFields ) {
            // Initialize state
            toggleWhitelabelFields();

            // Bind change event
            enableWidgetCheck.addEventListener( 'change', toggleWhitelabelFields );
        }

        // --- Live Preview Update Logic ---
        var widgetAgency = document.getElementById( 'welcome_widget_agency' );
        var widgetLogo = document.getElementById( 'welcome_widget_logo' );
        var widgetMsg = document.getElementById( 'welcome_widget_msg' );
        var widgetVideo = document.getElementById( 'welcome_widget_video' );
        var widgetEmail = document.getElementById( 'welcome_widget_email' );

        var previewAgency = document.getElementById( 'itspc-preview-agency' );
        var previewLogo = document.getElementById( 'itspc-preview-logo' );
        var previewMsg = document.getElementById( 'itspc-preview-msg' );
        var previewEmail = document.getElementById( 'itspc-preview-email' );
        var previewVideoWrap = document.getElementById( 'itspc-preview-video-wrap' );
        var previewVideoLink = document.getElementById( 'itspc-preview-video-link' );

        function updateWidgetPreview() {
            // Logo Image
            if ( previewLogo ) {
                var logoUrl = widgetLogo ? widgetLogo.value.trim() : '';
                if ( logoUrl ) {
                    previewLogo.src = logoUrl;
                    previewLogo.style.display = 'block';
                } else {
                    previewLogo.style.display = 'none';
                    previewLogo.src = '';
                }
            }

            // Agency Name
            if ( previewAgency ) {
                var agencyVal = widgetAgency ? widgetAgency.value.trim() : '';
                previewAgency.textContent = agencyVal || 'Your Agency';
            }

            // Welcome message (newlines rendered via pre-wrap CSS)
            if ( previewMsg ) {
                var msgVal = widgetMsg ? widgetMsg.value.trim() : '';
                if ( msgVal === '' ) {
                    previewMsg.textContent = 'Your welcome message to clients will appear here.';
                    previewMsg.classList.add( 'itspc-preview-empty' );
                } else {
                    previewMsg.textContent = widgetMsg ? widgetMsg.value : '';
                    previewMsg.classList.remove( 'itspc-preview-empty' );
                }
            }

            // Footer and Email Visibility Logic
            var emailVal = widgetEmail ? widgetEmail.value.trim() : '';
            var videoVal = widgetVideo ? widgetVideo.value.trim() : '';
            var previewFooter = document.getElementById( 'itspc-preview-footer' );
            var footerLeft = document.querySelector( '.itspc-preview-footer-left' );

            if ( ! emailVal && ! videoVal ) {
                if ( previewFooter ) {
                    previewFooter.style.display = 'none';
                }
            } else {
                if ( previewFooter ) {
                    previewFooter.style.display = 'flex';
                }

                // Show/hide email support row
                if ( emailVal ) {
                    if ( footerLeft ) {
                        footerLeft.style.display = 'flex';
                    }
                    if ( previewEmail ) {
                        previewEmail.textContent = emailVal;
                    }
                } else {
                    if ( footerLeft ) {
                        footerLeft.style.display = 'none';
                    }
                }

                // Show/hide video wrap
                if ( videoVal ) {
                    if ( previewVideoLink ) {
                        previewVideoLink.href = videoVal;
                    }
                    if ( previewVideoWrap ) {
                        previewVideoWrap.style.display = 'inline-block';
                    }
                } else {
                    if ( previewVideoWrap ) {
                        previewVideoWrap.style.display = 'none';
                    }
                    if ( previewVideoLink ) {
                        previewVideoLink.href = '#';
                    }
                }
            }
        }

        // Hide broken image logo links gracefully
        if ( previewLogo ) {
            previewLogo.addEventListener( 'error', function () {
                this.style.display = 'none';
            } );
        }

        var wlInputs = [ widgetAgency, widgetLogo, widgetMsg, widgetVideo, widgetEmail ];
        wlInputs.forEach( function ( inputEl ) {
            if ( inputEl ) {
                inputEl.addEventListener( 'input', updateWidgetPreview );
            }
        } );

        // Initial preview render
        updateWidgetPreview();

        // --- Interactive Documentation Feature Explorer ---
        var featureCards = document.querySelectorAll( '.itspc-feature-card' );
        var detailPanel = document.getElementById( 'itspc-feature-detail-panel' );

        var featureData = {
            planner: {
                title: "Section Planner ",
                what: "Helps you plan the page layout and design structure of your sections. Includes drag-and-drop section reordering, category badges, and custom CSS class assignment.",
                how: [
                    "Open any page in the Elementor editor and launch the Sekkei panel.",
                    "Click 'Add Section', name your section, and select a category badge (e.g. Hero, CTA, Features).",
                    "Drag and drop sections to rearrange them in the planner list.",
                    "Once finalized, click 'Sync to Elementor' or 'Audit' to verify and match layout sections."
                ],
                tip: "Use short, semantic custom CSS classes (like `.hero-section` or `.cta-banner`) for easy styling later."
            },
            checklist: {
                title: "Design Checklist ",
                what: "Helps you review over 30 pre-handover checkpoints across 5 categories (SEO, Performance, Responsive, Links audit) before client handover.",
                how: [
                    "Navigate to the Checklist tab inside the tool and review each category group.",
                    "Mark off tasks as you complete them.",
                    "Create custom checklist groups and items tailored to your specific project needs."
                ],
                tip: "Create different checklist templates for E-commerce vs. Portfolio sites to ensure no critical task is missed during handover."
            },
            palette: {
                title: "Color Palette ",
                what: "Manage and store your project's brand colors (Primary, Secondary, Accent, BG) in one centralized location.",
                how: [
                    "Set your project brand hex codes inside the Color Palette tab.",
                    "While styling in Elementor, click on any color swatch inside the panel to instantly copy its HEX code to your clipboard."
                ],
                tip: "Name your swatches matching your CSS variable names to copy variables directly to your stylesheet."
            },
            fonts: {
                title: "Font Pairing ",
                what: "Provides previews and one-click enqueuing for 10 curated professional font combinations (including optimized pairs for English & Bengali).",
                how: [
                    "Go to the Font Pairs section to preview the curated typography combinations.",
                    "Copy the Google Fonts `<link>` tag or CSS rules in a single click to use in your stylesheet."
                ],
                tip: "Maintain a proper font size and line-height hierarchy between headings and body text to maximize readability."
            },
            css: {
                title: "CSS Generator ",
                what: "Generate clean, customizable CSS snippets for buttons, sections, typography, containers, cards, and responsive layouts.",
                how: [
                    "Select a layout preset in the CSS Generator tab (e.g. Button hover style).",
                    "Adjust parameters to customize the output and copy the generated CSS rules."
                ],
                tip: "Paste the copied CSS directly inside Elementor's Custom CSS field or your child theme's `style.css` file."
            },
            notes: {
                title: "Project Notes ",
                what: "Keep client feedback, revision logs, and TODO checklists directly inside the Elementor editor workspace.",
                how: [
                    "Use the Notes tab to write down client requirements, revisions, or task lists.",
                    "Quickly insert tags like `[Feedback]` or `[Todo]` and use date stamps to keep logs organized."
                ],
                tip: "Insert a date stamp (`Ctrl+D` shortcut or the date tag button) at the start of each client feedback session to log revisions chronologically."
            },
            audit: {
                title: "Pre-Publish Audit ",
                what: "Automatically scans the Elementor builder preview canvas for content and structural layout issues, accessibility warnings, and SEO metadata gaps.",
                how: [
                    "Open the Pre-Publish Audit tab inside the Sekkei tool panel.",
                    "Click 'Run Scan' to scan the active Elementor document canvas.",
                    "Review issues classified by severity (Critical link failures, color contrast accessibility warnings, heading level skips, oversized image alerts, or missing meta titles/descriptions).",
                    "Click 'Locate' on any issue to automatically scroll to and highlight the element in your canvas, or click 'Export Report' to download a text report for client handoff."
                ],
                tip: "Run a full scan right before scheduling client walkthroughs or launching live websites to verify all components are fully polished."
            }
        };

        function showFeatureDetails( key ) {
            if ( ! detailPanel || ! featureData[key] ) {
                return;
            }
            var data = featureData[key];

            // Build structural steps list safely
            var stepsHtml = '';
            if ( data.how && data.how.length > 0 ) {
                stepsHtml = '<ol class="itspc-feature-detail-steps">';
                data.how.forEach( function ( step ) {
                    var li = document.createElement( 'li' );
                    li.textContent = step;
                    stepsHtml += '<li>' + li.innerHTML + '</li>';
                } );
                stepsHtml += '</ol>';
            }

            // Safe HTML generation using native elements
            detailPanel.innerHTML = '';

            var titleEl = document.createElement( 'div' );
            titleEl.className = 'itspc-feature-detail-title';
            titleEl.textContent = data.title;

            var descSection = document.createElement( 'div' );
            descSection.className = 'itspc-feature-detail-section';
            var descTitle = document.createElement( 'div' );
            descTitle.className = 'itspc-feature-detail-section-title';
            descTitle.textContent = 'What it does';
            var descBody = document.createElement( 'div' );
            descBody.className = 'itspc-feature-detail-desc';
            descBody.textContent = data.what;
            descSection.appendChild( descTitle );
            descSection.appendChild( descBody );

            var stepsSection = document.createElement( 'div' );
            stepsSection.className = 'itspc-feature-detail-section';
            var stepsTitle = document.createElement( 'div' );
            stepsTitle.className = 'itspc-feature-detail-section-title';
            stepsTitle.textContent = 'How to use';
            var stepsBody = document.createElement( 'div' );
            stepsBody.innerHTML = stepsHtml;
            stepsSection.appendChild( stepsTitle );
            stepsSection.appendChild( stepsBody );

            var tipBox = document.createElement( 'div' );
            tipBox.className = 'itspc-feature-detail-tip-box';
            tipBox.textContent = ' Pro Tip: ' + data.tip;

            detailPanel.appendChild( titleEl );
            detailPanel.appendChild( descSection );
            detailPanel.appendChild( stepsSection );
            detailPanel.appendChild( tipBox );

            // Trigger animation repaint
            detailPanel.style.animation = 'none';
            detailPanel.offsetHeight; // trigger reflow
            detailPanel.style.animation = null;
        }

        if ( featureCards.length > 0 && detailPanel ) {
            featureCards.forEach( function ( card ) {
                card.addEventListener( 'click', function () {
                    featureCards.forEach( function ( c ) { c.classList.remove( 'active' ); } );
                    this.classList.add( 'active' );
                    var featureKey = this.getAttribute( 'data-feature' );
                    showFeatureDetails( featureKey );
                } );
            } );

            // Load default (planner) details
            showFeatureDetails( 'planner' );
        }

    } );

} )();
