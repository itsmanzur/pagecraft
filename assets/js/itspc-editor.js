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

        var isPanelDragging = false;
        var panelStartX, panelStartY;
        var panelInitialLeft, panelInitialTop;
        var isPanelFloating = localStorage.getItem('itspc_panel_floating') === '1';

        // Restore saved panel position on load if floating
        if (isPanelFloating && panel) {
            panel.classList.add('itspc-panel-floating');
            var savedPanelLeft = localStorage.getItem('itspc_panel_left');
            var savedPanelTop = localStorage.getItem('itspc_panel_top');
            var savedPanelHeight = localStorage.getItem('itspc_panel_height');
            if (savedPanelLeft !== null) panel.style.left = savedPanelLeft;
            if (savedPanelTop !== null) panel.style.top = savedPanelTop;
            if (savedPanelHeight !== null) panel.style.height = savedPanelHeight;
        }

        function updateToggleBtnPosition() {
            if (localStorage.getItem('itspc_btn_top') !== null) {
                return;
            }
            if (isOpen && position === 'right') {
                var panelWidth = panel.offsetWidth;
                btn.style.right = (panelWidth + 16) + 'px';
                btn.style.left = 'auto';
                btn.style.top = 'auto';
                btn.style.bottom = '24px';
            } else {
                btn.style.right = '';
                btn.style.left = '';
                btn.style.top = '';
                btn.style.bottom = '';
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
        // Restore last saved button position if available
        var savedTop = localStorage.getItem('itspc_btn_top');
        var savedLeft = localStorage.getItem('itspc_btn_left');
        var savedRight = localStorage.getItem('itspc_btn_right');
        var savedBottom = localStorage.getItem('itspc_btn_bottom');

        if (savedTop !== null && savedLeft !== null) {
            btn.style.top = savedTop;
            btn.style.left = savedLeft;
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
        } else if (savedBottom !== null && savedRight !== null) {
            btn.style.bottom = savedBottom;
            btn.style.right = savedRight;
            btn.style.top = 'auto';
            btn.style.left = 'auto';
        }

        var isDragging = false;
        var hasDragged = false;
        var startX, startY;
        var initialLeft, initialTop;

        btn.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            startY = e.clientY;
            var rect = btn.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            btn.style.transition = 'none';
            btn.style.cursor = 'grabbing';
            btn.style.top = initialTop + 'px';
            btn.style.left = initialLeft + 'px';
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
            }
            var newLeft = initialLeft + dx;
            var newTop = initialTop + dy;
            var maxLeft = window.innerWidth - btn.offsetWidth - 10;
            var maxTop = window.innerHeight - btn.offsetHeight - 10;
            newLeft = Math.max(10, Math.min(newLeft, maxLeft));
            newTop = Math.max(10, Math.min(newTop, maxTop));
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', function(e) {
            if (!isDragging) return;
            isDragging = false;
            btn.style.transition = '';
            btn.style.cursor = '';
            if (hasDragged) {
                localStorage.setItem('itspc_btn_top', btn.style.top);
                localStorage.setItem('itspc_btn_left', btn.style.left);
                localStorage.removeItem('itspc_btn_right');
                localStorage.removeItem('itspc_btn_bottom');
            } else {
                togglePanel();
            }
        });

        // Touch support for tablets/mobile
        btn.addEventListener('touchstart', function(e) {
            var touch = e.touches[0];
            isDragging = true;
            hasDragged = false;
            startX = touch.clientX;
            startY = touch.clientY;
            var rect = btn.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            btn.style.transition = 'none';
            btn.style.cursor = 'grabbing';
            btn.style.top = initialTop + 'px';
            btn.style.left = initialLeft + 'px';
            btn.style.bottom = 'auto';
            btn.style.right = 'auto';
        });

        document.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            var touch = e.touches[0];
            var dx = touch.clientX - startX;
            var dy = touch.clientY - startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasDragged = true;
            }
            var newLeft = initialLeft + dx;
            var newTop = initialTop + dy;
            var maxLeft = window.innerWidth - btn.offsetWidth - 10;
            var maxTop = window.innerHeight - btn.offsetHeight - 10;
            newLeft = Math.max(10, Math.min(newLeft, maxLeft));
            newTop = Math.max(10, Math.min(newTop, maxTop));
            btn.style.left = newLeft + 'px';
            btn.style.top = newTop + 'px';
        });

        document.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            isDragging = false;
            btn.style.transition = '';
            btn.style.cursor = '';
            if (hasDragged) {
                localStorage.setItem('itspc_btn_top', btn.style.top);
                localStorage.setItem('itspc_btn_left', btn.style.left);
                localStorage.removeItem('itspc_btn_right');
                localStorage.removeItem('itspc_btn_bottom');
            } else {
                togglePanel();
            }
        });

        // Double-click to reset positioning
        btn.addEventListener('dblclick', function() {
            localStorage.removeItem('itspc_btn_top');
            localStorage.removeItem('itspc_btn_left');
            localStorage.removeItem('itspc_btn_right');
            localStorage.removeItem('itspc_btn_bottom');
            btn.style.top = '';
            btn.style.left = '';
            btn.style.bottom = '';
            btn.style.right = '';
            updateToggleBtnPosition();
        });

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

            if (data.type === 'itspc_close_panel') {
                closePanel();
                return;
            }
            if (data.type === 'itspc_toggle_panel') {
                togglePanel();
                return;
            }

            if (data.type === 'itspc_panel_iframe_drag_start') {
                var rect = panel.getBoundingClientRect();
                panelInitialLeft = rect.left;
                panelInitialTop = rect.top;
                panel.style.transition = 'none';
                iframe.style.pointerEvents = 'none';
                return;
            }
            if (data.type === 'itspc_panel_iframe_drag_move') {
                if (!panel.classList.contains('itspc-panel-floating')) {
                    panel.classList.add('itspc-panel-floating');
                    localStorage.setItem('itspc_panel_floating', '1');
                    panel.style.height = '80vh';
                    var rect = panel.getBoundingClientRect();
                    panelInitialLeft = rect.left - data.dx;
                    panelInitialTop = rect.top - data.dy;
                }
                var newLeft = panelInitialLeft + data.dx;
                var newTop = panelInitialTop + data.dy;
                var maxLeft = window.innerWidth - panel.offsetWidth - 10;
                var maxTop = window.innerHeight - panel.offsetHeight - 10;
                newLeft = Math.max(10, Math.min(newLeft, maxLeft));
                newTop = Math.max(10, Math.min(newTop, maxTop));
                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
                return;
            }
            if (data.type === 'itspc_panel_iframe_drag_end') {
                panel.style.transition = '';
                iframe.style.pointerEvents = 'auto';
                if (panel.classList.contains('itspc-panel-floating')) {
                    localStorage.setItem('itspc_panel_left', panel.style.left);
                    localStorage.setItem('itspc_panel_top', panel.style.top);
                    localStorage.setItem('itspc_panel_height', panel.style.height);
                }
                return;
            }
            if (data.type === 'itspc_panel_iframe_dblclick') {
                panel.classList.remove('itspc-panel-floating');
                panel.style.left = '';
                panel.style.top = '';
                panel.style.height = '';
                localStorage.removeItem('itspc_panel_floating');
                localStorage.removeItem('itspc_panel_left');
                localStorage.removeItem('itspc_panel_top');
                localStorage.removeItem('itspc_panel_height');
                return;
            }

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

                // 1. Scan for Empty, Unlinked, Placeholder or Unsafe Links
                var links = previewDoc.querySelectorAll('a');
                links.forEach(function(link) {
                    if (link.closest('.elementor-editor-element-setting')) return;
                    
                    var href = link.getAttribute('href');
                    var info = getElementInfo(link);
                    var linkText = (link.textContent || '').trim() || link.getAttribute('title') || 'Button/Link';

                    // Check A: Empty / Unlinked link
                    if (typeof href === 'undefined' || href === null || href === '' || href === '#' || (href && href.toLowerCase() === 'http://#') || (href && href.toLowerCase() === 'https://#')) {
                        results.push({
                            type: 'link',
                            title: 'Empty Link',
                            description: 'Link points to empty "#" in "' + info.title + '" widget.',
                            elementId: info.id,
                            previewText: linkText.substring(0, 30)
                        });
                        return;
                    }

                    var hrefLower = href.toLowerCase().trim();

                    // Check B: Template Social Links Left Unchanged
                    var templateSocialRegex = /facebook\.com\/(yourpage|pages\/|$)|twitter\.com\/(yourpage|$)|instagram\.com\/(yourpage|$)|linkedin\.com\/(yourpage|company\/yourpage|$)|youtube\.com\/(yourpage|channel\/yourpage|$)/i;
                    if (templateSocialRegex.test(hrefLower)) {
                        results.push({
                            type: 'seo',
                            title: 'Placeholder Social Link',
                            description: 'Social link "' + href.substring(0, 35) + '" in "' + info.title + '" contains a placeholder template URL. Replace with your actual page link.',
                            elementId: info.id,
                            previewText: href.substring(0, 30)
                        });
                        return;
                    }

                    // Check C: Unsafe target="_blank" without rel="noopener"
                    if (link.getAttribute('target') === '_blank') {
                        var isExternal = hrefLower.indexOf('http') === 0 && hrefLower.indexOf(window.location.hostname) === -1;
                        if (isExternal) {
                            var rel = link.getAttribute('rel') || '';
                            if (rel.indexOf('noopener') === -1) {
                                results.push({
                                    type: 'accessibility',
                                    title: 'Unsafe Tab Target',
                                    description: 'External link opens in a new tab but is missing rel="noopener" in "' + info.title + '". This poses performance and security risks (tabnabbing).',
                                    elementId: info.id,
                                    previewText: 'No noopener'
                                });
                            }
                        }
                    }
                });

                // 2. Scan for Missing/Generic Image Alt Text
                var images = previewDoc.querySelectorAll('img');
                images.forEach(function(img) {
                    var alt = img.getAttribute('alt');
                    var src = img.getAttribute('src') || '';
                    if (src.indexOf('data:image') === 0) return;
                    if (img.closest('.elementor-editor-element-setting')) return;

                    var fileName = src.substring(src.lastIndexOf('/') + 1) || 'image';
                    var info = getElementInfo(img);

                    if (alt === null || alt.trim() === '') {
                        results.push({
                            type: 'alt',
                            title: 'Missing Alt Text',
                            description: 'Image "' + fileName.substring(0, 24) + '" in "' + info.title + '" has no alt text.',
                            elementId: info.id,
                            previewText: fileName.substring(0, 30)
                        });
                    } else {
                        var altTrim = alt.trim().toLowerCase();
                        var genericKeywords = ['image', 'img', 'logo', 'placeholder', 'banner', 'graphic', 'pic', 'picture', 'photo', 'sekkei'];
                        var isFilenamePattern = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(altTrim) || altTrim === fileName.toLowerCase();
                        var isGeneric = genericKeywords.indexOf(altTrim) !== -1 || altTrim.length < 3;

                        if (isFilenamePattern || isGeneric) {
                            results.push({
                                type: 'alt',
                                title: 'Weak/Generic Alt Text',
                                description: 'Image alt text "' + alt.substring(0, 24) + '" in "' + info.title + '" is generic or matches a filename. Use descriptive text for screen readers.',
                                elementId: info.id,
                                previewText: alt.substring(0, 30)
                            });
                        }
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

                // Helper to find inherited background color up the tree
                var getInheritedBgColor = function(element) {
                    var current = element;
                    while (current) {
                        var style = window.getComputedStyle(current);
                        var bg = style.backgroundColor;
                        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                            return bg;
                        }
                        if (current.tagName.toLowerCase() === 'body' || current.tagName.toLowerCase() === 'html') {
                            break;
                        }
                        current = current.parentElement;
                    }
                    // Fallback default: if inside elementor editor preview, it is typically white
                    return 'rgb(255, 255, 255)';
                };

                var textElements = previewDoc.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, button');
                textElements.forEach(function(el) {
                    if (el.closest('.elementor-editor-element-setting')) return;
                    
                    // Don't scan empty text containers
                    var textContent = (el.textContent || '').trim();
                    if (!textContent) return;

                    var style = window.getComputedStyle(el);
                    var color = style.color;
                    var bgColor = getInheritedBgColor(el);

                    var rgbColor = parseColor(color);
                    var rgbBg = parseColor(bgColor);

                    if (rgbColor && rgbBg) {
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
                                        description: 'Text element ("' + textContent.substring(0, 15) + '...") has low contrast ratio (' + ratio.toFixed(2) + ':1) against its inherited background (' + bgColor + '). Minimum recommended is 4.5:1.',
                                        elementId: info.id,
                                        previewText: ratio.toFixed(2) + ':1 ratio'
                                    });
                                }
                            }
                        }
                    }
                });

                // 9. Widget & Asset Bloat Audit (Total widgets count, empty text/heading, widget usage map)
                var widgetList = previewDoc.querySelectorAll('.elementor-widget');
                var totalWidgets = widgetList.length;
                var widgetCounts = {};

                // Audit empty core widgets
                widgetList.forEach(function(widget) {
                    var elType = widget.getAttribute('data-widget_type') || 'unknown';
                    // clean widget type (e.g. "heading.default" -> "heading")
                    var cleanType = elType.split('.')[0].replace('widget', '').replace('column', '').replace('section', '').trim();
                    cleanType = cleanType.charAt(0).toUpperCase() + cleanType.slice(1);
                    
                    // Count frequency
                    widgetCounts[cleanType] = (widgetCounts[cleanType] || 0) + 1;

                    // Skip checks on editor UI items
                    if (widget.closest('.elementor-editor-element-setting')) return;

                    var info = getElementInfo(widget);
                    var container = widget.querySelector('.elementor-widget-container');
                    var textContent = container ? (container.textContent || '').trim() : '';

                    if (cleanType === 'Heading' && !textContent) {
                        results.push({
                            type: 'empty',
                            title: 'Empty Heading Widget',
                            description: 'A Heading widget is empty. Delete it or enter heading text.',
                            elementId: info.id,
                            previewText: 'Empty Heading'
                        });
                    } else if (cleanType === 'Text-editor' && !textContent) {
                        results.push({
                            type: 'empty',
                            title: 'Empty Text Editor',
                            description: 'A Text Editor widget contains no text content. Delete it or add content.',
                            elementId: info.id,
                            previewText: 'Empty Text Editor'
                        });
                    } else if (cleanType === 'Button') {
                        var btnAnchor = widget.querySelector('a');
                        var btnText = btnAnchor ? (btnAnchor.textContent || '').trim() : '';
                        if (!btnText && !widget.querySelector('i, svg')) {
                            results.push({
                                type: 'empty',
                                title: 'Empty Button Widget',
                                description: 'Button widget in "' + info.title + '" has no text or icon.',
                                elementId: info.id,
                                previewText: 'Empty Button'
                            });
                        }
                    }
                });

                // Add warning for high widget count (bloat risk)
                if (totalWidgets > 50) {
                    results.push({
                        type: 'seo', // display as warning style
                        title: 'High Widget Count Warning',
                        description: 'This page loads ' + totalWidgets + ' widgets. A high widget count (over 50) increases DOM size and slows page speeds. Consider consolidating layouts.',
                        elementId: '',
                        previewText: totalWidgets + ' widgets'
                    });
                }

                // Send results back to Sekkei tool iframe
                var iframeEl = document.getElementById('itspc-panel-iframe');
                if (iframeEl && iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'itspc_audit_results',
                        results: results,
                        widgetCounts: widgetCounts
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

            // Scan for Scattered Custom CSS
            if (data.type === 'itspc_scan_scattered_css') {
                var doc = (typeof elementor !== 'undefined' && elementor.documents) ? elementor.documents.getCurrent() : null;
                var found = [];
                if (doc && doc.container) {
                    var walkContainersForCSS = function(container) {
                        if (!container) return;
                        var model = container.model;
                        if (model) {
                            var customCss = getModelSetting(container, 'custom_css');
                            if (customCss && customCss.trim()) {
                                var id = cleanId(getModelValue(container, 'id'));
                                var elType = getModelValue(container, 'elType');
                                var title = getModelSetting(container, '_title') || (elType ? (elType.charAt(0).toUpperCase() + elType.slice(1)) : 'Element');
                                found.push({
                                    id: id,
                                    title: cleanText(title, 120),
                                    elType: cleanText(elType, 80),
                                    css: customCss
                                });
                            }
                        }
                        var children = getContainerChildren(container);
                        children.forEach(function(child) {
                            walkContainersForCSS(child);
                        });
                    };
                    walkContainersForCSS(doc.container);
                }

                var iframeEl = document.getElementById('itspc-panel-iframe');
                if (iframeEl && iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'itspc_scattered_css_results',
                        results: found
                    }, window.location.origin);
                }
            }

            // Update Custom CSS back inside Elementor
            if (data.type === 'itspc_update_element_css' && data.elementId) {
                var doc = (typeof elementor !== 'undefined' && elementor.documents) ? elementor.documents.getCurrent() : null;
                if (doc && doc.container) {
                    var container = findElementorContainer(doc.container, cleanId(data.elementId), '');
                    if (container && container.model) {
                        if (typeof container.model.setSetting === 'function') {
                            container.model.setSetting('custom_css', data.css);
                        } else {
                            var settings = typeof container.model.get === 'function' ? container.model.get('settings') : container.model.settings;
                            if (settings && typeof settings.set === 'function') {
                                settings.set('custom_css', data.css);
                            } else if (settings) {
                                settings['custom_css'] = data.css;
                            }
                        }
                        
                        // Re-render
                        if (typeof container.render === 'function') {
                            container.render();
                        }
                        
                        // Trigger setting panel sync in editor sidebar if active
                        if (container.model.trigger) {
                            container.model.trigger('change');
                        }

                        // Send success notification back to iframe
                        var iframeEl = document.getElementById('itspc-panel-iframe');
                        if (iframeEl && iframeEl.contentWindow) {
                            iframeEl.contentWindow.postMessage({
                                type: 'itspc_update_element_css_success',
                                elementId: data.elementId
                            }, window.location.origin);
                        }
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

        // --- Panel Dragging and Floating Mode (Divi/Navigator style) ---
        var panelHeader = document.querySelector('.itspc-panel-header');
        if (panelHeader) {
            panelHeader.addEventListener('mousedown', function(e) {
                if (e.target.closest('#itspc-panel-close') || e.target.closest('#itspc-panel-popout') || e.target.closest('#itspc-page-name')) {
                    return;
                }
                if (e.button !== 0) return;
                isPanelDragging = true;
                panelStartX = e.clientX;
                panelStartY = e.clientY;
                var rect = panel.getBoundingClientRect();
                panelInitialLeft = rect.left;
                panelInitialTop = rect.top;
                panel.style.transition = 'none';
                panelHeader.style.cursor = 'grabbing';
                iframe.style.pointerEvents = 'none'; // Avoid mouse trap inside iframe during drag
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isPanelDragging) return;
                var dx = e.clientX - panelStartX;
                var dy = e.clientY - panelStartY;

                if (!panel.classList.contains('itspc-panel-floating')) {
                    panel.classList.add('itspc-panel-floating');
                    localStorage.setItem('itspc_panel_floating', '1');
                    panel.style.height = '80vh';
                    var rect = panel.getBoundingClientRect();
                    panelInitialLeft = rect.left;
                    panelInitialTop = rect.top;
                }

                var newLeft = panelInitialLeft + dx;
                var newTop = panelInitialTop + dy;

                var maxLeft = window.innerWidth - panel.offsetWidth - 10;
                var maxTop = window.innerHeight - panel.offsetHeight - 10;

                newLeft = Math.max(10, Math.min(newLeft, maxLeft));
                newTop = Math.max(10, Math.min(newTop, maxTop));

                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
            });

            document.addEventListener('mouseup', function() {
                if (!isPanelDragging) return;
                isPanelDragging = false;
                panel.style.transition = '';
                panelHeader.style.cursor = '';
                iframe.style.pointerEvents = 'auto';
                if (panel.classList.contains('itspc-panel-floating')) {
                    localStorage.setItem('itspc_panel_left', panel.style.left);
                    localStorage.setItem('itspc_panel_top', panel.style.top);
                    localStorage.setItem('itspc_panel_height', panel.style.height);
                }
            });

            // Touch support for dragging panel
            panelHeader.addEventListener('touchstart', function(e) {
                if (e.target.closest('#itspc-panel-close') || e.target.closest('#itspc-panel-popout') || e.target.closest('#itspc-page-name')) {
                    return;
                }
                var touch = e.touches[0];
                isPanelDragging = true;
                panelStartX = touch.clientX;
                panelStartY = touch.clientY;
                var rect = panel.getBoundingClientRect();
                panelInitialLeft = rect.left;
                panelInitialTop = rect.top;
                panel.style.transition = 'none';
                iframe.style.pointerEvents = 'none';
            });

            document.addEventListener('touchmove', function(e) {
                if (!isPanelDragging) return;
                var touch = e.touches[0];
                var dx = touch.clientX - panelStartX;
                var dy = touch.clientY - panelStartY;

                if (!panel.classList.contains('itspc-panel-floating')) {
                    panel.classList.add('itspc-panel-floating');
                    localStorage.setItem('itspc_panel_floating', '1');
                    panel.style.height = '80vh';
                    var rect = panel.getBoundingClientRect();
                    panelInitialLeft = rect.left;
                    panelInitialTop = rect.top;
                }

                var newLeft = panelInitialLeft + dx;
                var newTop = panelInitialTop + dy;

                var maxLeft = window.innerWidth - panel.offsetWidth - 10;
                var maxTop = window.innerHeight - panel.offsetHeight - 10;

                newLeft = Math.max(10, Math.min(newLeft, maxLeft));
                newTop = Math.max(10, Math.min(newTop, maxTop));

                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
            });

            document.addEventListener('touchend', function() {
                if (!isPanelDragging) return;
                isPanelDragging = false;
                panel.style.transition = '';
                iframe.style.pointerEvents = 'auto';
                if (panel.classList.contains('itspc-panel-floating')) {
                    localStorage.setItem('itspc_panel_left', panel.style.left);
                    localStorage.setItem('itspc_panel_top', panel.style.top);
                    localStorage.setItem('itspc_panel_height', panel.style.height);
                }
            });

            // Double-click to redock panel
            panelHeader.addEventListener('dblclick', function(e) {
                if (e.target.closest('#itspc-panel-close') || e.target.closest('#itspc-panel-popout') || e.target.closest('#itspc-page-name')) {
                    return;
                }
                panel.classList.remove('itspc-panel-floating');
                panel.style.left = '';
                panel.style.top = '';
                panel.style.height = '';
                localStorage.removeItem('itspc_panel_floating');
                localStorage.removeItem('itspc_panel_left');
                localStorage.removeItem('itspc_panel_top');
                localStorage.removeItem('itspc_panel_height');
            });
        }
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

