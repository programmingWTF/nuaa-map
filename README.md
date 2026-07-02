# NUAAMap — 南京航空航天大学天目湖校区智能地图

为南航天目湖校区新生及访客提供交互式校园地图与智能问答服务。

## 核心功能

- **手绘校园地图**：以手绘风格地图为底图展示天目湖校区全貌
- **建筑详情查询**：点击建筑热区查看名称、功能、开放时间等详细信息
- **智能问答助手**：新生可通过自然语言提问，获取校园相关信息（由④组 QA 知识库和建筑数据共同驱动）

## 团队分工

| 小组 | 成员 | 职责 |
|------|------|------|
| ① 地图图纸与美工 | 刘玉涵、陈顾云 | 手绘校园地图、UI/UX 设计 |
| ② 交互功能 | 刘楚江、薄天乙 | 前端交互逻辑、地图热区点击与信息展示 |
| ③ 平台搭建 | 罗羽彤、李桂聿、郑应楠 | 项目架构、部署与运维 |
| ④ 调研与数据收集 | 李睿、蒋荀莉、张聿修、王小雯 | 校园 QA 问答知识库 + 建筑信息采集 |
| ⑤ 智能体训练 | 胡德文、李睿、姜禹锡 | AI 问答模型/RAG 系统搭建与训练 |
| ⑥ 数据转换 | 杜明泽 | 手绘地图像素坐标标注与数据合并 |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/programmingWTF/nuaa-map.git
cd nuaa-map

# 安装依赖并启动前端开发服务器
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 即可看到地图页面。

> 目前前端已搭建完成，包含占位手绘地图 + Mock 建筑数据 + 地图交互（缩放/拖拽/热区点击）+ AI 聊天界面 + 缩略图导航。后端和 AI 智能体模块尚未开发。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19 + TypeScript | 组件化开发，类型安全 |
| 构建工具 | Vite 8 | 极速 HMR 开发体验 |
| 样式方案 | CSS Custom Properties | 设计令牌体系，全局主题切换 |
| 地图方案 | 手绘扫描图 + CSS Transform | 不依赖 GIS 库，像素坐标热区叠加 |
| 后端 API | Python FastAPI / Node.js Express（待开发）| RESTful API，流式输出支持 |
| AI/智能体 | LangChain + RAG（待开发）| 检索增强生成，知识库基于④组 QA 数据 |
| 数据格式 | JSON | 建筑信息 + QA 知识库，统一 JSON Schema |

## 前端架构

```
frontend/src/
├── components/
│   ├── TopBar/           # 顶部导航栏（Logo + 搜索）
│   ├── MapView/          # 地图容器（缩放/拖拽）+ 热区层
│   │   └── HotspotLayer  # 建筑标记（航路点风格，脉冲发光动画）
│   ├── BuildingPopover/  # 建筑气泡弹窗（内嵌建筑专属AI问答）
│   ├── ChatWidget/       # AI 浮动聊天组件（呼吸光晕按钮）
│   └── Minimap/          # 缩略图导航（左下角，支持拖拽实时平移）
├── hooks/
│   └── useMapInteraction # 地图交互 Hook（滚轮/捏合缩放、拖拽平移）
├── types/                # TypeScript 类型定义
└── data/                 # Mock 建筑数据（替换为⑥组产出后即可对接真实坐标）
```

## 文档导航

| 文档 | 内容 |
|------|------|
| [团队协作规范](CONTRIBUTING.md) | 分支策略、提交规范、跨组接口 |
| [团队职责](docs/team.md) | 各组详细职责与对接关系 |
| [GitHub 协作入门指南](docs/github-guide.md) | 零基础学 Git/GitHub，从安装到 PR |
| [AI 工具使用指南](AGENTS.md) | 各组如何用 AI Agent 提效 |
| [项目规则书](CLAUDE.md) | AI 自动遵守的项目规范与架构 |
| [QA 知识库模板](docs/templates/qa-knowledge.json) | ④组：问答数据模板 |
| [建筑信息模板](docs/templates/building-info.json) | ④组：建筑信息模板 |

## 常用命令

```bash
cd frontend

npm run dev      # 启动开发服务器（热更新）
npm run build    # 生产构建
npm run preview  # 预览生产构建
```
