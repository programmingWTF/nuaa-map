---
description: NUAAMap 项目规则书 — AI 工具自动读取并遵守
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**NUAAMap** 是南京航空航天大学天目湖校区的智能校园地图网站，面向新生及访客提供交互式地图浏览与 AI 智能问答服务。

| 项目属性 | 详情 |
|----------|------|
| 仓库地址 | https://github.com/programmingWTF/nuaa-map.git |
| 团队规模 | 14 人，分 6 个小组（详见 [README.md](README.md)） |
| 目标用户 | 南航新生、访客 |
| 地图类型 | **手绘地图**（①组手绘 → 扫描为高清图片 → 前端以此为底图叠加交互热区） |
| 当前底图 | 官方卫星底图 `frontend/public/tianmuhu-map.jpg`（3840×3328 像素，提取自 map.nuaa.edu.cn） |
| 建筑数量 | 36 栋天目湖真实建筑（坐标提取自官方地图 XML API） |

## AI 工具行为准则（必读）

当团队成员使用 Claude Code 或其他 AI 工具来修改本仓库代码时，**必须**遵守以下规则。这些规则同样适用于你（AI）——每次被调用时自动执行。

### 修改代码前：必须先创建分支

> [!IMPORTANT]
> **绝对禁止直接在 `main` 分支上提交代码。**

每次修改前：

```bash
git checkout main
git pull origin main
git checkout -b <前缀>/<功能描述>
```

### 分支前缀选择

| 修改内容 | 分支前缀 | 示例 |
|----------|----------|------|
| 地图底图、图标、CSS 样式、UI 设计 | `map/` | `map/add-library-icon` |
| 前端交互、地图点击、弹窗、聊天界面 | `interact/` | `interact/building-detail-panel` |
| 项目配置、构建脚本、部署、CI/CD | `platform/` | `platform/add-vite-config` |
| QA 知识库、建筑数据 | `data/` | `data/add-dormitory-qa` |
| AI 智能体、RAG、聊天 API | `ai/` | `ai/setup-rag-pipeline` |
| 数据转换脚本、坐标标注 | `convert/` | `convert/mark-building-coords` |
| 项目文档 | `docs/` | `docs/update-readme` |

### 提交信息格式

必须使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <中文描述>
```

| 字段 | 可选值 |
|------|--------|
| **type** | `feat` `fix` `docs` `style` `refactor` `test` `chore` `data` `asset` |
| **scope** | `map` `interact` `platform` `data` `ai` `convert` `docs` |

示例：

```
feat(interact): 点击建筑热区弹出详情面板
data(ai): 添加宿舍区问答数据
data(map): 更新东区宿舍楼建筑信息
fix(interact): 修复弹窗在上方时离热区过远的问题
style(interact): 为新生问答窗口添加航迹云主题动画
docs(docs): 统一使用 GitHub 标准 Alert 语法
```

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

推送后提醒用户：**代码已推送到分支 `<分支名>`，请去 GitHub 创建 Pull Request 合并到 main。**

### 遇到冲突时

如果 push 被拒绝（远程有新提交），先解决冲突后再 push：

```bash
git pull origin main --rebase
# 解决冲突后继续
git push origin <分支名>
```

### Issue 规范

> [!IMPORTANT]
> **提 Issue 是团队协作的第一步。** Bug 报告让问题可追溯，功能请求让想法可讨论。

#### 标题格式

Issue 标题统一使用以下格式：

| 类型 | 前缀 | 示例 |
|------|------|------|
| Bug 报告 | `[Bug]` | `[Bug] 地图缩放：双指捏合后标记偏移` |
| 功能请求 | `[Feat]` | `[Feat] 搜索栏：支持拼音模糊搜索` |
| 文档改进 | `[Docs]` | `[Docs] CONTRIBUTING.md 补充截图说明` |
| 问题咨询 | `[Question]` | `[Question] RAG 管道用什么向量数据库` |

#### 标签体系

| 标签 | 用途 |
|------|------|
| `bug` | 功能异常，需要修复 |
| `enhancement` | 新功能 / 改进建议 |
| `documentation` | 文档相关 |
| `question` | 需要讨论或答疑 |
| `good first issue` | 适合新手上手 |

> [!TIP]
> 标签可与小组关联——在 Issue 描述中用 `@②交互功能` 或 `涉及小组：③平台搭建` 来指定责任人。

#### 模板选择

在 GitHub 仓库点击 **New Issue** 后会看到两个模板：

| 模板 | 何时使用 |
|------|----------|
| **Bug 报告** | 发现页面崩溃、交互异常、数据显示错误等问题 |
| **功能请求** | 有新想法、改进建议、需要新数据支持的功能 |

如果两个模板都不适用，点击页面底部的 **"Open a blank issue"** 自由填写。

#### 认领 Issue：怎么知道有没有人在做

在动手改代码之前，先确认没人已经在做这个 Issue：

| 方法 | 怎么看 |
|------|--------|
| 看 Assignee | Issue 页面右侧 **Assignees** 栏有头像 → **有人在做了**，换一个 |
| 看 Linked PR | Issue 时间线里有 "linked a pull request" → 已经有 PR 在修了 |
| 没人做？ | 在评论区发一句「我来做这个」，然后点右侧 Assignees → 把自己设上去 |

> [!IMPORTANT]
> **动手前先 Assign。** 避免两个人闷头修同一个 Bug，最后白干。

#### PR 引用 Issue：自动关闭

在 PR 描述中用 GitHub 关键词引用 Issue，合并后 Issue 会**自动关闭**：

```markdown
Closes #58
```

等价写法：`Fixes #58` / `Resolves #58`。可以一行引用多个：`Closes #58, closes #59`。

