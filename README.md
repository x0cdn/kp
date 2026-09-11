# kp
kp-online

Install OrangeMonkey/GreaseMonkey & install UserScript

```javascript
// ==UserScript==
// @name         Kinopoisk → Mirrors (4 buttons)
// @namespace    https://github.com/
// @version      1.3
// @description  4 buttons. Support for Movies and TV Shows.
// @author       @x0cdn
// @match        https://www.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const mirrors = [
        { name: "Kinopoisk.cx",  base: "https://kinopoisk.cx" },
        { name: "Kinokino.vip",  base: "https://kinokino.vip" },
        { name: "Kinopoisk.gold", base: "https://kinopoisk.gold" },
        { name: "Sspoisk.ru",    base: "https://sspoisk.ru" }
    ];

    function getCurrentTypeAndId() {
        const path = window.location.pathname.toLowerCase();

        // A more reliable definition
        let match = path.match(/\/(film|series)\/(\d+)/i);
        if (match) {
            return { type: match[1], id: match[2] };
        }

        //  Additional Options (trailing slash, /view etc)
        match = path.match(/\/(film|series)\/(\d+)/i);
        if (match) {
            return { type: match[1], id: match[2] };
        }

        return null;
    }

    function createButtons() {
        const info = getCurrentTypeAndId();

        const container = document.createElement('div');
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
                href += '/'; // unless it's on the movie/TV show page
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

        // Add to the page
        const insertPoint = document.body || document.documentElement;
        insertPoint.insertBefore(container, insertPoint.firstChild);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButtons);
    } else {
        createButtons();
    }
})();
```
