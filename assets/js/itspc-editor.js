/**
 * PageCraft — Elementor Editor Integration
 *
 * Injects floating button and sliding iframe panel into the Elementor editor.
 * Uses localized `itspcData` object from PHP.
 *
 * @package PageCraft
 */
(function() {
    'use strict';

    function initPageCraft() {
        var btn       = document.getElementById('itspc-toggle-btn');
        var panel     = document.getElementById('itspc-panel');
        var iframe    = document.getElementById('itspc-panel-iframe');
        var closeBtn  = document.getElementById('itspc-panel-close');
        var popoutBtn = document.getElementById('itspc-panel-popout');
        var resizer   = document.getElementById('itspc-panel-resizer');
        var isOpen    = false;

        // Custom lightning bolt SVG icon
        var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:5px;margin-top:-2px;"><path d="M13 10h7l-9 13v-9H5l9-13v9z"/></svg>';

        // Bail if HTML not injected
        if (!btn || !panel) {
            return;
        }

        var btnText = btn.querySelector('.itspc-btn-text');

        // Set initial SVG icon on load
        btnText.innerHTML = ICON_SVG + ' PageCraft';

        // --- Toggle Panel ---
        // Inject loading bar once into the panel header
        var loadingBar = document.createElement('div');
        loadingBar.id = 'itspc-loading-bar';
        loadingBar.style.cssText = 'position:absolute;bottom:0;left:0;height:2px;width:0%;background:#C8FF00;transition:width 0.3s ease,opacity 0.4s ease;opacity:1;z-index:10;';
        var panelHeader = document.querySelector('.itspc-panel-header');
        if (panelHeader) {
            panelHeader.style.position = 'relative';
            panelHeader.appendChild(loadingBar);
        }

        // Wire iframe load event to finish the loading bar
        iframe.addEventListener('load', function() {
            loadingBar.style.width = '100%';
            setTimeout(function() {
                loadingBar.style.opacity = '0';
            }, 400);
        });

        function openPanel() {
            // Lazy-load iframe: only set src on first open
            if ((!iframe.getAttribute('src') || iframe.getAttribute('src') === '') && typeof itspcData !== 'undefined') {
                // Show loading bar
                loadingBar.style.width = '0%';
                loadingBar.style.opacity = '1';
                // Animate to 60% immediately as a visual hint while iframe loads
                setTimeout(function() {
                    loadingBar.style.width = '60%';
                }, 50);
                iframe.setAttribute('src', itspcData.toolUrl);
            }

            // Inject current page name as a subtitle pill in the header
            var pageTitle = '';
            if (typeof elementor !== 'undefined' && elementor.documents) {
                var doc = elementor.documents.getCurrent();
                if (doc && doc.config && doc.config.post_title) {
                    pageTitle = doc.config.post_title;
                }
            }
            if (pageTitle) {
                var pageNameEl = document.getElementById('itspc-page-name');
                if (!pageNameEl) {
                    var titleEl = document.querySelector('.itspc-panel-title');
                    if (titleEl) {
                        var span = document.createElement('span');
                        span.id = 'itspc-page-name';
                        span.title = pageTitle;
                        span.textContent = pageTitle;
                        titleEl.parentNode.insertBefore(span, titleEl.nextSibling);
                    }
                } else {
                    pageNameEl.textContent = pageTitle;
                    pageNameEl.title = pageTitle;
                }
            }

            panel.classList.add('itspc-panel-open');
            panel.classList.remove('itspc-panel-closed');
            btn.classList.add('itspc-btn-active');
            btnText.innerHTML = ICON_SVG + ' Close';
            document.body.classList.add('itspc-is-open');
            isOpen = true;
        }

        function closePanel() {
            panel.classList.remove('itspc-panel-open');
            panel.classList.add('itspc-panel-closed');
            btn.classList.remove('itspc-btn-active');
            btnText.innerHTML = ICON_SVG + ' PageCraft';
            document.body.classList.remove('itspc-is-open');
            isOpen = false;
        }

        function togglePanel() {
            if (isOpen) {
                closePanel();
            } else {
                openPanel();
            }
        }

        // --- Event Handlers ---
        btn.addEventListener('click', togglePanel);
        closeBtn.addEventListener('click', closePanel);

        popoutBtn.addEventListener('click', function() {
            if (typeof itspcData !== 'undefined') {
                window.open(itspcData.toolUrl, '_blank', 'width=1200,height=800');
            }
        });

        // Keyboard shortcuts: Ctrl+Shift+P to toggle, Escape to close
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
                e.preventDefault();
                e.stopPropagation();
                togglePanel();
            } else if (e.key === 'Escape' && isOpen) {
                closePanel();
            }
        });



        // --- Listen for rename requests from PageCraft iframe ---
        window.addEventListener('message', function(e) {
            var data = e.data;
            if (!data) return;

            if (data.type === 'rename_elementor_element') {
                if (typeof elementor !== 'undefined' && elementor.documents) {
                    var doc = elementor.documents.getCurrent();
                    if (doc && doc.container) {
                        var container = doc.container.children.filter(function(child) {
                            return child.model.cid === data.cid || child.model.get('id') === data.id;
                        })[0];
                        
                        if (container) {
                            if (typeof $e !== 'undefined') {
                                $e.run('document/elements/settings', {
                                    container: container,
                                    settings: {
                                        _title: data.title
                                    }
                                });
                            } else {
                                container.model.setSetting('_title', data.title);
                            }
                        }
                    }
                }
            }

            // Sync Colors to Elementor Globals
            if (data.type === 'itspc_sync_colors' && data.colors) {
                if (typeof elementor !== 'undefined' && elementor.documents) {
                    var kitId = elementor.config.active_kit_id;
                    var kit = elementor.documents.get(kitId);
                    if (kit) {
                        var systemColors = [];
                        var customColors = [];
                        var systemRoles = ['primary', 'secondary', 'text', 'accent'];
                        
                        var defaults = {
                            primary: '#6EC1E4',
                            secondary: '#54595F',
                            text: '#7A7A7A',
                            accent: '#61CE70'
                        };
                        
                        var roleMap = {};
                        data.colors.forEach(function(c) {
                            if (c.role && systemRoles.indexOf(c.role) !== -1) {
                                roleMap[c.role] = c.hex;
                            }
                        });
                        
                        var systemIndex = 0;
                        data.colors.forEach(function(c) {
                            if (!c.role || systemRoles.indexOf(c.role) === -1) {
                                while (systemIndex < systemRoles.length) {
                                    var r = systemRoles[systemIndex];
                                    if (!roleMap[r]) {
                                        roleMap[r] = c.hex;
                                        systemIndex++;
                                        break;
                                    }
                                    systemIndex++;
                                }
                            }
                        });
                        
                        systemRoles.forEach(function(r) {
                            systemColors.push({
                                _id: r,
                                title: r.charAt(0).toUpperCase() + r.slice(1),
                                color: roleMap[r] || defaults[r]
                            });
                        });
                        
                        data.colors.forEach(function(c) {
                            var isMappedSystem = Object.keys(roleMap).some(function(r) {
                                return roleMap[r] === c.hex;
                            });
                            if (!isMappedSystem || (c.role && systemRoles.indexOf(c.role) === -1)) {
                                customColors.push({
                                    _id: c.id || ('color_' + Math.random().toString(36).substr(2, 9)),
                                    title: c.name || 'Custom Color',
                                    color: c.hex
                                });
                            }
                        });
                        
                        if (typeof $e !== 'undefined') {
                            $e.run('document/elements/settings', {
                                container: kit.container,
                                settings: {
                                    system_colors: systemColors,
                                    custom_colors: customColors
                                }
                            });
                            
                            var iframeEl = document.getElementById('itspc-panel-iframe');
                            if (iframeEl && iframeEl.contentWindow) {
                                iframeEl.contentWindow.postMessage({
                                    type: 'itspc_sync_success',
                                    message: 'Colors synced to Elementor successfully!'
                                }, '*');
                            }
                        }
                    }
                } else {
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_sync_error',
                            message: 'Sync is only available inside Elementor editor.'
                        }, '*');
                    }
                }
            }

            // Sync Fonts to Elementor Globals
            if (data.type === 'itspc_sync_fonts' && data.heading && data.body) {
                if (typeof elementor !== 'undefined' && elementor.documents) {
                    var kitId = elementor.config.active_kit_id;
                    var kit = elementor.documents.get(kitId);
                    if (kit) {
                        var systemTypography = [
                            {
                                _id: 'primary',
                                title: 'Primary',
                                typography_font_family: data.heading,
                                typography_font_weight: '700'
                            },
                            {
                                _id: 'secondary',
                                title: 'Secondary',
                                typography_font_family: data.heading,
                                typography_font_weight: '600'
                            },
                            {
                                _id: 'text',
                                title: 'Text',
                                typography_font_family: data.body,
                                typography_font_weight: '400'
                            },
                            {
                                _id: 'accent',
                                title: 'Accent',
                                typography_font_family: data.heading,
                                typography_font_weight: '500'
                            }
                        ];
                        
                        if (typeof $e !== 'undefined') {
                            $e.run('document/elements/settings', {
                                container: kit.container,
                                settings: {
                                    system_typography: systemTypography
                                }
                            });
                            
                            var iframeEl = document.getElementById('itspc-panel-iframe');
                            if (iframeEl && iframeEl.contentWindow) {
                                iframeEl.contentWindow.postMessage({
                                    type: 'itspc_sync_success',
                                    message: 'Fonts synced to Elementor successfully!'
                                }, '*');
                            }
                        }
                    }
                } else {
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_sync_error',
                            message: 'Sync is only available inside Elementor editor.'
                        }, '*');
                    }
                }
            }

            // Run Pre-Publish Audit Scanner
            if (data.type === 'itspc_run_audit') {
                var previewIframe = document.getElementById('elementor-preview-iframe');
                if (!previewIframe) {
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_audit_results',
                            results: [],
                            error: 'Not inside Elementor editor preview.'
                        }, '*');
                    }
                    return;
                }

                var previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
                var results = [];

                // Helper to get widget/section info
                var getElementInfo = function(el) {
                    var widget = el.closest('.elementor-element');
                    var id = widget ? (widget.getAttribute('data-id') || '') : '';
                    var title = '';

                    if (id && typeof elementor !== 'undefined' && elementor.documents) {
                        var doc = elementor.documents.getCurrent();
                        if (doc && doc.container) {
                            var container = doc.container.children.filter(function(child) {
                                return child.model.get('id') === id;
                            })[0];
                            if (container) {
                                title = container.model.getSetting('_title') || '';
                            }
                        }
                    }

                    if (!title) {
                        title = widget ? (widget.getAttribute('data-element_type') || 'Element') : 'Element';
                        title = title.replace('widget', '').replace('column', '').replace('section', '').replace('.', ' ').trim();
                        title = title.charAt(0).toUpperCase() + title.slice(1);
                    }

                    return { id: id, title: title };
                };

                // 1. Scan for Empty / Unlinked Links
                var links = previewDoc.querySelectorAll('a');
                links.forEach(function(link) {
                    var href = link.getAttribute('href');
                    if (typeof href === 'undefined' || href === null || href === '' || href === '#' || (href && href.toLowerCase() === 'http://#') || (href && href.toLowerCase() === 'https://#')) {
                        if (link.closest('.elementor-editor-element-setting')) return;
                        
                        var info = getElementInfo(link);
                        var linkText = (link.textContent || '').trim() || link.getAttribute('title') || 'Button/Link';

                        results.push({
                            type: 'link',
                            title: 'Empty Link',
                            description: 'Link points to empty "#" in "' + info.title + '" widget.',
                            elementId: info.id,
                            previewText: linkText.substring(0, 30)
                        });
                    }
                });

                // 2. Scan for Missing Image Alt Text
                var images = previewDoc.querySelectorAll('img');
                images.forEach(function(img) {
                    var alt = img.getAttribute('alt');
                    var src = img.getAttribute('src') || '';
                    if (src.indexOf('data:image') === 0) return;
                    if (img.closest('.elementor-editor-element-setting')) return;

                    if (alt === null || alt.trim() === '') {
                        var info = getElementInfo(img);
                        var fileName = src.substring(src.lastIndexOf('/') + 1) || 'image';
                        
                        results.push({
                            type: 'alt',
                            title: 'Missing Alt Text',
                            description: 'Image "' + fileName.substring(0, 24) + '" in "' + info.title + '" has no alt text.',
                            elementId: info.id,
                            previewText: fileName.substring(0, 30)
                        });
                    }
                });

                // 3. Scan for Lorem Ipsum / Placeholder Text
                var loremRegex = /\blorem\s+ipsum\b|\bdolor\s+sit\s+amet\b/i;
                var widgetContainers = previewDoc.querySelectorAll('.elementor-widget-container');
                widgetContainers.forEach(function(container) {
                    var text = container.textContent;
                    if (loremRegex.test(text)) {
                        var info = getElementInfo(container);
                        var alreadyAdded = results.some(function(r) {
                            return r.elementId === info.id && r.type === 'lorem';
                        });
                        if (!alreadyAdded && info.id) {
                            results.push({
                                type: 'lorem',
                                title: 'Lorem Ipsum Leftover',
                                description: '"' + info.title + '" widget contains placeholder text.',
                                elementId: info.id,
                                previewText: 'Lorem Ipsum...'
                            });
                        }
                    }
                });

                // 4. Scan for Empty Sections / Columns (Layout areas with no widgets inside)
                var wrappers = previewDoc.querySelectorAll('.elementor-column-wrap, .elementor-widget-wrap');
                wrappers.forEach(function(wrapper) {
                    if (wrapper.querySelectorAll(':scope > .elementor-widget').length === 0) {
                        var info = getElementInfo(wrapper);
                        var alreadyAdded = results.some(function(r) {
                            return r.elementId === info.id && r.type === 'empty';
                        });
                        if (!alreadyAdded && info.id) {
                            results.push({
                                type: 'empty',
                                title: 'Empty Layout Area',
                                description: 'Layout container has no widgets inside.',
                                elementId: info.id,
                                previewText: 'Empty Column/Container'
                            });
                        }
                    }
                });

                // Send results back to PageCraft tool iframe
                var iframeEl = document.getElementById('itspc-panel-iframe');
                if (iframeEl && iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'itspc_audit_results',
                        results: results
                    }, '*');
                }
            }

            // Highlight Widget in Elementor Editor preview canvas
            if (data.type === 'itspc_highlight_element' && data.elementId) {
                var previewIframe = document.getElementById('elementor-preview-iframe');
                if (previewIframe) {
                    var previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
                    var targetEl = previewDoc.querySelector('[data-id="' + data.elementId + '"]');
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        targetEl.style.outline = '4px solid #C8FF00';
                        targetEl.style.outlineOffset = '4px';
                        targetEl.style.transition = 'outline 0.3s ease-in-out';

                        setTimeout(function() {
                            targetEl.style.outline = 'none';
                        }, 2200);
                    }
                }
            }
        });

        // --- Listen to Elementor editor title changes and sync back to PageCraft ---
        if (typeof elementor !== 'undefined' && elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.on('change', function(view) {
                if (view && view.elementSettingsModel && view.elementSettingsModel.changed) {
                    var changed = view.elementSettingsModel.changed;
                    if (typeof changed._title !== 'undefined') {
                        var newTitle = changed._title;
                        var model = view.model || (view.container && view.container.model);
                        if (model) {
                            var id = model.get('id');
                            var cid = model.cid;
                            
                            var iframeEl = document.getElementById('itspc-panel-iframe');
                            if (iframeEl && iframeEl.contentWindow) {
                                iframeEl.contentWindow.postMessage({
                                    type: 'itspc_element_renamed_externally',
                                    id: id,
                                    cid: cid,
                                    title: newTitle
                                }, '*');
                            }
                        }
                    }
                }
            });
        }

        // --- Resize Handle ---
        var isResizing = false;
        var startX     = 0;
        var startWidth = 0;
        var position   = (typeof itspcData !== 'undefined' && itspcData.panelPosition) ? itspcData.panelPosition : 'right';

        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX     = e.clientX;
            startWidth = panel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            iframe.style.pointerEvents = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            var diff     = (position === 'right') ? (startX - e.clientX) : (e.clientX - startX);
            var newWidth = Math.min(700, Math.max(350, startWidth + diff));
            panel.style.width = newWidth + 'px';
        });

        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                iframe.style.pointerEvents = 'auto';
            }
        });
    }

    // --- Wait for Elementor to be ready ---
    if (typeof elementor !== 'undefined') {
        elementor.on('panel:init', function() {
            setTimeout(initPageCraft, 800);
        });
    } else {
        // Fallback: listen for elementor:init event
        window.addEventListener('elementor:init', function() {
            setTimeout(initPageCraft, 1500);
        });
    }

})();
