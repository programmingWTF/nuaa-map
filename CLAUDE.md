# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

NUAAMap 是南京航空航天大学天目湖校区的智能校园地图网站，面向新生及访客提供交互式地图浏览与 AI 智能问答服务。

- **仓库**：https://github.com/programmingWTF/nuaa-map.git
- **团队规模**：14 人，分 6 个小组（详见 README.md）
- **目标用户**：南航新生、访客
- **地图类型**：**手绘地图**（①组手绘 → 扫描为高清图片 → 前端以此为底图叠加交互热区）

## ⚠️ AI 工具行为准则（必读）

当团队成员使用 Claude Code 或其他 AI 工具来修改本仓库代码时，**必须**遵守以下规则。这些规则同样适用于你（AI）——每次被调用时自动执行。

### 修改代码前：必须先创建分支

**绝对禁止直接在 `main` 分支上提交代码。** 每次修改前：

```bash
git checkout main
git pull origin main
git checkout -b <前缀>/<功能描述>
```

### 分支前缀选择

根据修改内容自动选择：

| 修改内容 | 分支前缀 | 示例 |
|----------|----------|------|
| 地图底图、图标、CSS 样式、UI 设计 | `map/` | `map/add-library-icon` |
| 前端交互、地图点击、弹窗、聊天界面 | `interact/` | `interact/building-detail-panel` |
| 项目配置、构建脚本、部署、CI/CD | `platform/` | `platform/add-vite-config` |
| 数据文件（JSON、建筑信息） | `data/` | `data/add-canteen-info` |
| AI 智能体、RAG、聊天 API | `ai/` | `ai/setup-rag-pipeline` |
| 数据转换脚本、坐标标注 | `convert/` | `convert/mark-building-coords` |
| 项目文档 | `docs/` | `docs/update-readme` |

### 提交信息格式

必须使用 Conventional Commits：

```
<type>(<scope>): <中文描述>
```

- **type**：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `data` / `asset`
- **scope**：`map` / `interact` / `platform` / `data` / `ai` / `convert` / `docs`

### 完整工作流

每次帮用户修改代码时，按以下步骤执行：

```bash
# 1. 切到 main 并拉取最新
git checkout main && git pull origin main

# 2. 创建功能分支
git checkout -b <前缀>/<功能描述>

# 3. 修改代码...

# 4. 提交
git add -A
git commit -m "<type>(<scope>): <描述>"

# 5. 推送
git push origin <分支名>
```

推送后提醒用户：**"代码已推送到分支 `<分支名>`，请去 GitHub 创建 Pull Request 合并到 main。"**

### 遇到冲突时

如果 push 被拒绝（远程有新提交），先 `git pull origin main --rebase` 解决冲突后再 push。

---

## 技术架构

本项目为 Web 应用，核心思路：**手绘地图扫描图作为底图 → 前端叠加可点击热区 → 后端提供建筑详情与 AI 问答**。

1. **前端地图交互** — 以①组手绘地图的高清扫描图为底图，使用图片热区（image map）或 Canvas 叠加层实现建筑点击
2. **后端数据服务** — REST API，提供建筑信息查询、坐标数据接口
3. **AI 智能问答** — 基于 RAG（检索增强生成）的聊天机器人，知识库来源于④组的建筑/设施信息

### 数据流

```
①组手绘地图 → 高清扫描图（PNG/JPEG）
    → ⑥组在图上标注各建筑的像素坐标（x, y）
        → ②组前端以扫描图为底图，叠加点击热区
④组建筑信息 (JSON)
    → ⑥组合并坐标数据 → 前端可直接消费的 data/positions/ 文件
        → 后端 API 服务
            → ⑤组 AI 智能体知识库 (RAG)
                → 前端聊天界面
```

## 目录结构

```
nuaa-map/
├── assets/map/        # ①组交付：手绘地图扫描图、图标
├── data/raw/          # ④组交付：建筑信息 JSON（模板见 docs/templates/building-info.json）
├── data/positions/    # ⑥组产出：带像素坐标的完整建筑数据
├── frontend/          # ②③组：前端代码
├── backend/           # ③组：后端 API
├── ai-agent/          # ⑤组：智能体训练与 RAG 管道
├── scripts/           # 工具脚本（坐标标注辅助工具等）
├── docs/              # 项目文档
└── .github/           # CI/CD 配置
```

