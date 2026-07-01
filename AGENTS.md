# AGENTS.md — AI 辅助开发指南

本文档指导团队成员如何使用 AI Agent（如 Claude Code、GitHub Copilot 等）提升开发效率。

> ⚠️ **重要前提**：本仓库的 `CLAUDE.md` 文件是给 AI 工具看的"项目规则书"，里面规定了 AI 在改代码时必须先创建分支、遵循提交格式等。**Claude Code 会自动读取 CLAUDE.md 并遵守**。如果你用的是其他 AI 工具（ChatGPT、Cursor、Copilot 等），请在 Prompt 开头加上：
> ```
> 请先阅读仓库根目录的 CLAUDE.md、CONTRIBUTING.md 和 AGENTS.md，严格遵守其中的规范。
> ```

## 适用场景

每个小组都可以在以下场景利用 AI Agent：

| 小组 | 适用场景 |
|------|----------|
| ① 地图美工 | 生成图标 SVG、CSS 动画、UI 样式调整 |
| ② 交互功能 | 图像热区组件、地图缩放拖拽、前端 UI 实现 |
| ③ 平台搭建 | 项目脚手架、CI/CD 配置、部署脚本、API 设计 |
| ④ 数据收集 | 数据格式校验、批量数据清洗、JSON 生成 |
| ⑤ 智能体训练 | RAG 管道搭建、Prompt 工程、模型调用代码 |
| ⑥ 数据转换 | 像素坐标标注辅助工具、数据合并脚本 |

## 各组的 Agent 使用建议

### ① 地图美工组

```
# 示例用法 — 生成图标
"在 assets/icons/ 下生成一套校园地图标注图标(building-marker.svg, library-marker.svg 等)，统一风格，24x24 像素，适配手绘风格地图"

# 示例用法 — CSS 动效
"为建筑热区添加 hover 放大动画和点击后涟漪效果，配色与手绘地图风格协调"
```

### ② 交互功能组

```
# 示例用法 — 地图组件
"创建 CampusMap 组件：以手绘地图扫描图为底图(img)，读取 data/positions/ 下的 JSON 数据生成可点击热区，点击建筑弹出详情面板。支持 CSS transform 缩放拖拽。"

# 示例用法 — 聊天组件
"创建 ChatWidget 组件，浮动在地图右下角，支持流式文本显示，对接后端 /api/chat 接口"
```

### ③ 平台搭建组

```
# 示例用法 — 项目初始化
"初始化前端项目（React + TypeScript + Vite），创建基础目录结构"

# 示例用法 — 部署配置
"编写 GitHub Actions 工作流，构建前端并部署到 GitHub Pages"
```

### ④ 数据收集组

```
# 示例用法 — 批量生成模板
"根据 docs/templates/building-info.json 模板，对下面这些建筑生成对应的 JSON 文件（只填文字信息，position 和 clickArea 留空给⑥组）：..."
```

### ⑤ 智能体训练组

```
# 示例用法 — RAG 搭建
"基于 LangChain 搭建 RAG 管道，读取 data/positions/ 下的建筑 JSON 作为知识库，提供 /api/chat 端点"
```

### ⑥ 数据转换组

```
# 示例用法 — 坐标标注
"在 scripts/ 下创建一个 HTML 页面 coordinate-picker.html：加载 assets/map/ 中的手绘地图扫描图，点击图片输出像素坐标，方便标注建筑位置"

# 示例用法 — 数据合并
"编写脚本将 data/raw/ 下的建筑信息与手动画出的坐标合并，输出到 data/positions/"
```

## Agent 使用原则

### ✅ 应该做的

1. **把 Agent 当作结对编程伙伴**：写代码时让 AI 协助完成重复性、模板化的工作
2. **提供充足的上下文**：告诉 Agent 地图是手绘的、坐标是像素坐标、不要引入 GIS 库
3. **Review 所有 AI 生成的代码**：AI 是辅助工具，每一行代码都需要你理解并通过 Review
4. **复用项目中的规范**：让 Agent 遵守 CONTRIBUTING.md 和 CLAUDE.md 中约定的命名、数据格式、提交规范
5. **小步快跑**：每次让 Agent 完成一个小的、明确的任务，而不是一次性生成整个系统

### ❌ 不应该做的

1. **不要直接提交未 Review 的代码**：Agent 生成的代码可能有隐藏 bug 或不符合项目规范
2. **不要泄露敏感信息**：不在 Prompt 中包含 API Key、密码等敏感数据
3. **不要让 Agent 代你做架构决策**：Agent 可以提供建议，但技术选型和架构设计应由团队讨论决定
4. **不要过度依赖**：AI 生成的代码需要你理解其原理，尤其是核心业务逻辑
5. **不要引入 GIS 库**：本项目是手绘地图，不需要 Leaflet、MapLibre、GeoJSON 等地理信息工具

## 使用 Claude Code 的推荐工作流

1. 打开终端，进入项目目录
2. 运行 `claude` 启动 Claude Code
3. Claude Code 会**自动读取 CLAUDE.md**，遵守其中的分支、提交等规范
4. 描述你的任务，例如：

```
"读取 data/positions/building-001.json，用像素坐标创建可点击的建筑热区组件"
```

5. Claude Code 会自动创建分支 → 写代码 → 提交 → 推送
6. 你 Review 改动，确认无误后去 GitHub 创建 PR

### 用其他 AI 工具时

如果你用 ChatGPT、Cursor、Copilot 等工具来写代码，AI 不会自动读取 CLAUDE.md。请在 Prompt 开头加上：

```
你是 NUAAMap 项目的开发者。请遵守以下规范：
- 地图是手绘扫描图，坐标用像素(x,y)，不是经纬度
- 不要引入 Leaflet、MapLibre、GeoJSON 等 GIS 工具
- 不要直接在 main 分支上改代码，每次改动前创建独立分支
- 分支名用前缀：map/ interact/ platform/ data/ ai/ convert/ docs/
- 提交信息用 Conventional Commits：<type>(<scope>): <描述>
- 数据格式参考 docs/templates/building-info.json
- 完整规范见仓库根目录的 CONTRIBUTING.md
```

## 常用 Prompt 模板

### 创建新组件
```
在 frontend/src/components/ 下创建 <ComponentName> 组件。
功能：<描述功能>
输入/Props：<列出 props>
输出/行为：<描述行为>
注意：地图底图是手绘扫描图，坐标是像素坐标，不要引入 GIS 库。
参考文件：<相关文件路径>
```

### 调试问题
```
<描述 bug 现象>
相关文件：<文件路径>
帮我分析原因并修复。
```

### 数据转换/脚本
```
编写脚本 scripts/<name>.js，功能：<描述>
输入：<输入文件路径，附格式说明>
输出：<输出文件路径，附格式说明>
```

### 代码 Review
```
Review 我的改动（<分支名或文件路径>），检查：
1. 是否遵循项目约定的数据格式（像素坐标，非经纬度）
2. 是否有潜在的性能问题
3. Git 提交信息是否符合规范
4. 是否误用了 GIS 相关库
```
