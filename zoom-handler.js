(function () {
    'use strict';

    var MIN_ZOOM = 0.5;
    var MAX_ZOOM = 3;
    var ZOOM_STEP = 0.25;

    var zoomStates = new Map();

    function injectStyles() {
        if (document.getElementById('zoom-handler-styles')) return;
        var s = document.createElement('style');
        s.id = 'zoom-handler-styles';
        s.textContent =
            '.zoom-wrapper{position:relative;margin-bottom:8px}' +

            '.zoom-controls{' +
                'display:flex;align-items:center;justify-content:center;' +
                'gap:10px;padding:8px 0;margin-bottom:6px;' +
                'pointer-events:auto;' +
            '}' +
            '.zoom-btn{' +
                'width:44px;height:44px;border-radius:50%;' +
                'border:1.5px solid var(--border-light);' +
                'background:var(--card-light);' +
                'color:var(--primary);font-size:1.3rem;font-weight:700;' +
                'display:flex;align-items:center;justify-content:center;' +
                'cursor:pointer;transition:all .15s;' +
                'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
                'box-shadow:0 2px 8px rgba(0,0,0,.08);' +
                'user-select:none;-webkit-user-select:none;' +
                'line-height:1;padding:0;touch-action:manipulation;' +
            '}' +
            '.zoom-btn:active{transform:scale(.9);background:rgba(0,122,255,.12)}' +
            '.zoom-btn:disabled{opacity:.3;pointer-events:none}' +
            '.zoom-level{' +
                'min-width:52px;text-align:center;' +
                'font-size:.85rem;font-weight:700;color:var(--primary);' +
                'user-select:none;-webkit-user-select:none;' +
                'font-family:Tajawal,sans-serif;' +
                'direction:ltr;' +
            '}' +
            '.dark-mode .zoom-btn{' +
                'border-color:rgba(255,255,255,.12);' +
                'background:var(--card-dark);color:#5ac8fa;' +
                'box-shadow:0 2px 8px rgba(0,0,0,.3);' +
            '}' +
            '.dark-mode .zoom-btn:active{background:rgba(90,200,250,.15)}' +
            '.dark-mode .zoom-level{color:#5ac8fa}' +

            '.zoom-wrapper .canvas-scroll-container{' +
                'overflow:hidden !important;' +
                'touch-action:none;' +
                'display:flex;justify-content:center;align-items:center;' +
                'border-radius:12px;position:relative;' +
            '}' +
            '.zoom-wrapper .canvas-scroll-container canvas{' +
                'display:block !important;margin:0 !important;' +
                'max-width:none !important;border-radius:12px;' +
                'transition:transform .15s ease;' +
                'will-change:transform;flex-shrink:0;' +
                'touch-action:none;' +
            '}' +

            '.zoom-hint{' +
                'text-align:center;font-size:.72rem;color:#8e8e93;' +
                'margin-top:6px;opacity:.7;transition:opacity .4s;' +
                'font-family:Tajawal,sans-serif;' +
            '}' +
            '.zoom-hint.hidden-hint{opacity:0;pointer-events:none}' +
            '.dark-mode .zoom-hint{color:rgba(255,255,255,.35)}';
        document.head.appendChild(s);
    }

    function getDistance(t1, t2) {
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function initZoomForContainer(scrollContainer) {
        if (scrollContainer.dataset.zoomInit) return;
        scrollContainer.dataset.zoomInit = 'true';

        var canvas = scrollContainer.querySelector('canvas');
        if (!canvas) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'zoom-wrapper';

        var controls = document.createElement('div');
        controls.className = 'zoom-controls';
        controls.innerHTML =
            '<button class="zoom-btn zoom-out" aria-label="تصغير" tabindex="-1">\u2212</button>' +
            '<span class="zoom-level">100%</span>' +
            '<button class="zoom-btn zoom-in" aria-label="تكبير" tabindex="-1">+</button>';

        var hint = document.createElement('div');
        hint.className = 'zoom-hint';
        hint.textContent = '\u0627\u0633\u062D\u0628 \u0644\u0644\u0625\u0632\u0627\u062D\u0629 \u2022 \u0642\u0631\u0635\u0629 \u0644\u0644\u062A\u0643\u0628\u064A\u0631';

        scrollContainer.parentNode.insertBefore(wrapper, scrollContainer);
        wrapper.appendChild(controls);
        wrapper.appendChild(scrollContainer);
        wrapper.appendChild(hint);

        var currentZoom = 1;
        var panX = 0;
        var panY = 0;
        var zoomLevelEl = controls.querySelector('.zoom-level');
        var btnIn = controls.querySelector('.zoom-in');
        var btnOut = controls.querySelector('.zoom-out');

        function applyTransform() {
            canvas.style.transformOrigin = '0 0';
            canvas.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + currentZoom + ')';
        }

        function clampPan() {
            var cw = scrollContainer.clientWidth;
            var ch = scrollContainer.clientHeight;
            var sw = canvas.scrollWidth;
            var sh = canvas.scrollHeight;
            var scaledW = sw * currentZoom;
            var scaledH = sh * currentZoom;
            if (scaledW <= cw) {
                panX = (cw - scaledW) / 2;
            } else {
                panX = clamp(panX, cw - scaledW, 0);
            }
            if (scaledH <= ch) {
                panY = (ch - scaledH) / 2;
            } else {
                panY = clamp(panY, ch - scaledH, 0);
            }
        }

        function setZoom(newZoom, originX, originY) {
            newZoom = clamp(Math.round(newZoom * 100) / 100, MIN_ZOOM, MAX_ZOOM);
            if (newZoom === currentZoom) return;

            if (originX != null && originY != null) {
                var rect = scrollContainer.getBoundingClientRect();
                var cx = originX - rect.left;
                var cy = originY - rect.top;
                var oldScale = currentZoom;
                panX = cx - ((cx - panX) / oldScale) * newZoom;
                panY = cy - ((cy - panY) / oldScale) * newZoom;
            }

            currentZoom = newZoom;
            clampPan();
            applyTransform();

            zoomLevelEl.textContent = Math.round(currentZoom * 100) + '%';
            btnOut.disabled = currentZoom <= MIN_ZOOM;
            btnIn.disabled = currentZoom >= MAX_ZOOM;
            zoomStates.set(canvas.id || canvas, currentZoom);
        }

        btnIn.addEventListener('click', function (e) {
            e.stopPropagation();
            setZoom(currentZoom + ZOOM_STEP);
        });
        btnOut.addEventListener('click', function (e) {
            e.stopPropagation();
            setZoom(currentZoom - ZOOM_STEP);
        });

        var isDragging = false;
        var dragStartX, dragStartY, dragStartPanX, dragStartPanY;

        scrollContainer.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartPanX = panX;
            dragStartPanY = panY;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            panX = dragStartPanX + (e.clientX - dragStartX);
            panY = dragStartPanY + (e.clientY - dragStartY);
            clampPan();
            applyTransform();
        });

        document.addEventListener('mouseup', function () {
            isDragging = false;
        });

        var touchState = {};
        var lastTap = 0;

        scrollContainer.addEventListener('touchstart', function (e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                touchState.pinchDist = getDistance(e.touches[0], e.touches[1]);
                touchState.pinchZoom = currentZoom;
                touchState.pinchCount = 2;
                return;
            }
            if (e.touches.length === 1) {
                e.preventDefault();
                touchState.pinchCount = 1;
                touchState.startX = e.touches[0].clientX;
                touchState.startY = e.touches[0].clientY;
                touchState.startPanX = panX;
                touchState.startPanY = panY;
            }
        }, { passive: false });

        scrollContainer.addEventListener('touchmove', function (e) {
            if (e.touches.length === 2 && touchState.pinchCount === 2) {
                e.preventDefault();
                var dist = getDistance(e.touches[0], e.touches[1]);
                var scale = dist / touchState.pinchDist;
                var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                var my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                setZoom(touchState.pinchZoom * scale, mx, my);
                return;
            }
            if (e.touches.length === 1 && touchState.pinchCount === 1) {
                e.preventDefault();
                panX = touchState.startPanX + (e.touches[0].clientX - touchState.startX);
                panY = touchState.startPanY + (e.touches[0].clientY - touchState.startY);
                clampPan();
                applyTransform();
            }
        }, { passive: false });

        scrollContainer.addEventListener('touchend', function (e) {
            if (e.touches.length === 0 && touchState.pinchCount === 1) {
                var now = Date.now();
                if (now - lastTap < 300) {
                    setZoom(1);
                }
                lastTap = now;
            }
            if (e.touches.length < 2) touchState.pinchCount = 0;
        });

        scrollContainer.addEventListener('wheel', function (e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                var delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                setZoom(currentZoom + delta, e.clientX, e.clientY);
            }
        }, { passive: false });

        var hintHidden = false;
        function hideHint() {
            if (!hintHidden) {
                hint.classList.add('hidden-hint');
                hintHidden = true;
            }
        }
        scrollContainer.addEventListener('mousedown', hideHint);
        scrollContainer.addEventListener('touchstart', hideHint);

        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(function () {
                clampPan();
                applyTransform();
            }).observe(scrollContainer);
        }

        var prev = zoomStates.get(canvas.id || canvas);
        if (prev && prev !== 1) setZoom(prev);
    }

    function initAllCanvases() {
        document.querySelectorAll('.canvas-scroll-container:not([data-zoom-init])')
            .forEach(initZoomForContainer);
    }

    function boot() {
        injectStyles();
        initAllCanvases();

        var mainContent = document.getElementById('main-content');
        if (mainContent) {
            var obs = new MutationObserver(function () {
                requestAnimationFrame(initAllCanvases);
            });
            obs.observe(mainContent, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
