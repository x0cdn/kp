# kp
kp-online

Install OrangeMonkey/GreaseMonkey & install UserScript

```javascript
// ==UserScript==
// @name         Kinopoisk → Mirrors (4 buttons)
// @namespace    https://github.com/
// @version      1.4
// @description  Buttons. Support for Movies and TV Shows. Page auto-reload.
// @author       @x0cdn
// @match        https://www.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const mirrors = [
        { name: "ONE",  base: "https://kinopoisk.one" },
        { name: "LAT",  base: "https://kinopoisk.lat" },
        { name: "CAM",  base: "https://kinopoisk.cam" },
        { name: "Kinokino.win",  base: "https://kinokino.win" },
        { name: "Kinokino.vip",  base: "https://kinokino.vip" },
        { name: "Sspoisk.ru",  base: "https://sspoisk.ru" },
        { name: "Kinopoisk.gold", base: "https://kinopoisk.gold" },
        { name: "Kinopoisk.cx",  base: "https://kinopoisk.cx" }
    ];

    function getCurrentTypeAndId() {
        const path = window.location.pathname.toLowerCase();
        let match = path.match(/\/(film|series)\/(\d+)/i);
        if (match) {
            return { type: match[1], id: match[2] };
        }
        return null;
    }

    function createButtons() {
        // delete old buttons
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
            right: 100;
            background: #1f1f1f;
            border-bottom: 3px solid #ffcc00;
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: left;
            gap: 14px;
            padding: 1px 0;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        `;

        mirrors.forEach(mirror => {
            const btn = document.createElement('a');
            let href = mirror.base;
            if (info) {
                href += `/${info.type}/${info.id}`;
            } else {
                href += '/';
            }
            btn.href = href;
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
            `;
            btn.addEventListener('mouseover', () => btn.style.transform = 'translateY(-2px)');
            btn.addEventListener('mouseout', () => btn.style.transform = 'none');
            container.appendChild(btn);
        });

        const insertPoint = document.body || document.documentElement;
        insertPoint.insertBefore(container, insertPoint.firstChild);
    }

    // === autoupdate page ===
    function isSearchUrl(url) {
        return (
            url.includes('kp_query=') ||
            url.includes('/s/') ||
            (url.includes('/index.php') && url.includes('query'))
        );
    }

    let lastUrl = location.href;

    // Отслеживаем изменение URL (для SPA-навигации)
    const checkUrlChange = () => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            // Если это страница поиска — принудительно перезагружаем
            if (isSearchUrl(currentUrl)) {
                // Небольшая задержка, чтобы навигация успела завершиться
                setTimeout(() => {
                    location.reload();
                }, 300);
                return;
            }

            // На обычных страницах просто пересоздаём кнопки
            createButtons();
        }
    };

    // Перехват pushState / replaceState (React использует их)
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

    // Дополнительно через MutationObserver (на случай, если history не сработает)
    new MutationObserver(checkUrlChange).observe(document, {
        subtree: true,
        childList: true
    });

    // Старт
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButtons);
    } else {
        createButtons();
    }
})();
```
