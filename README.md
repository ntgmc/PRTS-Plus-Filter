# PRTS Plus 干员持有筛选 (PRTS-Plus-Filter)

> 为 [zoot.plus](https://zoot.plus/) 作业查询提供基于“干员持有率”的智能筛选功能。支持“完美持有”与“助战模式”，提供**视觉降级**与**隐藏**双重显示模式，深度适配原生 UI 及[PRTS Plus 更好的暗黑模式](https://github.com/ntgmc/PRTS-Plus-Darkmode)。

![Version](https://img.shields.io/badge/Version-3.0-blue) ![Author](https://img.shields.io/badge/Author-一只摆烂的42_%26_Gemini_3_pro-orange)

## 📖 简介 | Introduction

在使用 zoot.plus 抄作业时，你是否遇到过打开一个作业却发现缺了好几个关键干员的尴尬？
**PRTS Plus 干员持有筛选** 插件旨在解决这个问题。它允许你导入自己的干员数据，并在浏览作业列表时，直观地告诉你哪些作业**可以直接抄**，哪些作业**缺人**。

**v3.0+ 重大更新：** 不再强制隐藏不满足条件的作业，而是采用“置灰+标记”的方式，让你对持有的作业情况一目了然。

### ✨ 核心功能

*   **💎 完美阵容模式**：高亮显示你拥有所有干员的作业（无需借人）。
*   **🤝 允许助战模式**：高亮显示仅缺少 1 名干员的作业。
    *   插件会自动计算缺失的干员，并在卡片上标记 **“🆘 需助战: [干员名]”**，借谁一目了然。
*   **👁️ 可视化筛选 (新)**：
    *   **置灰模式 (默认)**：不满足条件的作业会变灰（黑白+半透明），并标记 **“✘ 缺 N 人”**，鼠标悬停可查看详情。
    *   **隐藏模式**：直接隐藏不满足条件的作业，保持界面清爽。
    *   点击筛选栏右侧的 **“👁️/🚫”** 按钮即可一键切换。
*   **📱 全视图适配**：完美支持**网格视图**和**单列（列表）视图**。
*   **⚡ 极致性能**：
    *   引入 `Diff Update` 差量更新与 `requestAnimationFrame` 技术。
    *   彻底解决下滑加载、视图切换时的**频闪**与**卡顿**问题。
    *   稳定性修复：确保筛选按钮在任何加载情况下都不会消失。

## 📥 安装方法 | Installation

1.  安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/) (油猴)。
2.  [**点击这里安装脚本**](https://github.com/ntgmc/PRTS-Plus-Filter/raw/refs/heads/main/PRTS%20Plus%20%E5%B9%B2%E5%91%98%E6%8C%81%E6%9C%89%E7%AD%9B%E9%80%89.user.js)。
3.  打开 [zoot.plus](https://zoot.plus/) 即可看到筛选按钮出现在搜索框下方。

## 🛠️ 使用说明 | Usage

### 1. 导入干员数据
首次使用时，你需要点击 **“📂 导入干员”** 按钮。插件支持 `.json` 或 `.txt` 格式文件。

**数据格式要求：**
文件内容必须是一个 JSON 数组，包含干员的 `name` (中文名) 和 `own` (是否持有) 字段。

```json
[
  { "name": "史尔特尔", "own": true },
  { "name": "银灰", "own": true },
  { "name": "棘刺", "own": false }
]
```
> 💡 **提示**：你可以从 MAA (MaaAssistantArknights) 小工具-干员识别或其他明日方舟工具导出包含此格式的数据。

### 2. 筛选操作
*   点击 **“💎 完美阵容”**：高亮全持有作业，其他作业置灰（或隐藏）。
*   点击 **“🤝 允许助战”**：高亮缺0-1人的作业，其他作业置灰（或隐藏）。
*   点击 **“👁️ 置灰模式 / 🚫 隐藏模式”**：切换不满足条件作业的显示方式。插件会自动记忆你的选择。

## 🖼️ 预览 | Preview

### 日间模式 (置灰模式效果)
<img width="1430" height="909" alt="图片" src="https://github.com/user-attachments/assets/5e7f79ba-e6f0-4982-98b3-796526a13b23" />


### 暗黑模式 ([PRTS Plus 更好的暗黑模式](https://github.com/ntgmc/PRTS-Plus-Darkmode)插件风格)
<img width="1429" height="908" alt="图片" src="https://github.com/user-attachments/assets/b333de77-f466-4c1f-b894-eaa3f778f891" />


## ⚙️ 兼容性

*   **浏览器**：Chrome, Edge, Firefox (需安装 Tampermonkey)
*   **视图**：支持 Grid (网格) 和 List (列表/单列) 模式。
*   **配套脚本**：本脚本已深度适配 [**PRTS Plus 更好的暗黑模式**](https://github.com/ntgmc/PRTS-Plus-Darkmode) 脚本，两者同时使用效果最佳。

## 👨‍💻 作者

*   **一只摆烂的42**
*   **Gemini 3 pro** (AI Designer)

---
*Disclaimer: This script is a third-party tool and is not affiliated with HyperGryph or zoot.plus.*
```
