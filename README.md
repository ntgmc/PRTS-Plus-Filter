# PRTS Plus 干员持有筛选 (PRTS-Plus-Filter)

> 为 [zoot.plus](https://zoot.plus/) 作业查询提供基于“干员持有率”的智能筛选功能。支持“完美持有”与“助战模式”，深度适配原生 UI 及暗黑模式。

![Version](https://img.shields.io/badge/Version-2.7-blue) ![Author](https://img.shields.io/badge/Author-一只摆烂的42_%26_Gemini_3_pro-orange)

## 📖 简介 | Introduction

在使用 zoot.plus 抄作业时，你是否遇到过打开一个作业却发现缺了好几个关键干员的尴尬？
**PRTS Plus 干员持有筛选** 插件旨在解决这个问题。它允许你导入自己的干员数据，并在浏览作业列表时实时筛选出你**能够抄**的作业。

### ✨ 核心功能

*   **💎 完美阵容模式**：仅显示你拥有所有干员的作业（无需借人）。
*   **🤝 允许助战模式**：允许缺少 1 名干员。
    *   插件会自动计算缺失的干员，并在卡片上高亮显示 **“🆘 需助战: [干员名]”**，一目了然知道该借谁。
*   **🌓 智能双模 UI**：
    *   **日间模式**：完美融入 Blueprint 原生风格，清爽干净。
    *   **暗黑模式**：自动识别系统或插件的暗黑状态，切换为深色风格（硬朗边框、发光特效）。
*   **🚀 性能优化**：
    *   支持页面动态加载（无限滚动）。
    *   智能防抖，防止页面卡顿。
    *   自动屏蔽 `/create` 和 `/editor` 页面，互不干扰。

## 📥 安装方法 | Installation

1.  安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/) (油猴)。
2.  [**点击这里安装脚本**](https://github.com/ntgmc/PRTS-Plus-Filter/blob/main/PRTS%20Plus%20%E5%B9%B2%E5%91%98%E6%8C%81%E6%9C%89%E7%AD%9B%E9%80%89.user.js)。
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

### 2. 筛选模式
*   点击 **“💎 完美阵容”**：列表将只保留你完全持有的作业。
*   点击 **“🤝 允许助战”**：列表将保留缺 0-1 名干员的作业，并提示缺少的干员。
*   再次点击当前模式按钮即可 **取消筛选**，显示所有作业。

## 🖼️ 预览 | Preview

### 日间模式 (原生风格)
<img width="1279" height="912" alt="图片" src="https://github.com/user-attachments/assets/3ee9974a-7157-4672-b030-6f1d2ee3ad23" />


### 暗黑模式 ([PRTS Plus 更好的暗黑模式]插件风格)
<img width="1281" height="914" alt="图片" src="https://github.com/user-attachments/assets/6969db88-ca6b-4e6e-ba92-200ee6ffdfb6" />


## ⚙️ 兼容性

*   **浏览器**：Chrome, Edge, Firefox (需安装 Tampermonkey)
*   **配套脚本**：本脚本已深度适配 **[PRTS Plus 更好的暗黑模式]** 脚本，两者同时使用效果最佳。

## 📝 更新日志

### v2.7
*   ✅ **智能黑名单**：自动在 `/create` (创建作业) 和 `/editor` (编辑作业) 页面禁用插件，防止干扰操作。
*   ✅ **UI 统一**：统一了日间和暗黑模式下的按钮圆角弧度，视觉体验更一致。
*   ✅ **逻辑优化**：修复了页面路由跳转时按钮可能残留的问题。

### v2.5 - v2.6
*   ✨ 引入“罗德岛终端”暗黑风格。
*   ✨ 修复按钮在搜索框位置乱跑的 Bug。
*   ✨ 优化防抖逻辑，解决开启筛选后页面卡死的问题。

## 👨‍💻 作者

*   **一只摆烂的42**
*   **Gemini 3 pro** (AI Designer)

---
*Disclaimer: This script is a third-party tool and is not affiliated with HyperGryph or zoot.plus.*
