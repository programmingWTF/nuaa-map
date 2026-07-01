# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

NUAAMap 是南京航空航天大学天目湖校区的智能校园地图网站，面向新生及访客提供交互式地图浏览与 AI 智能问答服务。

- **仓库**：https://github.com/programmingWTF/nuaa-map.git
- **团队规模**：14 人，分 6 个小组（详见 README.md）
- **目标用户**：南航新生、访客

## 技术架构

本项目为 Web 应用，分为三个核心模块：

1. **前端地图交互** — 基于 Leaflet.js 或 MapLibre GL JS 的校园地图展示，支持点击建筑查看详情
2. **后端数据服务** — REST API，提供建筑信息查询、GeoJSON 数据接口
3. **AI 智能问答** — 基于 RAG（检索增强生成）的聊天机器人，知识库来源于校园建筑/设施信息

### 数据流

```
④组调研数据 (JSON)
    → ⑥组转换 (GeoJSON)
        → 前端地图渲染 (Leaflet/MapLibre)
        → 后端 API 服务
            → AI 智能体知识库 (RAG)
                → 前端聊天界面
```

## 目录结构

```
nuaa-map/
├── assets/map/        # ①组交付：地图底图、图标
├── data/raw/          # ④组交付：建筑信息 JSON（模板见 docs/templates/building-info.json）
├── data/geo/          # ⑥组产出：GeoJSON 地理数据
├── frontend/          # ②③组：前端代码
├── backend/           # ③组：后端 API
├── ai-agent/          # ⑤组：智能体训练与 RAG 管道
├── scripts/           # 工具脚本
├── docs/              # 项目文档
└── .github/           # CI/CD 配置
```

> 以上为规划结构，项目初始化后需各组确认并调整。

## 关键约定

### 数据格式

- 所有建筑信息必须遵循 `docs/templates/building-info.json` 定义的模板
- 地理数据统一使用 **GeoJSON** 格式，坐标系为 **WGS84 (EPSG:4326)**
- 每个建筑必须有唯一 `id`，格式：`building-<数字编号>`

### 前端交互

- 地图交互采用"点击建筑 → 弹出详情面板"模式
- 详情面板需展示：名称、图片、功能描述、开放时间、设施列表、FAQ
- AI 聊天入口独立于地图，以浮动按钮或侧边栏形式呈现

### 智能体

- 智能体通过 REST API 与前端通信
- 知识库以④组的建筑信息 JSON + FAQ 为基础构建
- 支持流式输出（Server-Sent Events 或 WebSocket），提升对话体验

### Git 分支

- `main` — 生产就绪代码
- `develop` — 开发集成
- 各组按前缀建分支：`map/` `interact/` `platform/` `data/` `ai/` `convert/`
- 提交信息遵循 Conventional Commits 格式（详见 CONTRIBUTING.md）

## 常见开发任务

### 添加新建筑数据（④组 → ⑥组）

1. 按 `docs/templates/building-info.json` 模板填写数据
2. 放入 `data/raw/building-<id>.json`
3. ⑥组运行转换脚本生成 `data/geo/building-<id>.geojson`
4. 提交时使用 `data(map): 添加xxx建筑信息`

### 更新地图底图（①组）

1. 将新底图放入 `assets/map/` 目录
2. 命名格式：`base-map-v<版本号>.<扩展名>`
3. 更新 `assets/map/manifest.json`（记录当前使用的底图版本）
4. 提交时使用 `asset(map): 更新底图 vX`

### 前端开发（②③组）

- 参考 `CONTRIBUTING.md` 中的分支和提交规范
- 前端组件使用 Leaflet.js 或 MapLibre GL JS 作为地图引擎
- 聊天组件需支持流式输出显示

### 智能体开发（⑤组）

- 知识库文件位于 `data/raw/` 目录
- RAG 管道代码放在 `ai-agent/` 目录
- API 接口需与③组协商确定协议

## 跨组依赖关系

```
①地图素材 → ②前端渲染地图
④建筑数据 → ⑥GeoJSON转换 → ②前端展示详情 → ⑤智能体知识库
③后端/部署 → 所有模块的线上运行
⑤智能体API → ②前端聊天界面
```

各组交付物和接口约定详见 `CONTRIBUTING.md` 中的"跨组协作约定"部分。