> 以上为规划结构，项目初始化后需各组确认并调整。

## 关键约定

### 地图与坐标

- ①组交付**手绘地图的高清扫描图**（建议 ≥ 4K 分辨率），放置于 `assets/map/`
- 坐标系统基于扫描图的**像素坐标**：以图片左上角为原点 (0, 0)，x 轴向右，y 轴向下
- ⑥组负责在手绘扫描图上标注每个建筑的像素位置和可点击区域
- 如果后续更新手绘地图导致坐标偏移，⑥组需重新校准

### 数据格式

- 所有建筑信息必须遵循 `docs/templates/building-info.json` 定义的模板
- 坐标使用**像素坐标系**：`pixelX`、`pixelY`（整数，相对于手绘地图扫描图）
- 每个建筑必须有唯一 `id`，格式：`building-<数字编号>`
- ④组只负责文字信息（名称、描述、设施、FAQ），坐标由⑥组补充

### 前端交互

- 地图交互采用"手绘图片 + 热区叠加"模式（不依赖 GIS/瓦片地图）
- 点击建筑热区 → 弹出详情面板，展示名称、图片、功能描述、开放时间、设施列表、FAQ
- AI 聊天入口独立于地图，以浮动按钮或侧边栏形式呈现
- 地图需支持缩放和拖拽（对高清扫描图做 CSS transform 或 Canvas 变换）

### 智能体

- 智能体通过 REST API 与前端通信
- 知识库以④组的建筑信息 JSON + FAQ 为基础构建
- 支持流式输出（Server-Sent Events 或 WebSocket），提升对话体验

### Git 分支

- `main` — 主分支，所有代码最终合并到这里
- 各组按前缀建分支：`map/` `interact/` `platform/` `data/` `ai/` `convert/`
- 提交信息遵循 Conventional Commits 格式（详见 CONTRIBUTING.md）

## 常见开发任务

### 添加新建筑数据（④组 → ⑥组）

1. ④组按 `docs/templates/building-info.json` 模板填写文字信息
2. 放入 `data/raw/building-<id>.json`
3. ⑥组在手绘地图上标注该建筑的像素坐标，补充 `position` 和 `clickArea` 字段
4. 输出到 `data/positions/building-<id>.json`
5. 提交时使用 `data(map): 添加xxx建筑信息`

### 更新手绘地图（①组）

1. 将新手绘地图扫描图放入 `assets/map/` 目录
2. 命名格式：`hand-drawn-map-v<版本号>.<扩展名>`
3. 更新 `assets/map/manifest.json`（记录当前底图版本和分辨率）
4. ⚠️ 如果地图布局有变化，通知⑥组重新标注坐标
5. 提交时使用 `asset(map): 更新手绘地图 vX`

### 前端开发（②③组）

- 参考 `CONTRIBUTING.md` 中的分支和提交规范
- 地图底图使用 `<img>` + 热区或 Canvas 方案，不使用 Leaflet/MapLibre 等 GIS 库
- 聊天组件需支持流式输出显示
- 地图缩放/拖拽推荐使用 CSS transform 或自建 Canvas 方案

### 坐标标注（⑥组）

- 在手绘地图扫描图上确定每个建筑的像素位置和可点击区域
- 可自制简易标注工具（HTML 页面点击取坐标）放在 `scripts/coordinate-picker.html`
- 输出格式见 `docs/templates/building-info.json` 中的 `position` 和 `clickArea` 字段

### 智能体开发（⑤组）

- 知识库文件来源于 `data/positions/` 目录（已含完整信息+坐标）
- RAG 管道代码放在 `ai-agent/` 目录
- API 接口需与③组协商确定协议

## 跨组依赖关系

```
①手绘地图扫描图 → ②前端渲染地图底图
①手绘地图 → ⑥标注像素坐标 → ②前端叠加热区
④建筑文字信息 → ⑥合并坐标 → ②前端展示详情 → ⑤智能体知识库
③后端/部署 → 所有模块的线上运行
⑤智能体API → ②前端聊天界面
```

各组交付物和接口约定详见 `CONTRIBUTING.md` 中的"跨组协作约定"部分。
