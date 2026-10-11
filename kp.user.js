// ==UserScript==
// @name         Kinopoisk → Mirrors
// @namespace    https://github.com/x0cdn/kp
// @version      1.4.1
// @description  Кнопки зеркал + авто-перезагрузка после поиска
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

    const mirrors = [
        { name: "LAT",          base: "https://kinopoisk.lat" },
        { name: "CFD",          base: "https://kinopoisk.cfd" },
        { name: "ONE",          base: "https://kinopoisk.one" },
        { name: "CAM",          base: "https://kinopoisk.cam" },
        { name: "Kinokino.win", base: "https://kinokino.win" },
        { name: "Kinokino.vip", base: "https://kinokino.vip" },
        { name: "Sspoisk.ru",   base: "https://sspoisk.ru" },
        { name: "Kinopoisk.gold", base: "https://kinopoisk.gold" },
        { name: "Kinopoisk.cx", base: "https://kinopoisk.cx" }
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
            margin-top: 100px;
            top: 0;
            left: 0;
            background: #1f1f1f;
            border-bottom: 3px solid #ffcc00;
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

        (document.body || document.documentElement).insertBefore(container, (document.body || document.documentElement).firstChild);
    }

    // Авто-перезагрузка после поиска
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

    // Перехват истории (React)
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

    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButtons);
    } else {
        createButtons();
    }
})();