> [!TIP]
> 在 PR 描述的第一行就写上 `Closes #编号`，这样 Reviewer 点进 PR 就能直接跳去看 Issue 上下文。

---

## 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19 + TypeScript | 组件化开发，类型安全 |
| 构建工具 | Vite 8 | 极速 HMR 开发体验 |
| 样式方案 | CSS Custom Properties | 设计令牌体系，`frontend/src/index.css` 的 `:root {}` 中集中管理 |
| 地图方案 | 手绘扫描图 + CSS Transform | 不依赖 GIS/瓦片地图库，像素坐标热区叠加 |
| 后端 API | FastAPI / Express（待开发）| RESTful API，流式输出支持 |
| AI 智能体 | LangChain + RAG（待开发）| 检索增强生成，知识库基于④组 QA 数据 |
| 数据格式 | JSON | 建筑信息 + QA 知识库，统一 JSON Schema |

### 三条主线

本项目分为三条并行的开发线：

1. **地图交互线**：手绘地图扫描图 → ⑥标注像素坐标 → ②前端热区叠加
2. **AI 问答线**（核心）：④组采集 QA 知识库 → ⑤组直接用于 RAG / Prompt → 前端聊天界面
3. **后端服务线**：③搭建 API 服务器，承接前端请求，转发智能体调用

### 数据流

```
┌─ 地图交互线 ──────────────────────────────────────────┐
│  ①手绘地图扫描图                                        │
│      → ⑥组标注像素坐标                                  │
│          → ②组前端：底图 + 热区叠加                      │
│  ④组建筑信息 → ⑥合并坐标 → ②前端详情面板                │
│                                                        │
│  [当前开发阶段]                                          │
│  官方地图瓦片 → 拼接 → tianmuhu-map.jpg (3840×3328)     │
│      → XML API 提取坐标 → mock-buildings.json (36栋)    │
│          → 前端热区叠加                                   │
└────────────────────────────────────────────────────────┘

┌─ AI 问答线 ───────────────────────────────────────────┐
│  ④组 QA 知识库 → data/qa/                              │
│      → ⑤组 RAG 检索 + Prompt 工程                       │
│          → 后端 /api/chat                               │
│              → ②组前端 ChatWidget / BuildingPopover      │
└────────────────────────────────────────────────────────┘
```

> [!NOTE]
> ④组的 QA 知识库直接供给⑤组使用，无需⑥组转换。两条线并行推进，同等重要。

---

## 目录结构

