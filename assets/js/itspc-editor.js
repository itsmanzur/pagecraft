/**
 * Sekkei â€” Elementor Editor Integration
 *
 * Injects floating button and sliding iframe panel into the Elementor editor.
 * Uses localized `itspcData` object from PHP.
 *
 * @package Sekkei
 */
(function() {
    'use strict';

    function cleanText(value, maxLen) {
        return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen || 500);
    }

    function cleanId(value, fallback) {
        return cleanText(value, 80).replace(/[^A-Za-z0-9_-]/g, '');
    }

    function cleanHex(value) {
        var hex = cleanText(value, 16);
        return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex) ? hex : '';
    }

    function cleanFontName(value) {
        return cleanText(value, 80).replace(/[^A-Za-z0-9 \-]/g, '');
    }

    function escapeSelectorValue(value) {
        var id = cleanId(value);
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(id);
        }
        return id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    function normalizeColors(colors) {
        var systemRoles = ['primary', 'secondary', 'text', 'accent'];
        if (!Array.isArray(colors)) {
            return [];
        }
        return colors.slice(0, 100).map(function(c) {
            var hex = cleanHex(c && c.hex);
            if (!hex) {
                return null;
            }
            var role = cleanText(c && c.role, 24).toLowerCase();
            return {
                id: cleanId(c && c.id) || ('color_' + Math.random().toString(36).substr(2, 9)),
                name: cleanText(c && c.name, 80) || 'Custom Color',
                role: systemRoles.indexOf(role) !== -1 ? role : 'custom',
                hex: hex
            };
        }).filter(Boolean);
    }

    function getContainerChildren(container) {
        if (!container || !container.children) {
            return [];
        }
        if (Array.isArray(container.children)) {
            return container.children;
        }
        if (typeof container.children.toArray === 'function') {
            return container.children.toArray();
        }
        if (container.children.models && Array.isArray(container.children.models)) {
            return container.children.models;
        }
        return [];
    }

    function getModelValue(container, key) {
        if (!container || !container.model) {
            return '';
        }
        if (typeof container.model.get === 'function') {
            return container.model.get(key);
        }
        return container.model[key] || '';
    }

    function getModelSetting(container, key) {
        if (!container || !container.model) {
            return '';
        }
        if (typeof container.model.getSetting === 'function') {
            return container.model.getSetting(key);
        }
        var settings = typeof container.model.get === 'function' ? container.model.get('settings') : container.model.settings;
        if (settings && typeof settings.get === 'function') {
            return settings.get(key);
        }
        return settings && settings[key] ? settings[key] : '';
    }

    function getElementorLayoutElements() {
        if (typeof elementor === 'undefined' || !elementor.documents) {
            return [];
        }
        try {
            var doc = elementor.documents.getCurrent();
            if (!doc || !doc.container || !doc.container.children) {
                return [];
            }
            var found = [];
            var seen = {};

            function walk(container) {
                getContainerChildren(container).forEach(function(child) {
                    var elType = getModelValue(child, 'elType');
                    var id = cleanId(getModelValue(child, 'id'));
                    var cid = cleanId(child && child.model ? child.model.cid : '');

                    if ((elType === 'section' || elType === 'container') && (id || cid) && !seen[id || cid]) {
                        seen[id || cid] = true;
                        found.push({
                            id: id,
                            cid: cid,
                            title: cleanText(getModelSetting(child, '_title') || (elType.charAt(0).toUpperCase() + elType.slice(1)), 120),
                            type: elType
                        });
                    }

                    walk(child);
                });
            }

            walk(doc.container);
            return found;
        } catch (err) {
            return [];
        }
    }

    function getElementorPreviewLayoutElements() {
        var previewIframe = document.getElementById('elementor-preview-iframe');
        if (!previewIframe) {
            return [];
        }
        try {
            var previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
            if (!previewDoc) {
                return [];
            }
            var nodes = previewDoc.querySelectorAll('.elementor-element[data-id].e-con, .elementor-section[data-id], .elementor-top-section[data-id]');
            var found = [];
            var seen = {};
            Array.prototype.forEach.call(nodes, function(node) {
                var id = cleanId(node.getAttribute('data-id'));
                if (!id || seen[id]) {
                    return;
                }
                seen[id] = true;
                var isSection = node.classList.contains('elementor-section') || node.classList.contains('elementor-top-section');
                found.push({
                    id: id,
                    cid: '',
                    title: cleanText(node.getAttribute('data-element_type') || (isSection ? 'Section' : 'Container'), 120),
                    type: isSection ? 'section' : 'container'
                });
            });
            return found;
        } catch (err) {
            return [];
        }
    }

    function getElementorTopLevelElements() {
        var elements = getElementorLayoutElements();
        if (elements.length) {
            return elements;
        }
        return getElementorPreviewLayoutElements();
    }

    function getStructureSignature(items) {
        return items.map(function(item) {
            return [item.id, item.cid, item.title, item.type].join(':');
        }).join('|');
    }

    function initSekkei() {
        var btn       = document.getElementById('itspc-toggle-btn');
        var panel     = document.getElementById('itspc-panel');
        var iframe    = document.getElementById('itspc-panel-iframe');
        var closeBtn  = document.getElementById('itspc-panel-close');
        var popoutBtn = document.getElementById('itspc-panel-popout');
        var resizer   = document.getElementById('itspc-panel-resizer');
        var isOpen    = false;
        var lastStructureSignature = '';
        var structureSyncTimer = null;

        // Custom lightning bolt SVG icon
        var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:5px;margin-top:-2px;"><path d="M13 10h7l-9 13v-9H5l9-13v9z"/></svg>';

        // Bail if HTML not injected
        if (!btn || !panel) {
            return;
        }

        var btnText = btn.querySelector('.itspc-btn-text');

        // Set initial SVG icon on load
        btnText.innerHTML = ICON_SVG + ' Sekkei';

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
            startStructureSync();
            setTimeout(function() {
                postStructureToTool(true);
            }, 300);
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
            } else {
                startStructureSync();
                postStructureToTool(true);
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
            btnText.innerHTML = ICON_SVG + ' Sekkei';
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

        function postStructureToTool(force) {
            if (!iframe || !iframe.contentWindow) {
                return;
            }
            var elements = getElementorTopLevelElements();
            if (!elements.length) {
                return;
            }
            var signature = getStructureSignature(elements);
            if (!force && signature === lastStructureSignature) {
                return;
            }
            lastStructureSignature = signature;
            iframe.contentWindow.postMessage({
                type: 'itspc_elementor_structure_changed',
                sections: elements
            }, window.location.origin);
        }

        function startStructureSync() {
            if (structureSyncTimer) {
                return;
            }
            postStructureToTool(true);
            structureSyncTimer = setInterval(function() {
                postStructureToTool(false);
            }, 1000);
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



        // --- Listen for rename requests from Sekkei iframe ---
        window.addEventListener('message', function(e) {
            // Security: only accept messages from the same origin.
            if ( e.origin !== window.location.origin ) {
                return;
            }
            if ( iframe && e.source !== iframe.contentWindow ) {
                return;
            }
            var data = e.data;
            if (!data || typeof data !== 'object') return;

            if (data.type === 'rename_elementor_element') {
                var safeTitle = cleanText(data.title, 120);
                var safeId = cleanId(data.id);
                var safeCid = cleanId(data.cid);
                if (!safeTitle || (!safeId && !safeCid)) {
                    return;
                }
                if (typeof elementor !== 'undefined' && elementor.documents) {
                    var doc = elementor.documents.getCurrent();
                    if (doc && doc.container) {
                        var container = doc.container.children.filter(function(child) {
                            return child.model.cid === safeCid || child.model.get('id') === safeId;
                        })[0];
                        
                        if (container) {
                            if (typeof $e !== 'undefined') {
                                $e.run('document/elements/settings', {
                                    container: container,
                                    settings: {
                                        _title: safeTitle
                                    }
                                });
                            } else {
                                container.model.setSetting('_title', safeTitle);
                            }
                        }
                    }
                }
            }

            // Sync Colors to Elementor Globals
            if (data.type === 'itspc_sync_colors' && data.colors) {
                data.colors = normalizeColors(data.colors);
                if (!data.colors.length) {
                    return;
                }
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
                                }, window.location.origin);
                            }
                        }
                    }
                } else {
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_sync_error',
                            message: 'Sync is only available inside Elementor editor.'
                        }, window.location.origin);
                    }
                }
            }

            // Sync Fonts to Elementor Globals
            if (data.type === 'itspc_sync_fonts' && data.heading && data.body) {
                var safeHeading = cleanFontName(data.heading);
                var safeBody = cleanFontName(data.body);
                if (!safeHeading || !safeBody) {
                    return;
                }
                if (typeof elementor !== 'undefined' && elementor.documents) {
                    var kitId = elementor.config.active_kit_id;
                    var kit = elementor.documents.get(kitId);
                    if (kit) {
                        var systemTypography = [
                            {
                                _id: 'primary',
                                title: 'Primary',
                                typography_font_family: safeHeading,
                                typography_font_weight: '700'
                            },
                            {
                                _id: 'secondary',
                                title: 'Secondary',
                                typography_font_family: safeHeading,
                                typography_font_weight: '600'
                            },
                            {
                                _id: 'text',
                                title: 'Text',
                                typography_font_family: safeBody,
                                typography_font_weight: '400'
                            },
                            {
                                _id: 'accent',
                                title: 'Accent',
                                typography_font_family: safeHeading,
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
                                }, window.location.origin);
                            }
                        }
                    }
                } else {
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_sync_error',
                            message: 'Sync is only available inside Elementor editor.'
                        }, window.location.origin);
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
                        }, window.location.origin);
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

                // Send results back to Sekkei tool iframe
                var iframeEl = document.getElementById('itspc-panel-iframe');
                if (iframeEl && iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'itspc_audit_results',
                        results: results
                    }, window.location.origin);
                }
            }

            // Highlight Widget in Elementor Editor preview canvas
            if (data.type === 'itspc_highlight_element' && data.elementId) {
                var safeElementId = cleanId(data.elementId);
                if (!safeElementId) {
                    return;
                }
                var previewIframe = document.getElementById('elementor-preview-iframe');
                if (previewIframe) {
                    var previewDoc = previewIframe.contentDocument || previewIframe.contentWindow.document;
                    var targetEl = previewDoc.querySelector('[data-id="' + escapeSelectorValue(safeElementId) + '"]');
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

        // --- Listen to Elementor editor title changes and sync back to Sekkei ---
        if (typeof elementor !== 'undefined' && elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.on('change', function(view) {
                setTimeout(function() {
                    postStructureToTool(true);
                }, 250);
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
                                }, window.location.origin);
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
            setTimeout(initSekkei, 800);
        });
    } else {
        // Fallback: listen for elementor:init event
        window.addEventListener('elementor:init', function() {
            setTimeout(initSekkei, 1500);
        });
    }

})();

