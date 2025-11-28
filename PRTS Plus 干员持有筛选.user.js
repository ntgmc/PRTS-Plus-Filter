// ==UserScript==
// @name         PRTS Plus 干员持有筛选
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  在 zoot.plus 搜索作业时，支持“完美持有”和“允许助战”双模式筛选。已屏蔽 create 和 editor 页面，支持日夜模式自动切换。
// @author       一只摆烂的42 & Gemini 3 pro
// @match        https://zoot.plus/*
// @exclude      https://zoot.plus/create*
// @exclude      https://zoot.plus/editor*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. 样式定义 ---
    const adaptiveStyle = `
        /* 容器布局 */
        #prts-filter-bar {
            margin-top: 16px !important;
            margin-bottom: 8px !important;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            width: 100%;
        }

        /* 按钮基础样式 (全模式通用架构) */
        .prts-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.5rem 1rem !important;
            min-height: 32px !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            line-height: 1.25rem !important;
            border-radius: 0.375rem !important; /* 统一圆角 */
            cursor: pointer !important;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;

            /* 默认日间配色 */
            background-color: #f6f7f9;
            color: #1c2127;
            box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.1);
            border: none !important;
        }

        /* 强制日间模式配色 */
        html:not(.dark) .prts-btn {
            background-color: #f6f7f9 !important;
            color: #1c2127 !important;
            box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.1) !important;
        }

        .prts-btn .bp4-icon {
            margin-right: 8px !important;
            color: #5f6b7c;
        }

        /* 日间悬停 */
        html:not(.dark) .prts-btn:hover {
            background-color: #edeff2 !important;
            color: #1c2127 !important;
            box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.2) !important;
        }

        /* 日间激活 */
        html:not(.dark) .prts-btn.prts-active {
            background-color: #2563eb !important;
            color: #ffffff !important;
            box-shadow: none !important;
        }
        html:not(.dark) .prts-btn.prts-active .bp4-icon {
            color: #ffffff !important;
        }
        html:not(.dark) .prts-btn.prts-active:hover {
            background-color: #1d4ed8 !important;
        }

        /* 暗黑模式适配 */
        html.dark .prts-btn {
            background-color: #2d2d30 !important;
            color: #e0e0e0 !important;
            box-shadow: none !important;
            border: 1px solid #38383b !important;
        }
        html.dark .prts-btn .bp4-icon {
            color: #9ca3af !important;
        }
        html.dark .prts-btn:hover {
            background-color: #38383b !important;
            border-color: #555 !important;
        }
        html.dark .prts-btn.prts-active {
            background-color: #5c8ae6 !important;
            color: #ffffff !important;
            border-color: #5c8ae6 !important;
            box-shadow: 0 0 8px rgba(92, 138, 230, 0.4) !important;
        }

        /* 助战标签 */
        .prts-support-label {
            margin-top: 12px !important;
            padding-top: 12px !important;
            border-top: 1px dashed #e5e7eb !important;
            color: #d97706 !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
        }
        html.dark .prts-support-label {
            border-top-color: #444 !important;
            color: #ff9d2e !important;
        }
    `;
    GM_addStyle(adaptiveStyle);

    // --- 配置常量 ---
    const STORAGE_KEY = 'prts_plus_user_ops';

    // --- 状态管理 ---
    let currentFilterMode = 'NONE';
    let ownedOpsSet = new Set();
    let debounceTimer = null;

    // --- 工具：检测当前页面是否应该禁用脚本 ---
    function isPageDisabled() {
        const path = window.location.pathname;
        // 如果路径以 /create 或 /editor 开头，则禁用
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    // --- 初始化 ---
    function init() {
        // 如果初始加载就在禁用页面，直接不执行
        if (isPageDisabled()) return;

        loadOwnedOps();
        injectControls();
        observePageChanges(); // 必须保留监听，以便从 create 页面返回首页时重新激活
    }

    // --- 数据处理 ---
    function loadOwnedOps() {
        const storedData = GM_getValue(STORAGE_KEY, '[]');
        try {
            const ops = JSON.parse(storedData);
            ownedOpsSet = new Set(ops.filter(op => op.own === true).map(op => op.name));
            console.log(`[PRTS Filter] 已加载 ${ownedOpsSet.size} 名持有干员`);
        } catch (e) {
            console.error('[PRTS Filter] 数据解析失败', e);
        }
    }

    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const jsonStr = event.target.result;
                    const json = JSON.parse(jsonStr);
                    if (!Array.isArray(json)) throw new Error("非数组格式");
                    GM_setValue(STORAGE_KEY, jsonStr);
                    loadOwnedOps();
                    alert(`✅ 导入成功！\n共识别 ${json.length} 条数据，持有 ${ownedOpsSet.size} 名干员。`);
                    if (currentFilterMode !== 'NONE') applyFilter();
                } catch (err) {
                    alert('❌ 导入失败，请检查文件格式。\n' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // --- 界面注入 ---
    function injectControls() {
        // 1. 运行时检测：如果当前是 create/editor 页面，尝试移除控件并退出
        if (isPageDisabled()) {
            const existingBar = document.getElementById('prts-filter-bar');
            if (existingBar) existingBar.remove();
            return;
        }

        const searchInputGroup = document.querySelector('.bp4-input-group');
        if (!searchInputGroup) return;

        const anchorNode = searchInputGroup.parentElement;
        if (!anchorNode) return;

        let controlBar = document.getElementById('prts-filter-bar');

        if (!controlBar) {
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';

            const btnClass = 'prts-btn';

            const createBtn = (text, icon, onClick, id) => {
                const btn = document.createElement('button');
                btn.className = btnClass;
                btn.id = id;
                btn.innerHTML = `<span class="bp4-icon" style="font-size: 16px;">${icon}</span>${text}`;
                btn.onclick = onClick;
                return btn;
            };

            controlBar.append(
                createBtn('导入干员', '📂', handleImport, 'btn-import'),
                createBtn('完美阵容', '💎', () => toggleFilter('PERFECT'), 'btn-perfect'),
                createBtn('允许助战', '🤝', () => toggleFilter('SUPPORT'), 'btn-support')
            );

            updateButtonStyles();
        }

        if (anchorNode.nextSibling !== controlBar) {
            anchorNode.parentNode.insertBefore(controlBar, anchorNode.nextSibling);
        }
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            alert('请先导入干员数据！');
            return;
        }
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        updateButtonStyles();
        applyFilter();
    }

    function updateButtonStyles() {
        const perfectBtn = document.getElementById('btn-perfect');
        const supportBtn = document.getElementById('btn-support');
        if (!perfectBtn || !supportBtn) return;

        if (currentFilterMode === 'PERFECT') {
            perfectBtn.classList.add('prts-active');
            supportBtn.classList.remove('prts-active');
        } else if (currentFilterMode === 'SUPPORT') {
            supportBtn.classList.add('prts-active');
            perfectBtn.classList.remove('prts-active');
        } else {
            perfectBtn.classList.remove('prts-active');
            supportBtn.classList.remove('prts-active');
        }
    }

    // --- 筛选逻辑 ---
    function applyFilter() {
        // 同样在执行筛选前检查，如果是禁用页面则不执行
        if (isPageDisabled()) return;

        const cards = document.querySelectorAll('ul.grid > li');
        if (cards.length === 0) return;

        cards.forEach(card => {
            const oldLabel = card.querySelector('.prts-support-label');
            if (oldLabel) oldLabel.remove();

            if (currentFilterMode === 'NONE') {
                card.style.display = '';
                return;
            }

            const tags = Array.from(card.querySelectorAll('.bp4-tag'));
            let requiredOps = [];

            tags.forEach(tag => {
                const text = tag.innerText.trim();
                if (['普通', '突袭', 'Beta', '活动关卡'].includes(text) ||
                    text.includes('|') || text.startsWith('[') || text.includes('更新')) return;
                const opName = text.split(' ')[0];
                if (opName && !['json', '作者'].includes(opName)) requiredOps.push(opName);
            });

            let missingCount = 0;
            let missingOpName = '';

            requiredOps.forEach(op => {
                if (!ownedOpsSet.has(op)) {
                    missingCount++;
                    missingOpName = op;
                }
            });

            let shouldShow = false;
            if (currentFilterMode === 'PERFECT') shouldShow = (missingCount === 0);
            else if (currentFilterMode === 'SUPPORT') shouldShow = (missingCount <= 1);

            if (shouldShow) {
                card.style.display = '';
                if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                    addSupportLabel(card, missingOpName);
                }
            } else {
                card.style.display = 'none';
            }
        });
    }

    function addSupportLabel(cardLi, opName) {
        const cardInner = cardLi.querySelector('.bp4-card');
        if (!cardInner) return;
        const label = document.createElement('div');
        label.className = 'prts-support-label';
        label.innerHTML = `<span class="bp4-icon" style="margin-right:6px;">🆘</span>需助战: ${opName}`;
        cardInner.appendChild(label);
    }

    // --- 监听动态加载 ---
    function observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            // 每次页面变动，都重新检查路径。
            // 这样可以在用户从首页跳转到 create 时自动销毁按钮。
            if (isPageDisabled()) {
                const existingBar = document.getElementById('prts-filter-bar');
                if (existingBar) existingBar.remove();
                return; // 直接返回，不再执行筛选
            }

            let isScriptAction = false;
            let hasMeaningfulChange = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.id === 'prts-filter-bar' || node.classList.contains('prts-support-label')) {
                            isScriptAction = true;
                        } else {
                            hasMeaningfulChange = true;
                        }
                    }
                }
                for (const node of mutation.removedNodes) {
                    if (node.nodeType === 1 && node.classList.contains('prts-support-label')) isScriptAction = true;
                }
            }

            if (isScriptAction && !hasMeaningfulChange) return;

            if (hasMeaningfulChange || mutations.length > 0) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    injectControls();
                    if (currentFilterMode !== 'NONE') applyFilter();
                }, 300);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    setTimeout(init, 2000);

})();
