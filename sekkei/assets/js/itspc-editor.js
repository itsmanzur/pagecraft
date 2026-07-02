/**
 * Sekkei  Elementor Editor Integration
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


    function addHeadLink(attrs) {
        var selector = 'link[href="' + attrs.href + '"]';
        if (document.head.querySelector(selector)) {
            return;
        }
        var link = document.createElement('link');
        Object.keys(attrs).forEach(function(key) {
            link.setAttribute(key, attrs[key]);
        });
        document.head.appendChild(link);
    }

    function warmSekkeiAssets() {
        if (typeof itspcData === 'undefined' || !itspcData.assetBaseUrl) {
            return;
        }
        var base = String(itspcData.assetBaseUrl).replace(/\/$/, '');
        addHeadLink({ rel: 'preload', href: base + '/vendor/tabler-icons/fonts/tabler-icons.woff2', 'as': 'font', type: 'font/woff2', crossorigin: 'anonymous' });
        addHeadLink({ rel: 'preload', href: base + '/vendor/fonts/dm-sans-400.woff2', 'as': 'font', type: 'font/woff2', crossorigin: 'anonymous' });
        addHeadLink({ rel: 'preload', href: base + '/vendor/fonts/syne-700.woff2', 'as': 'font', type: 'font/woff2', crossorigin: 'anonymous' });
        addHeadLink({ rel: 'prefetch', href: base + '/vendor/fonts/fonts.css', 'as': 'style' });
        addHeadLink({ rel: 'prefetch', href: base + '/vendor/tabler-icons/tabler-icons.min.css', 'as': 'style' });
        if (itspcData.toolUrl) {
            addHeadLink({ rel: 'prefetch', href: itspcData.toolUrl, 'as': 'document' });
        }
    }

    function scheduleAssetWarmup() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(warmSekkeiAssets, { timeout: 1500 });
        } else {
            setTimeout(warmSekkeiAssets, 500);
        }
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

    function findElementorContainer(container, id, cid) {
        if (!container) {
            return null;
        }
        var model = container.model;
        if (model) {
            var modelId = cleanId(typeof model.get === 'function' ? model.get('id') : model.id);
            var modelCid = cleanId(model.cid || '');
            if ((id && modelId === id) || (cid && modelCid === cid)) {
                return container;
            }
        }
        var children = getContainerChildren(container);
        for (var i = 0; i < children.length; i++) {
            var found = findElementorContainer(children[i], id, cid);
            if (found) {
                return found;
            }
        }
        return null;
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
                            type: elType,
                            children: getContainerChildren(child).length
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
                    type: isSection ? 'section' : 'container',
                    children: node.querySelectorAll('.elementor-widget, .e-con, .elementor-column').length
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
        scheduleAssetWarmup();
        var btn       = document.getElementById('itspc-toggle-btn');
        var panel     = document.getElementById('itspc-panel');
        var iframe    = document.getElementById('itspc-panel-iframe');
        var closeBtn  = document.getElementById('itspc-panel-close');
        var popoutBtn = document.getElementById('itspc-panel-popout');
        var resizer   = document.getElementById('itspc-panel-resizer');
        var isOpen    = false;
        var lastStructureSignature = '';
        var structureSyncTimer = null;
        var structureSyncDebounce = null;
        var position   = (typeof itspcData !== 'undefined' && itspcData.panelPosition) ? itspcData.panelPosition : 'right';

        function updateToggleBtnPosition() {
            if (isOpen && position === 'right') {
                var panelWidth = panel.offsetWidth;
                btn.style.right = (panelWidth + 16) + 'px';
            } else {
                btn.style.right = '';
            }
        }

        // Custom lightning bolt SVG icon
        var ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:5px;margin-top:-2px;"><path d="M13 10h7l-9 13v-9H5l9-13v9z"/></svg>';

        // Bail if HTML not injected
        if (!btn || !panel) {
            return;
        }

        var btnText = btn.querySelector('.itspc-btn-text');

        // Set initial SVG icon on load
        btnText.innerHTML = ICON_SVG + ' Sekkei';

        function postDisplaySettingsToTool() {
            if (!iframe || !iframe.contentWindow || typeof itspcData === 'undefined') {
                return;
            }
            var src = iframe.getAttribute('src') || '';
            if (!src || src === 'about:blank') {
                return;
            }
            try {
                iframe.contentWindow.postMessage({
                    type: 'itspc_display_settings',
                    display: itspcData.display || {}
                }, window.location.origin);
            } catch (err) {
                // Query-string settings are the primary path; postMessage is a live-refresh helper.
            }
        }

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
            postDisplaySettingsToTool();
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
                postDisplaySettingsToTool();
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
            updateToggleBtnPosition();
        }

        function closePanel() {
            panel.classList.remove('itspc-panel-open');
            panel.classList.add('itspc-panel-closed');
            btn.classList.remove('itspc-btn-active');
            btnText.innerHTML = ICON_SVG + ' Sekkei';
            document.body.classList.remove('itspc-is-open');
            isOpen = false;
            stopStructureSync();
            updateToggleBtnPosition();
        }

        function togglePanel() {
            if (isOpen) {
                closePanel();
            } else {
                openPanel();
            }
        }

        function postStructureToTool(force) {
            if (!isOpen && !force) {
                return;
            }
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
            }, 2500);
        }

        function stopStructureSync() {
            if (structureSyncTimer) {
                clearInterval(structureSyncTimer);
                structureSyncTimer = null;
            }
            if (structureSyncDebounce) {
                clearTimeout(structureSyncDebounce);
                structureSyncDebounce = null;
            }
        }

        function scheduleStructureSync(delay) {
            if (!isOpen) {
                return;
            }
            if (structureSyncDebounce) {
                clearTimeout(structureSyncDebounce);
            }
            structureSyncDebounce = setTimeout(function() {
                structureSyncDebounce = null;
                postStructureToTool(false);
            }, delay || 250);
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
                        var container = findElementorContainer(doc.container, safeId, safeCid);
                        
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
                            var container = findElementorContainer(doc.container, cleanId(id), '');
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

                // 5. Scan for Oversized Images (naturalWidth vs display clientWidth)
                images.forEach(function(img) {
                    if (img.closest('.elementor-editor-element-setting')) return;
                    if (img.naturalWidth && img.clientWidth) {
                        if (img.clientWidth > 50 && img.naturalWidth > img.clientWidth * 2) {
                            var info = getElementInfo(img);
                            results.push({
                                type: 'oversized',
                                title: 'Oversized Image',
                                description: 'Image asset width is ' + img.naturalWidth + 'px but displayed at ' + img.clientWidth + 'px. Consider scaling down to save bandwidth.',
                                elementId: info.id,
                                previewText: img.naturalWidth + 'px vs ' + img.clientWidth + 'px'
                            });
                        }
                    }
                });

                // 6. Scan Heading Sequence and Counts
                var headings = previewDoc.querySelectorAll('h1, h2, h3, h4, h5, h6');
                var h1Count = 0;
                var headingList = [];
                headings.forEach(function(h) {
                    if (h.closest('.elementor-editor-element-setting')) return;
                    var tag = h.tagName.toLowerCase();
                    var level = parseInt(tag.charAt(1), 10);
                    if (tag === 'h1') h1Count++;
                    var info = getElementInfo(h);
                    headingList.push({ level: level, elementId: info.id, title: info.title, text: (h.textContent || '').trim() });
                });

                // H1 SEO Warnings
                if (h1Count === 0) {
                    results.push({
                        type: 'seo',
                        title: 'Missing H1 Heading',
                        description: 'Your page does not contain any H1 heading. An H1 is crucial for SEO and screen readers.',
                        elementId: '',
                        previewText: 'No H1'
                    });
                } else if (h1Count > 1) {
                    results.push({
                        type: 'seo',
                        title: 'Multiple H1 Headings',
                        description: 'Your page contains ' + h1Count + ' H1 headings. Best practice is to have exactly one H1 per page.',
                        elementId: '',
                        previewText: h1Count + ' H1s'
                    });
                }

                // Heading Hierarchy Skips
                for (var k = 1; k < headingList.length; k++) {
                    var prev = headingList[k - 1];
                    var curr = headingList[k];
                    if (curr.level > prev.level + 1) {
                        results.push({
                            type: 'accessibility',
                            title: 'Skipped Heading Level',
                            description: 'Heading level skipped from H' + prev.level + ' ("' + prev.text.substring(0, 20) + '") directly to H' + curr.level + ' ("' + curr.text.substring(0, 20) + '"). Use consecutive heading levels.',
                            elementId: curr.elementId,
                            previewText: 'H' + prev.level + ' to H' + curr.level
                        });
                    }
                }

                // 7. SEO Page Meta Scan
                var pageTitle = previewDoc.title || '';
                if (!pageTitle) {
                    results.push({
                        type: 'seo',
                        title: 'Missing Page Title',
                        description: 'The document title is empty. A page title is required for browser tabs and search engine listing.',
                        elementId: '',
                        previewText: 'No title'
                    });
                } else if (pageTitle.length < 10 || pageTitle.length > 60) {
                    results.push({
                        type: 'seo',
                        title: 'SEO Title Length Warning',
                        description: 'Page title ("' + pageTitle.substring(0, 20) + '...") is ' + pageTitle.length + ' characters. Optimal length is between 10 and 60 characters.',
                        elementId: '',
                        previewText: pageTitle.length + ' chars'
                    });
                }

                var metaDescEl = previewDoc.querySelector('meta[name="description"]');
                var metaDesc = metaDescEl ? (metaDescEl.getAttribute('content') || '') : '';
                if (!metaDesc) {
                    results.push({
                        type: 'seo',
                        title: 'Missing Meta Description',
                        description: 'No meta description found. Add a meta description to summarize page content for search results.',
                        elementId: '',
                        previewText: 'No description'
                    });
                } else if (metaDesc.length < 50 || metaDesc.length > 160) {
                    results.push({
                        type: 'seo',
                        title: 'SEO Meta Description Length',
                        description: 'Meta description is ' + metaDesc.length + ' characters. Optimal length is between 50 and 160 characters for search listings.',
                        elementId: '',
                        previewText: metaDesc.length + ' chars'
                    });
                }

                // 8. Accessibility Checks (Empty buttons, vague links, contrast)
                var buttons = previewDoc.querySelectorAll('button');
                buttons.forEach(function(btn) {
                    if (btn.closest('.elementor-editor-element-setting')) return;
                    var text = (btn.textContent || '').trim();
                    var aria = btn.getAttribute('aria-label') || btn.getAttribute('aria-labelledby') || '';
                    if (!text && !aria) {
                        var info = getElementInfo(btn);
                        results.push({
                            type: 'accessibility',
                            title: 'Empty Button Label',
                            description: 'Button has no visible text label or aria-label attribute. This is inaccessible to screen readers.',
                            elementId: info.id,
                            previewText: 'Empty button'
                        });
                    }
                });

                var vagueTextRegex = /^(click here|read more|learn more|more|go|link|here|view details|view more|find out more)$/i;
                links.forEach(function(link) {
                    if (link.closest('.elementor-editor-element-setting')) return;
                    var text = (link.textContent || '').trim().replace(/\s+/g, ' ');
                    if (text && vagueTextRegex.test(text)) {
                        var info = getElementInfo(link);
                        results.push({
                            type: 'accessibility',
                            title: 'Vague Link Text',
                            description: 'Link text "' + text + '" is too vague out of context. Screen reader users need descriptive link text (e.g. "Learn more about our services").',
                            elementId: info.id,
                            previewText: '"' + text + '"'
                        });
                    }
                });

                var parseColor = function(colorStr) {
                    if (colorStr.indexOf('rgb') === 0) {
                        var parts = colorStr.match(/\d+/g);
                        if (parts && parts.length >= 3) {
                            return { r: parseInt(parts[0], 10), g: parseInt(parts[1], 10), b: parseInt(parts[2], 10) };
                        }
                    }
                    return null;
                };

                var getLuminanceVal = function(r, g, b) {
                    var a = [r, g, b].map(function(v) {
                        v /= 255;
                        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                    });
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                };

                var textElements = previewDoc.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, button');
                textElements.forEach(function(el) {
                    if (el.closest('.elementor-editor-element-setting')) return;
                    var style = window.getComputedStyle(el);
                    var color = style.color;
                    var bgColor = style.backgroundColor;

                    var rgbColor = parseColor(color);
                    var rgbBg = parseColor(bgColor);

                    if (rgbColor && rgbBg && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                        var l1 = getLuminanceVal(rgbColor.r, rgbColor.g, rgbColor.b);
                        var l2 = getLuminanceVal(rgbBg.r, rgbBg.g, rgbBg.b);
                        var brightest = Math.max(l1, l2);
                        var darkest = Math.min(l1, l2);
                        var ratio = (brightest + 0.05) / (darkest + 0.05);

                        if (ratio < 4.5) {
                            var fontSize = parseFloat(style.fontSize) || 16;
                            var fontWeight = style.fontWeight || '400';
                            var isLarge = fontSize >= 24 || (fontSize >= 18 && (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900'));
                            
                            if ((isLarge && ratio < 3.0) || (!isLarge && ratio < 4.5)) {
                                var info = getElementInfo(el);
                                var alreadyFlagged = results.some(function(r) {
                                    return r.elementId === info.id && r.type === 'contrast';
                                });
                                if (!alreadyFlagged && info.id) {
                                    results.push({
                                        type: 'contrast',
                                        title: 'Low Color Contrast',
                                        description: 'Text element has low contrast ratio (' + ratio.toFixed(2) + ':1) against its background. Recommended ratio is at least 4.5:1 (3.0:1 for large text).',
                                        elementId: info.id,
                                        previewText: ratio.toFixed(2) + ':1 ratio'
                                    });
                                }
                            }
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
                scheduleStructureSync(250);
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

        // --- Listen to Elementor element selection and send to Sekkei Selector Helper ---
        if (typeof elementor !== 'undefined' && elementor.channels && elementor.channels.editor) {
            elementor.channels.editor.on('selected:container', function(container) {
                if (container && container.model) {
                    var model = container.model;
                    var id = model.get('id');
                    var cid = model.cid;
                    var settings = model.get('settings');
                    var cssClasses = '';
                    var elementId = '';
                    var title = '';
                    var elementType = model.get('elType') || '';
                    
                    if (settings) {
                        cssClasses = typeof settings.get === 'function' ? settings.get('css_classes') : (settings.css_classes || '');
                        elementId = typeof settings.get === 'function' ? settings.get('_element_id') : (settings._element_id || '');
                        title = typeof settings.get === 'function' ? settings.get('_title') : (settings._title || '');
                    }
                    
                    var iframeEl = document.getElementById('itspc-panel-iframe');
                    if (iframeEl && iframeEl.contentWindow) {
                        iframeEl.contentWindow.postMessage({
                            type: 'itspc_element_selected',
                            id: id,
                            cid: cid,
                            title: title || (elementType.charAt(0).toUpperCase() + elementType.slice(1)),
                            cssClasses: cssClasses,
                            elementId: elementId,
                            elementType: elementType
                        }, window.location.origin);
                    }
                }
            });
        }


        // --- Resize Handle ---
        var isResizing = false;
        var startX     = 0;
        var startWidth = 0;

        resizer.addEventListener('mousedown', function(e) {
            isResizing = true;
            startX     = e.clientX;
            startWidth = panel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            iframe.style.pointerEvents = 'none';
            btn.style.transition = 'none'; // Disable transition during drag for real-time tracking
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isResizing) return;
            var diff     = (position === 'right') ? (startX - e.clientX) : (e.clientX - startX);
            var newWidth = Math.min(700, Math.max(350, startWidth + diff));
            panel.style.width = newWidth + 'px';
            updateToggleBtnPosition();
        });

        document.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                iframe.style.pointerEvents = 'auto';
                btn.style.transition = ''; // Restore CSS transition
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