```
nuaa-map/
├── frontend/                    # ✅ ②③组：前端（React + TypeScript + Vite）
│   ├── public/
│   │   └── tianmuhu-map.jpg     # ✅ 天目湖校区卫星底图（3840×3328）
│   └── src/
│       ├── components/          # UI 组件
│       │   ├── MapView/         # 地图容器（缩放/拖拽）+ HotspotLayer 热区层
│       │   ├── BuildingPopover/ # 建筑气泡弹窗（内嵌建筑专属 AI 问答）
│       │   ├── ChatWidget/      # AI 浮动聊天组件（呼吸光晕按钮）
│       │   ├── FreshmanWindow/  # 新生问答窗口（航迹云主题动画）
│       │   ├── Minimap/         # 缩略图导航（左下角，支持拖拽实时平移）
│       │   ├── SearchBar/       # 建筑搜索栏
│       │   └── TopBar/          # 顶部导航栏（Logo + 搜索入口）
│       ├── hooks/               # 自定义 Hook
│       │   └── useMapInteraction.ts  # 地图交互（滚轮/捏合缩放、拖拽平移）
│       ├── types/               # TypeScript 类型定义
│       │   └── index.ts         # Building, MapTransform, ChatMessage 等
│       └── data/                # 建筑数据
│           └── mock-buildings.json  # 36 栋天目湖真实建筑 + 像素坐标
├── assets/map/
│   └── tiles-tianmuhu/          # ✅ 天目湖官方地图瓦片（195 张 zoom3 瓦片）
├── data/
│   ├── extracted-map/           # ✅ 官方地图 XML API 提取的原始数据与文档
│   │   ├── README.md            # 提取方法说明
│   │   ├── tianmuhu-buildings-xml.json   # 36 栋建筑 XML 原始坐标
│   │   ├── tianmuhu-buildings.json       # 坐标转换后的建筑数据
│   │   └── tianmuhu-buildings-local.json # 本地坐标系建筑数据
│   ├── qa/                      # ✅ ④组：问答知识库 → ⑤组直接使用
│   ├── raw/                     # ✅ ④组：建筑信息 JSON（无坐标）
│   └── positions/               # 📋 ⑥组：建筑信息 + 像素坐标 → ②前端（待创建）
├── backend/                     # 📋 ③组：后端 API
├── ai-agent/                    # 📋 ⑤组：RAG 管道
├── scripts/
│   ├── stitch-tianmuhu-tiles.py # ✅ 瓦片拼接脚本
│   ├── upload-to-r2.cjs         # ✅ R2 图片上传脚本
│   └── bot/                     # ✅ GitHub Bot 自动化脚本
│       └── sweep.mjs            # Issue/PR 自动分类与标签管理
├── docs/
│   ├── templates/               # 数据模板
│   │   ├── qa-knowledge.json    # QA 知识库模板
│   │   └── building-info.json   # 建筑信息模板
│   ├── team.md                  # 各组详细职责
│   ├── github-guide.md          # GitHub 协作入门指南
│   └── labels.md                # 标签体系说明
├── .github/
│   └── workflows/               # ✅ CI/CD 工作流
│       ├── deploy.yml           # 自动部署到 NAS 服务器
│       ├── bot-labels.yml       # Bot 自动标签
│       └── bot-stale.yml        # 过期 Issue 自动关闭
├── CLAUDE.md                    # 项目规则书（本文件，AI 自动读取）
├── AGENTS.md                    # AI 辅助开发指南（面向团队成员）
├── CONTRIBUTING.md              # 团队协作规范
└── README.md                    # 项目说明
```

> ✅ = 已搭建 | 📋 = 规划中

---

## 关键约定

### 地图与坐标

- **当前底图**：`frontend/public/tianmuhu-map.jpg`（3840×3328 像素），由官方地图瓦片拼接而成
- **瓦片来源**：`https://map.nuaa.edu.cn/mapdata/zoom3/{col}_{row}.jpg`（col 44–58, row 13–25，共 195 张）
- **拼接脚本**：`scripts/stitch-tianmuhu-tiles.py`
- **坐标系统**：基于地图图片的**像素坐标**，以图片左上角为原点 (0, 0)，x 轴向右，y 轴向下
- **①组手绘地图交付后**：替换 `MAP_SRC` 常量，⑥组重新标注坐标
- **⑥组职责**：在每个建筑上标注像素位置和可点击区域

#### 从官方地图 API 提取建筑坐标

官方地图网站 `map.nuaa.edu.cn` 使用瓦片 + XML 标记系统，建筑数据通过 XML 文件暴露。

**1. API 端点**

```
https://map.nuaa.edu.cn/xml/gadgets/{zoom}/{col},{row}.xml
```

