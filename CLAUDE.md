# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

NUAAMap 是南京航空航天大学天目湖校区的智能校园地图网站，面向新生及访客提供交互式地图浏览与 AI 智能问答服务。

- **仓库**：https://github.com/programmingWTF/nuaa-map.git
- **团队规模**：14 人，分 6 个小组（详见 README.md）
- **目标用户**：南航新生、访客
- **地图类型**：**手绘地图**（①组手绘 → 扫描为高清图片 → 前端以此为底图叠加交互热区）；当前开发阶段使用官方地图卫星底图 `frontend/public/tianmuhu-map.jpg`（1536×1536，提取自 map.nuaa.edu.cn）

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

本项目为 Web 应用，分为三条主线：

1. **地图交互线**：手绘地图扫描图 → ⑥标注像素坐标 → ②前端热区叠加
2. **AI 问答线**（核心）：④组采集 QA 知识库 → ⑤组直接用于 RAG / Prompt → 前端聊天界面
3. **后端服务线**：③搭建 API 服务器，承接前端请求，转发智能体调用

### 数据流

```
┌─ 地图交互线 ────────────────────────────────────┐
│  ①手绘地图扫描图                                  │
│      → ⑥组标注像素坐标                            │
│          → ②组前端：底图 + 热区叠加                 │
│  ④组建筑信息 → ⑥合并坐标 → ②前端详情面板           │
│                                                  │
│  [当前开发阶段]                                    │
│  官方地图瓦片 → 拼接 → tianmuhu-map.jpg            │
│      → 提取建筑坐标 → mock-buildings.json (28个)   │
│          → 前端热区叠加                             │
└─────────────────────────────────────────────────┘

┌─ AI 问答线 ─────────────────────────────────────┐
│  ④组 QA 知识库 → data/qa/                        │
│      → ⑤组 RAG 检索 + Prompt 工程                  │
│          → 后端 /api/chat                          │
│              → ②组前端聊天界面                      │
└─────────────────────────────────────────────────┘
```

> ④组的 QA 知识库直接供给⑤组使用，无需⑥组转换。两条线并行推进，同等重要。

## 目录结构

```
nuaa-map/
├── frontend/          # ✅ ②③组：前端（React + TypeScript + Vite）
│   ├── public/
│   │   └── tianmuhu-map.jpg  # ✅ 天目湖校区卫星底图（3840×3328）
│   └── src/
│       ├── components/    # MapView / HotspotLayer / BuildingPopover / ChatWidget / Minimap / TopBar
│       ├── hooks/         # useMapInteraction（缩放/拖拽/捏合）
│       ├── types/         # Building, MapTransform, ChatMessage 等类型
│       └── data/          # 建筑数据（28个真实天目湖建筑 + 真实坐标）
├── assets/map/
│   └── tiles-tianmuhu/    # ✅ 天目湖官方地图瓦片（36块，用于拼接）
├── data/
│   ├── extracted-map/     # ✅ 官方地图提取参考数据与文档
│   ├── qa/                # 📋 ④组：问答知识库 → ⑤组直接使用
│   ├── raw/               # 📋 ④组：建筑信息 JSON（无坐标）
│   └── positions/         # 📋 ⑥组：建筑信息 + 像素坐标 → ②前端
├── backend/           # 📋 ③组：后端 API
├── ai-agent/          # 📋 ⑤组：RAG 管道
├── scripts/
│   └── stitch-tianmuhu-tiles.py  # ✅ 瓦片拼接脚本
├── docs/              # 项目文档 + 数据模板
└── .github/           # 📋 CI/CD 配置
```

> ✅ = 已搭建 | 📋 = 规划中。启动前端：`cd frontend && npm install && npm run dev`

## 关键约定

### 地图与坐标

- 当前底图：`frontend/public/tianmuhu-map.jpg`（3840×3328 像素），由官方地图瓦片拼接而成
- 瓦片来源：`https://map.nuaa.edu.cn/mapdata/zoom3/{col}_{row}.jpg`（col 44-58, row 13-25，共 195 张）
- 拼接脚本：`scripts/stitch-tianmuhu-tiles.py`
- 坐标系统基于地图图片的**像素坐标**：以图片左上角为原点 (0, 0)，x 轴向右，y 轴向下
- 建筑坐标提取方法：从官方地图 XML API 获取全局坐标后转换（详见下方）
- ①组手绘地图交付后：替换 `MAP_SRC` 常量，⑥组重新标注坐标
- ⑥组负责在每个建筑上标注像素位置和可点击区域

#### 从官方地图 API 提取建筑坐标

官方地图网站 `map.nuaa.edu.cn` 使用瓦片 + XML 标记系统，建筑数据通过 XML 文件暴露：

