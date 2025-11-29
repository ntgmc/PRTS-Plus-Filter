// ==UserScript==
// @name         PRTS Plus 干员持有筛选
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  在 zoot.plus 搜索作业时，支持“完美持有”和“允许助战”双模式筛选。支持选择置灰/隐藏模式。
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
            margin-top: 12px !important;
            margin-bottom: 8px !important;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            width: 100%;
        }

        /* 按钮基础样式 */
        .prts-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.5rem 1rem !important;
            min-height: 32px !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            line-height: 1.25rem !important;
            border-radius: 0.375rem !important;
            cursor: pointer !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            background-color: #f6f7f9;
            color: #1c2127;
            box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.1);
            border: none !important;
            user-select: none;
        }

        /* 日间模式交互 */
        html:not(.dark) .prts-btn:hover {
            background-color: #edeff2 !important;
            transform: translateY(-1px);
        }

        /* 激活状态 */
        html:not(.dark) .prts-btn.prts-active {
            background-color: #2563eb !important;
            color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3) !important;
        }
        html:not(.dark) .prts-btn.prts-active .bp4-icon { color: #ffffff !important; }

        /* 设置按钮样式 */
        html:not(.dark) .prts-btn.prts-setting-active {
            background-color: #4b5563 !important;
            color: #ffffff !important;
        }
        html:not(.dark) .prts-btn.prts-setting-active .bp4-icon { color: #ffffff !important; }

        /* 暗黑模式适配 */
        html.dark .prts-btn {
            background-color: #2d2d30 !important;
            color: #e0e0e0 !important;
            border: 1px solid #38383b !important;
        }
        html.dark .prts-btn.prts-active {
            background-color: #5c8ae6 !important;
            color: #ffffff !important;
            border-color: #5c8ae6 !important;
        }

        .prts-btn .bp4-icon { margin-right: 8px !important; color: #5f6b7c; }
        html.dark .prts-btn .bp4-icon { color: #9ca3af !important; }

        /* --- 标签样式 --- */
        .prts-status-label {
            margin-top: 12px !important;
            padding-top: 8px !important;
            border-top: 1px dashed #e5e7eb !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.5 !important;
        }
        html.dark .prts-status-label { border-top-color: #444 !important; }

        .prts-label-support { color: #d97706 !important; }
        html.dark .prts-label-support { color: #ff9d2e !important; }

        .prts-label-missing { color: #dc2626 !important; }
        html.dark .prts-label-missing { color: #f87171 !important; }

        /* --- 卡片视觉降级 (置灰模式) --- */
        .prts-card-gray .bp4-card {
            opacity: 0.4 !important;
            filter: grayscale(0.9) !important;
            transition: opacity 0.2s ease, filter 0.2s ease !important;
            background-color: #f3f4f6 !important;
        }
        html.dark .prts-card-gray .bp4-card { background-color: #1a1a1a !important; }

        /* 悬停恢复 */
        .prts-card-gray:hover .bp4-card {
            opacity: 0.95 !important;
            filter: grayscale(0) !important;
        }
    `;
    GM_addStyle(adaptiveStyle);

    // --- 配置常量 ---
    const OPS_STORAGE_KEY = 'prts_plus_user_ops';
    const DISPLAY_MODE_KEY = 'prts_plus_display_mode'; // 'GRAY' | 'HIDE'

    // --- 状态管理 ---
    let currentFilterMode = 'NONE';
    let displayMode = GM_getValue(DISPLAY_MODE_KEY, 'GRAY');
    let ownedOpsSet = new Set();
    let debounceTimer = null;
    let isProcessing = false;
    let rafId = null;

    // --- 初始化 ---
    function init() {
        if (isPageDisabled()) return;
        loadOwnedOps();

        // 立即尝试注入
        injectControls();

        // 开启观察者
        observePageChanges();

        // 启动一个低频的安全检查，防止 React 路由切换时 Observer 漏掉 DOM 重绘
        setInterval(() => {
            if (!document.getElementById('prts-filter-bar')) {
                injectControls();
            }
        }, 2000);
    }

    // --- 工具函数 ---
    function isPageDisabled() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    // --- 数据处理 ---
    function loadOwnedOps() {
        const storedData = GM_getValue(OPS_STORAGE_KEY, '[]');
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
                    GM_setValue(OPS_STORAGE_KEY, jsonStr);
                    loadOwnedOps();
                    alert(`✅ 导入成功！\n共识别 ${json.length} 条数据，持有 ${ownedOpsSet.size} 名干员。`);
                    if (currentFilterMode !== 'NONE') requestUpdate();
                } catch (err) {
                    alert('❌ 导入失败，请检查文件格式。\n' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // --- 界面注入 (稳定版) ---
    function injectControls() {
        // 1. 检查是否在禁用页面
        if (isPageDisabled()) {
            const existingBar = document.getElementById('prts-filter-bar');
            if (existingBar) existingBar.remove();
            return;
        }

        // 2. 寻找锚点 (搜索框)
        const searchInputGroup = document.querySelector('.bp4-input-group');
        if (!searchInputGroup) return; // 搜索框没加载出来，暂不执行

        const anchorNode = searchInputGroup.parentElement;
        if (!anchorNode) return;

        // 3. 检查或创建 Bar
        let controlBar = document.getElementById('prts-filter-bar');

        if (!controlBar) {
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';

            const createBtn = (text, icon, onClick, id) => {
                const btn = document.createElement('button');
                btn.className = 'prts-btn';
                btn.id = id;
                btn.innerHTML = `<span class="bp4-icon" style="font-size: 16px;">${icon}</span>${text}`;
                btn.onclick = onClick;
                return btn;
            };

            const settingBtn = createBtn(
                getDisplayModeText(),
                displayMode === 'GRAY' ? '👁️' : '🚫',
                toggleDisplayMode,
                'btn-setting'
            );

            controlBar.append(
                createBtn('导入干员', '📂', handleImport, 'btn-import'),
                createBtn('完美阵容', '💎', () => toggleFilter('PERFECT'), 'btn-perfect'),
                createBtn('允许助战', '🤝', () => toggleFilter('SUPPORT'), 'btn-support'),
                settingBtn
            );
            updateButtonStyles();
        }

        // 4. 确保 Bar 在 DOM 中的位置正确 (应对 React 重绘)
        if (anchorNode.nextSibling !== controlBar) {
            anchorNode.parentNode.insertBefore(controlBar, anchorNode.nextSibling);
            // 重新插入后，如果当前有筛选模式，需要重新应用一下样式
            if (currentFilterMode !== 'NONE') requestUpdate();
        }
    }

    function getDisplayModeText() {
        return displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
    }

    function toggleDisplayMode() {
        displayMode = (displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        GM_setValue(DISPLAY_MODE_KEY, displayMode);

        const btn = document.getElementById('btn-setting');
        if (btn) {
            btn.innerHTML = `<span class="bp4-icon" style="font-size: 16px;">${displayMode === 'GRAY' ? '👁️' : '🚫'}</span>${getDisplayModeText()}`;
        }
        requestUpdate();
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            alert('请先导入干员数据！');
            return;
        }
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        updateButtonStyles();
        requestUpdate();
    }

    function updateButtonStyles() {
        const perfectBtn = document.getElementById('btn-perfect');
        const supportBtn = document.getElementById('btn-support');
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');

        if (currentFilterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (currentFilterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
    }

    // --- 高性能更新请求 ---
    function requestUpdate() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(applyFilter);
    }

    // --- 核心筛选逻辑 (差量更新) ---
    function applyFilter() {
        if (isPageDisabled()) return;
        isProcessing = true;

        try {
            // 兼容 Grid 和 List
            let cards = document.querySelectorAll('ul.grid > li, .tabular-nums ul > li');
            if (cards.length === 0) return;

            cards.forEach(card => {
                const cardInner = card.querySelector('.bp4-card');
                if (!cardInner) return;

                // --- 1. 数据分析 ---
                let isUnavailable = false;
                let statusType = null; // 'missing' | 'support' | null
                let statusValue = null;

                if (currentFilterMode !== 'NONE') {
                    const tags = Array.from(card.querySelectorAll('.bp4-tag'));
                    let requiredOps = [];

                    tags.forEach(tag => {
                        if (tag.querySelector('h4')) return; // 忽略关卡标题
                        const text = tag.innerText.trim();
                        // 过滤关键词
                        if (['普通', '突袭', 'Beta'].includes(text) ||
                            text.includes('活动关卡') || text.includes('剿灭') || text.includes('危机合约') ||
                            text.includes('|') || text.startsWith('[') || text.includes('更新') ||
                            text.includes('医疗') || text.includes('奶')) return;

                        const opName = text.split(/\s+/)[0];
                        if (opName && !['json', '作者'].includes(opName)) {
                            requiredOps.push(opName);
                        }
                    });

                    let missingCount = 0;
                    let missingOpName = '';
                    requiredOps.forEach(op => {
                        if (!ownedOpsSet.has(op)) {
                            missingCount++;
                            if (missingCount === 1) missingOpName = op;
                        }
                    });

                    // 判定状态
                    if (currentFilterMode === 'PERFECT') {
                        if (missingCount > 0) isUnavailable = true;
                    } else if (currentFilterMode === 'SUPPORT') {
                        if (missingCount > 1) isUnavailable = true;
                    }

                    if (isUnavailable) {
                        statusType = 'missing';
                        statusValue = missingCount;
                    } else if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                        statusType = 'support';
                        statusValue = missingOpName;
                    }
                }

                // --- 2. 差量 DOM 更新 ---

                // 处理 Hide 模式
                if (isUnavailable && displayMode === 'HIDE') {
                    if (card.style.display !== 'none') card.style.display = 'none';
                    return;
                } else {
                    if (card.style.display === 'none') card.style.display = '';
                }

                // 处理 Gray 模式
                const hasGrayClass = card.classList.contains('prts-card-gray');
                if (isUnavailable && displayMode === 'GRAY') {
                    if (!hasGrayClass) card.classList.add('prts-card-gray');
                } else {
                    if (hasGrayClass) card.classList.remove('prts-card-gray');
                }

                // 处理 Label
                const existingLabel = cardInner.querySelector('.prts-status-label');

                if (!statusType) {
                    if (existingLabel) existingLabel.remove();
                    return;
                }

                let newHtml = '';
                let newClass = 'prts-status-label';
                if (statusType === 'support') {
                    newClass += ' prts-label-support';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">🆘</span>需助战: ${statusValue}`;
                } else {
                    newClass += ' prts-label-missing';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">✘</span>缺 ${statusValue} 人`;
                }

                if (existingLabel) {
                    // 仅当内容改变时才操作DOM
                    if (existingLabel.innerHTML !== newHtml || existingLabel.className !== newClass) {
                        existingLabel.className = newClass;
                        existingLabel.innerHTML = newHtml;
                    }
                } else {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = newClass;
                    labelDiv.innerHTML = newHtml;
                    cardInner.appendChild(labelDiv);
                }
            });

        } finally {
            isProcessing = false;
        }
    }

    // --- 监听动态加载 ---
    function observePageChanges() {
        const observer = new MutationObserver((mutations) => {
            if (isProcessing) return;
            if (isPageDisabled()) return;

            // 只要 DOM 有子节点变动，就尝试去注入或筛选
            // 移除了 overly-specific 的检查，保证稳定性
            let domChanged = false;

            for (const mutation of mutations) {
                // 忽略我们自己的标签
                if (mutation.target.classList && mutation.target.classList.contains('prts-status-label')) continue;
                if (mutation.target.id === 'prts-filter-bar') continue;

                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    domChanged = true;
                    break;
                }
            }

            if (domChanged) {
                // 确保按钮栏存在
                injectControls();

                // 刷新筛选结果
                if (debounceTimer) clearTimeout(debounceTimer);
                debounceTimer = setTimeout(requestUpdate, 50);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    setTimeout(init, 1000);

})();