| 参数 | 天目湖校区范围 |
|------|---------------|
| Zoom 3 | col 43–51, row 13–17 |
| Zoom 4 | col 19–27, row 5–9 |

**2. XML 格式**

```xml
<gadgets>
  <gadget>
    <id>878</id>           <!-- 唯一标识 -->
    <x0>48682</x0>         <!-- 全局 X 坐标（Zoom 5 级别像素） -->
    <y0>15428</y0>         <!-- 全局 Y 坐标（Zoom 5 级别像素） -->
    <type>1</type>         <!-- 1=建筑名称标签, 6=全景VR链接, 7=停车场, 15=校门图标 -->
    <title>巡天楼</title>    <!-- 建筑名称 -->
    <url />                <!-- type=6 时含全景 URL -->
    <maxzoom>4</maxzoom>
  </gadget>
</gadgets>
```

**3. 坐标转换公式**

XML 中的 `(x0, y0)` 是全局 Zoom 5 像素坐标，需转换为当前底图的 Zoom 3 像素坐标：

```
// 合并公式（一步到位）
pixel_x = round(x0 / 4 - 10287)
pixel_y = round(y0 / 4 - 2326)
```

**4. 注意事项**

- **校区切换**：网站默认显示「明故宫校区」，需点击左上角校区按钮切换到「天目湖校区」。此切换会影响页面 DOM 中的建筑列表，但不影响 XML API——API 的瓦片坐标因校区而异（天目湖 zoom 3 的 col/row 远大于明故宫）
- **type 含义**：只有 `type=1` 是建筑名称标签（核心数据）；`type=6` 是全景 VR 链接（与 type=1 重叠但含 `url` 字段）；`type=7` 是停车场；`type=15` 是校门图标。提取建筑清单时只需 `type=1`，按 `title` 去重
- **提取脚本参考**：`data/extracted-map/tianmuhu-buildings-xml.json` 包含 2026-07-04 提取的全部 36 栋建筑原始坐标
- **采集方法**：用 Playwright 打开网站 → 切换到目标校区 → 用 `fetch()` 批量请求 XML → 解析并转换坐标。也可直接在浏览器控制台中执行 `fetch()` 请求（同域无 CORS 限制）

### 数据格式

- **QA 知识库**：遵循 `docs/templates/qa-knowledge.json`，按主题分类，每主题一个文件 `qa-<主题>.json`，每个问题配准确答案
- **建筑信息**：遵循 `docs/templates/building-info.json`，④组只填文字信息，坐标由⑥组补充
- **建筑 ID**：每个建筑必须有唯一 `id`，格式 `building-<数字编号>`
- **建筑分类**：`teaching` | `dormitory` | `canteen` | `library` | `sports` | `service` | `gate` | `landscape` | `facility` | `other`

### 前端交互

- **地图方案**：手绘图片 + CSS Transform 热区叠加模式（不依赖 GIS/瓦片地图库），支持平滑缩放拖拽
- **边界约束**：拖拽和缩放均钳制在图片边界内，不会露出白色/黑色背景；最小缩放 = 容器宽 / 图片宽
- **宽度适配**：初始加载时地图左右边界对齐浏览器窗口（`scale = cw / iw, x = 0`），上下居中
- **地图尺寸**：运行时从 `img.naturalWidth` / `img.naturalHeight` 读取，不硬编码
- **建筑热区**：点击建筑热区 → 气泡弹窗（BuildingPopover），定位在标记上方，内嵌建筑专属 AI 问答
- **AI 聊天入口**：右下角浮动按钮（ChatWidget），呼吸光晕动画，展开为对话面板
- **新生问答窗口**：FreshmanWindow，航迹云主题动画
- **缩略图导航**：左下角 Minimap，支持点击跳转和拖拽实时平移；按地图真实比例渲染，X/Y 轴独立 scale
- **建筑搜索**：SearchBar，支持空间搜索
- **移动端适配**：气泡降级为底部 Sheet，聊天面板全屏化

### 设计系统