**1. API 端点**
```
https://map.nuaa.edu.cn/xml/gadgets/{zoom}/{col},{row}.xml
```
- `zoom`：缩放级别，天目湖校区使用 zoom 3 和 zoom 4
- `col,row`：瓦片网格坐标
- 天目湖校区 Zoom 3 范围：col 43-51, row 13-17
- 天目湖校区 Zoom 4 范围：col 19-27, row 5-9

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
// 合并公式（直接一步到位）
pixel_x = round(x0 / 4 - 10287)
pixel_y = round(y0 / 4 - 2326)
```

**4. 注意事项**
- **校区切换**：网站默认显示「明故宫校区」，需点击左上角校区按钮切换到「天目湖校区」。此切换会影响页面 DOM 中的建筑列表，但不影响 XML API——API 的瓦片坐标因校区而异（天目湖 zoom 3 的 col/row 远大于明故宫）
- **type 含义**：只有 `type=1` 是建筑名称标签（核心数据）；`type=6` 是全景 VR 链接（与 type=1 重叠但含 `url` 字段）；`type=7` 是停车场；`type=15` 是校门图标。提取建筑清单时只需 `type=1`，按 `title` 去重
- **提取脚本参考**：`data/extracted-map/tianmuhu-buildings-xml.json` 包含 2026-07-04 提取的全部 36 栋建筑原始坐标
- **采集方法**：用 Playwright 打开网站 → 切换到目标校区 → 用 `fetch()` 批量请求 XML → 解析并转换坐标。也可直接在浏览器控制台中执行 `fetch()` 请求（同域无 CORS 限制）

### 数据格式

- **QA 知识库**：遵循 `docs/templates/qa-knowledge.json`，按主题分类，每个问题配准确答案
- **建筑信息**：遵循 `docs/templates/building-info.json`，④组只填文字，坐标由⑥组补充
- 每个建筑必须有唯一 `id`，格式：`building-<数字编号>`

### 前端交互

- 地图：手绘图片 + CSS Transform 热区叠加模式（不依赖 GIS/瓦片地图），支持平滑缩放拖拽
- **边界约束**：拖拽和缩放均钳制在图片边界内，不会露出白色/黑色背景；最小缩放 = 容器宽/图片宽
- **宽度适配**：初始加载时地图左右边界对齐浏览器窗口（`scale = cw / iw, x = 0`），上下居中
- 点击建筑热区 → 气泡弹窗（BuildingPopover），定位在标记上方，内嵌建筑专属 AI 问答
- AI 聊天入口：右下角浮动按钮（ChatWidget），呼吸光晕动画，展开为对话面板
- 缩略图导航：左下角 Minimap，支持点击跳转和拖拽实时平移；按地图真实比例渲染，X/Y 轴独立 scale
- 设计系统：「航迹云」主题——深度玻璃态毛玻璃（blur 24-36px）+ 彩虹渐变光泽 + 浮动光斑背景 + 光扫hover动效
- 移动端：气泡降级为底部 Sheet，聊天面板全屏化

### 智能体

- 知识库以④组的 `data/qa/` 为核心检索内容
- 支持流式输出（Server-Sent Events 或 WebSocket）
- API 接口需与③组协商确定协议

### Git 分支

- `main` — 主分支，所有代码最终合并到这里
- 各组按前缀建分支：`map/` `interact/` `platform/` `data/` `ai/` `convert/`
- 提交信息遵循 Conventional Commits 格式（详见 CONTRIBUTING.md）

## 常见开发任务

### 添加问答数据（④组）

1. 确定主题（宿舍、食堂、选课、社团……）
2. 按 `docs/templates/qa-knowledge.json` 模板填写问题和答案
3. 放入 `data/qa/qa-<主题>.json`
4. ⑤组直接读取此目录构建 RAG 知识库
5. 提交时使用 `data(ai): 添加xxx问答数据`

### 添加建筑信息（④组）

1. 按 `docs/templates/building-info.json` 模板填写文字信息
2. 放入 `data/raw/building-<id>.json`
3. ⑥组补充坐标后输出到 `data/positions/`
4. 提交时使用 `data(map): 添加xxx建筑信息`

### 更新手绘地图（①组）

1. 将新手绘地图扫描图放入 `assets/map/` 目录
2. 命名格式：`hand-drawn-map-v<版本号>.<扩展名>`
3. 更新 `assets/map/manifest.json`
4. ⚠️ 如果布局变化，通知⑥组重新标注坐标

### 前端开发（②③组）

- 地图底图使用 `<img>` + CSS Transform 热区叠加，不使用 GIS 库
- 地图尺寸自适应（运行时从 `img.naturalWidth/Height` 读取），不硬编码
- 聊天组件需支持流式输出（预留 SSE 接入口）
- 启动开发服务器：`cd frontend && npm run dev`
- 现有组件：`MapView`（地图）、`HotspotLayer`（热区）、`BuildingPopover`（气泡）、`ChatWidget`（聊天）、`Minimap`（缩略图）、`TopBar`（导航栏）
- 建筑数据：`frontend/src/data/mock-buildings.json`，当前包含天目湖校区 28 个真实建筑（坐标提取自官方地图网站），格式与⑥组最终产出一致
- 建筑分类：teaching | dormitory | canteen | library | sports | service | gate | landscape | facility | other
- 设计令牌集中管理在 `frontend/src/index.css` 的 `:root {}` 中

### 智能体开发（⑤组）

- 知识源 A：`data/qa/`（④组问答数据）
- 知识源 B：`data/positions/`（建筑详细信息）
- RAG 管道代码放在 `ai-agent/` 目录

## 跨组依赖关系

```
①手绘地图 → ②前端底图渲染
①手绘地图 → ⑥标注像素坐标 → ②前端热区
④建筑信息 → ⑥合并坐标 → ②前端详情
④QA知识库 → ⑤RAG知识库 → 后端API → ②前端聊天
③后端/部署 → 所有模块线上运行
```
