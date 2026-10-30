// ==UserScript==
// @name         Kinopoisk → Mirrors
// @namespace    https://github.com/x0cdn/kp
// @version      1.5
// Кнопки зеркал + авто-перезагрузка после поиска + компактная шапка + по 50 карточек
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
     *  МОДУЛЬ 1 — Кнопки зеркал + авто-перезагрузка после поиска
     * ============================================================ */
    (function mirrorsModule() {
        const mirrors = [
            { name: "MEN",          base: "https://kinopoisk.men" },
            { name: "LAT",          base: "https://kinopoisk.lat" },
            { name: "CFD",          base: "https://kinopoisk.cfd" },
            { name: "ONE v*",       base: "https://kinopoisk.one" },
            { name: "CAM v*",       base: "https://kinopoisk.cam" },
            { name: "Kinokino.win", base: "https://kinokino.win" },
            { name: "Ss.ru",        base: "https://sspoisk.ru" },
            { name: "Kinokino.vip", base: "https://kinokino.vip" },
            { name: ".gold *d",     base: "https://kinopoisk.gold" },
            { name: ".cx *d",       base: "https://kinopoisk.cx" }
        ];

        function getCurrentTypeAndId() {
            const path = window.location.pathname.toLowerCase();
            const match = path.match(/\/(film|series)\/(\d+)/i);
            return match ? { type: match[1], id: match[2] } : null;
        }

        function createButtons() {
            const old = document.getElementById('kp-mirrors-buttons');
            if (old) old.remove();

            const info = getCurrentTypeAndId();
            const container = document.createElement('div');
            container.id = 'kp-mirrors-buttons';
            container.style.cssText = `
                position: fixed;
                margin-top: 200px;
                top: 0;
                left: 0;
                background: #1f1f1f;
                z-index: 2147483647;
                display: flex;
                flex-direction: column;
                gap: 14px;
                padding: 8px 0;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
            `;

            mirrors.forEach(mirror => {
                const btn = document.createElement('a');
                btn.href = info ? `${mirror.base}/${info.type}/${info.id}` : `${mirror.base}/`;
                btn.target = "_blank";
                btn.textContent = mirror.name;
                btn.style.cssText = `
                    color: #fff;
                    background: linear-gradient(#ff8800, #ff5500);
                    padding: 10px 18px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 15px;
                    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                    transition: all 0.2s;
                    margin: 0 8px;
                `;
                btn.addEventListener('mouseover', () => btn.style.transform = 'translateY(-2px)');
                btn.addEventListener('mouseout',  () => btn.style.transform = 'none');
                container.appendChild(btn);
            });

            (document.body || document.documentElement).insertBefore(
                container,
                (document.body || document.documentElement).firstChild
            );
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
            createButtons();
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

        new MutationObserver(checkUrlChange).observe(document, {
            subtree: true,
            childList: true
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createButtons);
        } else {
            createButtons();
        }
    })();

    /* ============================================================
     *  МОДУЛЬ 2 — Компактная шапка на всех страницах
     * ============================================================ */
    (function compactHeaderModule() {
        const css = `
            #__next header:has(> [class*="styles_branding__"])
            > [class*="styles_branding__"] {
                display: none !important;
            }

            #__next header:has(> [class*="styles_branding__"]) {
                --header-height: 72px !important;
                height: 72px !important;
                min-height: 72px !important;
                max-height: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                background-image: none !important;
            }

            #__next header:has(> [class*="styles_branding__"])
            > .header-navigation {
                position: relative !important;
                top: 0 !important;
                bottom: auto !important;
                left: 0 !important;
                transform: none !important;
                margin-top: 0 !important;
                height: 72px !important;
                min-height: 72px !important;
                z-index: 1000 !important;
            }

            #__next header:has(> [class*="styles_branding__"])
            > [class*="styles_navigationWithBranding__"] {
                position: relative !important;
                top: 0 !important;
                bottom: auto !important;
                transform: none !important;
            }

            #__next [class*="rootWithBranding__"] {
                padding-top: 0 !important;
                margin-top: 0 !important;
                background-image: none !important;
            }
        `;

        const style = document.createElement('style');
        style.id = 'kp-compact-header-v7';
        style.textContent = css;

        function inject() {
            if (document.getElementById(style.id)) return;
            (document.head || document.documentElement).appendChild(style);
        }

        inject();
        document.addEventListener('DOMContentLoaded', inject, { once: true });
    })();

    /* ============================================================
     *  МОДУЛЬ 3 — По 50 карточек при открытии и «Показать ещё»
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

        // Безопасная инициализация: ждём появления document.body,
        // т.к. при @run-at document-start его ещё может не быть.
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
