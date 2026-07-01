# AGENTS.md — AI 辅助开发指南

本文档指导团队成员如何使用 AI Agent（如 Claude Code、GitHub Copilot 等）提升开发效率。

> ⚠️ **重要前提**：本仓库的 `CLAUDE.md` 是给 AI 看的"项目规则书"。**Claude Code 自动读取并遵守**。用其他 AI 工具时请在 Prompt 开头加：
> ```
> 请先阅读仓库根目录的 CLAUDE.md、CONTRIBUTING.md，严格遵守其中的规范。
> ```

## 适用场景

| 小组 | 适用场景 |
|------|----------|
| ① 地图美工 | 生成图标 SVG、CSS 动画、UI 样式调整 |
| ② 交互功能 | 图像热区组件、地图缩放拖拽、前端 UI |
| ③ 平台搭建 | 项目脚手架、CI/CD、部署脚本、API 设计 |
| ④ 数据收集 | 批量生成 QA 知识库和建筑数据、数据校验、JSON 处理 |
| ⑤ 智能体训练 | RAG 管道、Prompt 工程、模型调用代码 |
| ⑥ 数据转换 | 像素坐标标注工具、数据合并脚本 |

## 各组的 Agent 使用建议

### ① 地图美工组

```
"在 assets/icons/ 下生成一套校园地图标注图标，统一风格，24x24px，适配手绘地图"

"为建筑热区添加 hover 放大动画和涟漪效果，配色与手绘风格协调"
```

### ② 交互功能组

```
"创建 CampusMap 组件：手绘扫描图为底图(img)，读取 data/positions/ 的 JSON 生成可点击热区，支持 CSS transform 缩放拖拽"

"创建 ChatWidget 组件，浮动在地图右下角，支持流式文本显示，对接后端 /api/chat"
```

### ③ 平台搭建组

```
"初始化前端项目（React + TypeScript + Vite），创建基础目录结构"

"编写 GitHub Actions 工作流，构建前端并部署"
```

### ④ 数据收集组

```
"站在南航新生的视角，列出关于【宿舍】的 20 个常见问题，并给出准确答案。
按 docs/templates/qa-knowledge.json 格式输出到 data/qa/qa-dorm.json。"

"帮我检查 data/qa/ 和 data/raw/ 下的数据，找出答案不准确或格式不符合模板的地方。"
```

### ⑤ 智能体训练组

```
"基于 LangChain 搭建 RAG 管道，以 data/qa/ 和 data/positions/ 为知识库，
提供 /api/chat 端点，支持流式输出。"
```

### ⑥ 数据转换组

```
"在 scripts/ 下创建 coordinate-picker.html：加载手绘地图扫描图，点击输出像素坐标。"

"编写脚本将 data/raw/ 的建筑信息与像素坐标合并，输出到 data/positions/。"
```

## Agent 使用原则

### ✅ 应该做的

1. **把 Agent 当作结对编程伙伴**：协助完成重复性、模板化工作
2. **提供充足的上下文**：告诉 Agent 地图是手绘的、QA 数据直接给大模型用
3. **Review 所有 AI 生成的代码**：每行代码都需要你理解并确认
4. **遵守项目规范**：见 CONTRIBUTING.md 和 CLAUDE.md

### ❌ 不应该做的

1. 不要直接提交未 Review 的代码
2. 不要泄露 API Key、密码等敏感信息
3. 不要让 Agent 代做架构决策
4. 不要引入 GIS 库（Leaflet、MapLibre、GeoJSON）
5. 生成 QA 数据时要核验答案准确性，AI 可能编造信息

## 用其他 AI 工具时的 Prompt 模板

```
你是 NUAAMap 项目的开发者。请遵守以下规范：
- 地图是手绘扫描图，坐标用像素(x,y)，不要引入 GIS 库
- ④组产出包括 QA 问答知识库和建筑信息，两者直接供大模型检索和前端展示
- 不要直接在 main 分支上改代码，每次建独立分支
- 分支前缀：map/ interact/ platform/ data/ ai/ convert/ docs/
- 提交格式：<type>(<scope>): <描述>
- 数据模板见 docs/templates/
```

## 常用 Prompt 模板

### 生成 QA 知识库（④组）
```
站在南航新生视角，列出关于【<主题>】的所有常见问题并给出准确答案。
格式严格遵循 docs/templates/qa-knowledge.json。
注意：答案必须基于真实信息，不确定的标为待核实。
```

### 创建新组件（②组）
```
在 frontend/src/components/ 下创建 <ComponentName> 组件。
功能：<描述>
注意：地图底图是手绘扫描图，坐标是像素坐标，不要引入 GIS 库。
```

### 代码 Review
```
Review 我的改动（<分支名/文件路径>），检查：
1. 数据格式是否符合模板规范
2. 是否误用了 GIS 库
3. Git 提交信息是否规范
```
