// ==UserScript==
// @name         PRTS Plus 更好的暗黑模式
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  修复“突袭”标签区分度不够的问题。深度适配 Tailwind、Blueprint 及 Markdown 样式。
// @author       一只摆烂的42 & Gemini 3 pro
// @match        https://zoot.plus/*
//
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. 罗德岛配色定义 ---
    const c = {
        bgDeep: '#18181c',      // 全局深底
        bgCard: '#232326',      // 卡片/弹窗
        bgHover: '#2d2d30',     // 悬浮/代码块
        border: '#38383b',      // 边框
        textMain: '#e0e0e0',    // 主字
        textSub: '#9ca3af',     // 辅字
        primary: '#5c8ae6',     // 罗德岛蓝

        // 专为突袭标签设计的配色
        tagRedBg: '#4a1e1e',    // 暗红背景
        tagRedText: '#fca5a5',  // 亮粉红文字
        tagRedBorder: '#7f1d1d' // 深红边框
    };

    // --- 2. CSS 样式 ---
    const cssStyle = `
        /* ==========================================================================
           第一部分：全局与 Tailwind 覆盖
           ========================================================================== */
        html, body, #root, #app,
        .bg-zinc-50, .bg-slate-50, .bg-gray-50, .bg-white,
        .bg-zinc-100, .bg-slate-100, .bg-gray-100 {
            background-color: ${c.bgDeep} !important;
            color: ${c.textMain} !important;
        }

        /* 修复顶部导航栏 */
        .bp4-navbar {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }

        /* ==========================================================================
           第二部分：抽屉 (Drawer) 与 弹窗
           ========================================================================== */
        .bp4-drawer, .bp4-drawer > section, .bp4-overlay-content {
            background-color: ${c.bgDeep} !important;
            color: ${c.textMain} !important;
        }
        .bp4-drawer .bg-slate-100,
        .bp4-drawer header,
        .bp4-drawer .text-lg.font-medium {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
        }
        .bp4-drawer .h-full.overflow-auto {
            background-color: ${c.bgDeep} !important;
        }

        /* ==========================================================================
           第三部分：组件通用美化
           ========================================================================== */
        .bp4-card, .card-container {
            background-color: ${c.bgCard} !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
            color: ${c.textMain} !important;
        }
        h1, h2, h3, h4, h5, .bp4-heading, strong { color: #fff !important; }
        .text-gray-700, .text-zinc-600, .text-slate-900, .text-gray-800 { color: ${c.textMain} !important; }
        .text-gray-500, .text-zinc-500 { color: ${c.textSub} !important; }

        /* 按钮与输入框 */
        .bp4-button {
            background-color: ${c.bgHover} !important;
            background-image: none !important;
            border: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
            box-shadow: none !important;
        }
        .bp4-button.bp4-intent-primary {
            background-color: ${c.primary} !important;
            color: #fff !important;
            border: none !important;
        }
        .bp4-input, textarea, select {
            background-color: ${c.bgHover} !important;
            color: #fff !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }
        .bp4-input::placeholder, textarea::placeholder { color: #666 !important; }

        /* ==========================================================================
           关键修复：标签 (Tag) 分类处理
           ========================================================================== */

        /* 1. 普通灰色标签 (普通难度/职业等) */
        .bp4-tag {
            background-color: #333 !important;
            color: #ccc !important;
            border: 1px solid #444 !important;
        }

        /* 2. 突袭/红色标签 (特指包含 bg-red-xxx 的标签) */
        .bp4-tag[class*="bg-red-"],
        .bp4-tag.bg-red-400 {
            background-color: ${c.tagRedBg} !important;
            color: ${c.tagRedText} !important;
            border-color: ${c.tagRedBorder} !important;
        }

        /* 修复头像背景 */
        .bg-orange-200 { background-color: #4a3020 !important; border-color: #6d4020 !important; }

        /* 滚动条 */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${c.bgDeep}; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }

        /* ==========================================================================
           第四部分：Markdown 内容深度适配
           ========================================================================== */
        .markdown-body {
            color: ${c.textMain} !important;
            background-color: transparent !important;
            font-family: inherit !important;
        }
        .markdown-body h1, .markdown-body h2, .markdown-body h3,
        .markdown-body h4, .markdown-body h5, .markdown-body h6 {
            color: #fff !important;
            border-bottom-color: ${c.border} !important;
        }
        .markdown-body pre, .markdown-body code, .markdown-body tt {
            background-color: ${c.bgHover} !important;
            color: ${c.textMain} !important;
            border-radius: 4px;
        }
        .markdown-body blockquote {
            color: ${c.textSub} !important;
            border-left-color: ${c.border} !important;
        }
        .markdown-body table tr {
            background-color: transparent !important;
            border-top-color: ${c.border} !important;
        }
        .markdown-body table tr:nth-child(2n) {
            background-color: rgba(255, 255, 255, 0.05) !important;
        }
        .markdown-body table td, .markdown-body table th {
            border-color: ${c.border} !important;
        }
        .markdown-body table th {
            font-weight: bold !important;
            color: #fff !important;
        }
        .markdown-body a {
            color: ${c.primary} !important;
        }
    `;

    // --- 3. 安全执行逻辑 ---
    GM_addStyle(cssStyle);

    setTimeout(() => {
        try { document.documentElement.classList.add('dark'); } catch (e) {}
    }, 500);

})();