- **主题名称**：「航迹云」(Contrail)
- **核心风格**：深度玻璃态毛玻璃（blur 24–36px）+ 彩虹渐变光泽 + 浮动光斑背景 + 光扫 hover 动效
- **设计令牌**：集中管理在 `frontend/src/index.css` 的 `:root {}` 中
- **建筑标记**：分类色标（教学楼/宿舍/食堂/图书馆等不同颜色）+ 航路点风格 + 脉冲发光动画
- **弹窗**：摄影化设计，含建筑图片展示 + 周边设施横滑区域

### 智能体

- **知识源 A**：`data/qa/`（④组问答数据）
- **知识源 B**：`data/positions/`（建筑详细信息）
- **输出方式**：支持流式输出（Server-Sent Events 或 WebSocket）
- **接入口**：ChatWidget（通用问答）和 BuildingPopover（建筑专属问答）均预留 `/api/chat` 接口
- **接口协议**：需与③组协商确定
- **RAG 管道代码**：放在 `ai-agent/` 目录

---

## 常用命令

```bash
# 启动前端开发服务器（热更新）
cd frontend && npm install && npm run dev

# 生产构建
cd frontend && npm run build

# 预览生产构建
cd frontend && npm run preview
```

---

## 常见开发任务

### 添加问答数据（④组）

1. 确定主题（宿舍、食堂、选课、社团……）
2. 按 `docs/templates/qa-knowledge.json` 模板填写问题和答案
3. 放入 `data/qa/qa-<主题>.json`
4. ⑤组直接读取此目录构建 RAG 知识库
5. 提交格式：`data(ai): 添加xxx问答数据`

### 添加建筑信息（④组）

1. 按 `docs/templates/building-info.json` 模板填写文字信息（不含坐标）
2. 放入 `data/raw/building-<id>.json`
3. ⑥组补充坐标后输出到 `data/positions/`
4. 提交格式：`data(map): 添加xxx建筑信息`

### 更新手绘地图（①组）

1. 将新手绘地图扫描图放入 `assets/map/` 目录
2. 命名格式：`hand-drawn-map-v<版本号>.<扩展名>`
3. 更新 `assets/map/manifest.json`
4. 如果布局变化，通知⑥组重新标注坐标

### 前端开发（②③组）

- 地图底图使用 `<img>` + CSS Transform 热区叠加，**不使用 GIS 库**
- 聊天组件需支持流式输出（预留 SSE 接入口）
- 现有组件：`MapView`（地图容器，含 HotspotLayer 热区层）、`BuildingPopover`（气泡弹窗）、`ChatWidget`（AI 聊天）、`FreshmanWindow`（新生问答）、`Minimap`（缩略图导航）、`SearchBar`（搜索栏）、`TopBar`（导航栏）
- 建筑数据：`frontend/src/data/mock-buildings.json`，包含天目湖校区 36 栋真实建筑（坐标提取自官方地图 XML API）
- 类型定义：`frontend/src/types/index.ts`
- 地图交互 Hook：`frontend/src/hooks/useMapInteraction.ts`

### 智能体开发（⑤组）

- 知识源：`data/qa/` + `data/positions/`
- 提供 `/api/chat` 端点，支持流式输出
- RAG 管道代码放在 `ai-agent/` 目录

### 数据转换（⑥组）

- 标注工具：在 `scripts/` 下创建坐标采集页面
- 合并脚本：将 `data/raw/` 的建筑信息与像素坐标合并输出到 `data/positions/`

---

## 跨组依赖关系

```
①手绘地图 → ②前端底图渲染
①手绘地图 → ⑥标注像素坐标 → ②前端热区叠加
④建筑信息 → ⑥合并坐标 → ②前端详情面板
④QA知识库 → ⑤RAG知识库 → ③后端API → ②前端聊天
③后端/部署 → 所有模块线上运行
```

### 各组接口约定

| 上游 → 下游 | 交付物 | 位置 |
|-------------|--------|------|
| ① → ②⑥ | 手绘地图高清扫描图（≥ 4K，PNG/JPEG） | `assets/map/` |
| ④ → ⑤ | QA 知识库 JSON（按模板） | `data/qa/` |
| ④ → ⑥ | 建筑信息 JSON（无坐标，按模板） | `data/raw/` |
| ⑥ → ② | 建筑信息 JSON + 像素坐标 | `data/positions/` |
| ⑤ → ③ | AI 接口协议 / RAG 管道 | `ai-agent/` |
| ③ → ② | `/api/chat` REST/SSE 端点 | `backend/` |
