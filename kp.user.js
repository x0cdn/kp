// ==UserScript==
// @name         Kinopoisk → Mirrors0
// @namespace    https://github.com/x0cdn/kp
// @version      1.0.9
// @description  Зеркала в шапке + авто-перезагрузка после поиска + компактная фиксированная шапка + по 50 карточек
// @author       @x0cdn
// @match        https://www.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/x0cdn/kp/main/kp.user.js
// @downloadURL  https://raw.githubusercontent.com/x0cdn/kp/main/kp.user.js
// ==/UserScript==

(function () {
    'use strict';

    /* ============================================================
     *  МОДУЛЬ 1 — Зеркала текстом, закреплены внизу страницы
     * ============================================================ */
    (function mirrorsModule() {
        const mirrors = [
            { name: "Kinokino.win", base: "https://kinokino.win" },
     { name: "Ss.ru",        base: "https://sspoisk.ru" },
     { name: "kino.vin",     base: "https://kino.vin" },
     { name: "MEN",          base: "https://kinopoisk.men" },
     { name: "LAT",          base: "https://kinopoisk.lat" },
     { name: "CFD",          base: "https://kinopoisk.cfd" }
        ];

        let container = null;
        let spacer = null;
        let resizeObs = null;

        function getCurrentTypeAndId() {
            const path = window.location.pathname.toLowerCase();
            const match = path.match(/\/(film|series)\/(\d+)/i);
            return match ? { type: match[1], id: match[2] } : null;
        }

        // Спейсер внизу страницы, чтобы фиксированная панель не перекрывала контент
        function ensureSpacer() {
            if (spacer && spacer.isConnected) return spacer;
            spacer = document.getElementById('kp-mirrors-bottom-spacer');
            if (!spacer) {
                spacer = document.createElement('div');
                spacer.id = 'kp-mirrors-bottom-spacer';
                spacer.style.cssText = `
                height: 0;
                width: 100%;
                pointer-events: none;
                `;
                (document.body || document.documentElement).appendChild(spacer);
            }
            return spacer;
        }

        function updateSpacerHeight() {
            const sp = ensureSpacer();
            if (container) {
                sp.style.height = container.offsetHeight + 'px';
            }
        }

        function buildContainer() {
            const info = getCurrentTypeAndId();
            const el = document.createElement('div');
            el.id = 'kp-mirrors-buttons';
            el.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 2147483647;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 16px;
            padding: 6px 8px;
            font-family: Arial, sans-serif;
            background: #1f1f1f;
            box-sizing: border-box;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.5);
            `;

            mirrors.forEach(mirror => {
                const btn = document.createElement('a');
                btn.href = info ? `${mirror.base}/${info.type}/${info.id}` : `${mirror.base}/`;
                btn.target = "_blank";
                btn.textContent = mirror.name;
                btn.style.cssText = `
                color: #fff;
                text-decoration: none;
                font-weight: bold;
                font-size: 15px;
                white-space: nowrap;
                `;
                el.appendChild(btn);
            });
            return el;
        }

        function ensureMounted() {
            if (!container) container = buildContainer();

            if (!container.isConnected) {
                (document.body || document.documentElement).appendChild(container);
            } else {
                // Обновляем ссылки при смене URL
                const info = getCurrentTypeAndId();
                const links = container.querySelectorAll('a');
                mirrors.forEach((mirror, i) => {
                    if (links[i]) {
                        links[i].href = info
                        ? `${mirror.base}/${info.type}/${info.id}`
                        : `${mirror.base}/`;
                    }
                });
            }

            ensureSpacer();
            updateSpacerHeight();

            if (window.ResizeObserver && !resizeObs) {
                resizeObs = new ResizeObserver(() => updateSpacerHeight());
                resizeObs.observe(container);
            }
        }

        function isSearchUrl(url) {
            return url.includes('kp_query=') || url.includes('/s/') ||
            (url.includes('/index.php') && url.includes('query'));
        }

        let lastUrl = location.href;

        const checkUrlChange = () => {
            const currentUrl = location.href;
            if (currentUrl === lastUrl) return;
            lastUrl = currentUrl;

            if (isSearchUrl(currentUrl)) {
                setTimeout(() => location.reload(), 300);
                return;
            }
            ensureMounted();
        };

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(this, args);
            checkUrlChange();
        };
        history.replaceState = function (...args) {
            originalReplaceState.apply(this, args);
            checkUrlChange();
        };

        window.addEventListener('popstate', checkUrlChange);
        window.addEventListener('resize', updateSpacerHeight);

        new MutationObserver(checkUrlChange).observe(document, {
            subtree: true,
            childList: true
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', ensureMounted);
        } else {
            ensureMounted();
        }
    })();

    /* ============================================================
     *  МОДУЛЬ 2 — Фиксация шапки (вместе с зеркалами)
     * ============================================================ */
    (function stickyHeaderByJS() {
        let headerEl = null;
        let spacer = null;
        let fixedHeight = 0;

        const css = `
        #__next header:has(> [class*="styles_branding__"])
        > [class*="styles_branding__"] {
            display: none !important;
        }

        #__next header:has(> [class*="styles_branding__"]) {
        background-color: #1f1f1f !important;
        background-image: none !important;
        }

        #kp-header-spacer { display: none; }
        body.kp-header-fixed #kp-header-spacer { display: block; }

        body.kp-header-fixed #__next header:has(> [class*="styles_branding__"]) {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 2147483000 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5) !important;
        }

        body.kp-header-fixed #__next header:has(> [class*="styles_branding__"])
        > .header-navigation {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
        }

        body.kp-header-fixed .header-navigation > * {
            flex-shrink: 0 !important;
        }
        body.kp-header-fixed .styles_mainContainer__AqjDc {
            flex: 1 1 auto !important;
            min-width: 0 !important;
        }

        /* Зеркала внутри шапки — не сжимаем */
        #kp-mirrors-buttons { flex: 0 0 auto !important; }
        #kp-mirrors-buttons a { flex: 0 0 auto !important; }
        `;

        function injectStyle() {
            const old = document.getElementById('kp-js-sticky-header');
            if (old) old.remove();
            const style = document.createElement('style');
            style.id = 'kp-js-sticky-header';
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
        }

        function findHeader() {
            return document.querySelector(
                '#__next header [class*="styles_navigationWithBranding__"]'
            )?.closest('header');
        }

        function ensureSpacer() {
            if (spacer && spacer.isConnected) return spacer;
            spacer = document.getElementById('kp-header-spacer');
            if (!spacer) {
                spacer = document.createElement('div');
                spacer.id = 'kp-header-spacer';
            }
            if (headerEl && headerEl.parentNode) {
                if (headerEl.nextSibling) {
                    headerEl.parentNode.insertBefore(spacer, headerEl.nextSibling);
                } else {
                    headerEl.parentNode.appendChild(spacer);
                }
            }
            return spacer;
        }

        // Меряем ВСЮ шапку — вместе с зеркалами
        function measure() {
            if (!headerEl) return;
            const rect = headerEl.getBoundingClientRect();
            fixedHeight = Math.max(rect.height, 48);
            if (spacer) spacer.style.height = fixedHeight + 'px';
            document.documentElement.style.setProperty(
                '--kp-header-height',
                fixedHeight + 'px'
            );
        }

        function update() {
            if (headerEl && !headerEl.isConnected) {
                // React пересоздал шапку — сбрасываем и ищем заново
                headerEl = null;
                spacer = null;
                fixedHeight = 0;
            }

            if (!headerEl) {
                headerEl = findHeader();
                if (!headerEl) return;
                ensureSpacer();
                measure();
            }

            const scrollY = window.scrollY || window.pageYOffset;
            const headerDocTop = headerEl.getBoundingClientRect().top + scrollY;
            const threshold = headerDocTop + fixedHeight;

            const shouldFix = scrollY + fixedHeight >= threshold;

            if (shouldFix && !document.body.classList.contains('kp-header-fixed')) {
                measure();
                document.body.classList.add('kp-header-fixed');
                if (spacer) spacer.style.display = 'block';
            } else if (!shouldFix && document.body.classList.contains('kp-header-fixed')) {
                document.body.classList.remove('kp-header-fixed');
                if (spacer) spacer.style.display = 'none';
            }
        }

        function init() {
            injectStyle();
            let raf = null;
            const onScroll = () => {
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    update();
                    raf = null;
                });
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', () => { measure(); onScroll(); });

            const tryInit = () => {
                headerEl = findHeader();
                if (headerEl) {
                    ensureSpacer();
                    measure();
                    update();

                    // Следим за изменением высоты шапки (добавление зеркал,
                    // перенос на вторую строку и т.п.)
                    if (window.ResizeObserver) {
                        new ResizeObserver(() => measure()).observe(headerEl);
                    }
                } else {
                    setTimeout(tryInit, 500);
                }
            };
            tryInit();
        }

        if (document.body) {
            init();
        } else {
            document.addEventListener('DOMContentLoaded', init, { once: true });
        }
    })();

    /* ============================================================
     *  МОДУЛЬ 3 — По 50 карточек
     * ============================================================ */
    (function fiftyCardsModule() {
        const BATCH = 50;
        const WAIT_MS = 800;
        const MAX_STALLS = 5;
        const MAX_BATCH_CLICKS = 30;

        let loading = false;
        let initialized = false;

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

        function findButton() {
            return [...document.querySelectorAll('button, a, [role="button"]')]
            .find(el =>
            /показать\s*(ещё|еще)/i.test(el.textContent.trim()) &&
            el.getClientRects().length > 0
            );
        }

        function countCards(button) {
            if (!button) return 0;
            let parent = button.parentElement;
            for (let i = 0; i < 6 && parent; i++) {
                const links = parent.querySelectorAll(
                    'a[href*="/film/"], a[href*="/series/"]'
                );
                const unique = new Set([...links].map(a => a.pathname));
                if (unique.size >= 5) return unique.size;
                parent = parent.parentElement;
            }
            return 0;
        }

        async function waitForMore(previousCount) {
            for (let i = 0; i < 15; i++) {
                await sleep(WAIT_MS);
                const button = findButton();
                if (!button) return false;
                if (countCards(button) > previousCount) return true;
            }
            return false;
        }

        async function loadBatch(initial = false) {
            if (loading) return;
            loading = true;

            try {
                let button = findButton();
                if (!button) return;

                const startCount = countCards(button);
                const target = initial
                ? Math.max(BATCH, startCount)
                : startCount + BATCH;

                let stalls = 0;
                let clicks = 0;

                console.log(`[Kinopoisk] Цель: ${target} карточек`);

                while (clicks < MAX_BATCH_CLICKS) {
                    button = findButton();
                    if (!button) break;

                    const current = countCards(button);
                    if (current >= target) break;

                    button.click();
                    clicks++;

                    const changed = await waitForMore(current);
                    if (!changed) {
                        stalls++;
                        if (stalls >= MAX_STALLS) break;
                    } else {
                        stalls = 0;
                    }
                }

                console.log('[Kinopoisk] Загрузка завершена');
            } finally {
                loading = false;
            }
        }

        document.addEventListener('click', event => {
            if (loading) return;

            const button = event.target.closest('button, a, [role="button"]');
            if (!button) return;

            if (!/показать\s*(ещё|еще)/i.test(button.textContent.trim())) return;

            setTimeout(() => loadBatch(false), 300);
        }, true);

        function initCards() {
            const observer = new MutationObserver(() => {
                if (initialized || loading) return;
                if (findButton()) {
                    initialized = true;
                    loadBatch(true);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            if (findButton()) {
                initialized = true;
                loadBatch(true);
            }
        }

        if (document.body) {
            initCards();
        } else {
            document.addEventListener('DOMContentLoaded', initCards, { once: true });
        }
    })();

})();
