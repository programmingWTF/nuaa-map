# 团队协作规范

> 🆕 还不会用 Git/GitHub？先看 [GitHub 协作入门指南](docs/github-guide.md)，从零开始手把手教学。

## Git 工作流

### 分支策略

```
main  ← 主分支（所有代码最终合并到这里）
  ├─ feature/xxx      ← 新功能分支
  ├─ fix/xxx          ← Bug 修复分支
  ├─ map/xxx          ← 地图图纸/美工分支（①组）
  ├─ interact/xxx     ← 交互功能分支（②组）
  ├─ platform/xxx     ← 平台搭建分支（③组）
  ├─ data/xxx         ← 数据收集分支（④组）
  ├─ ai/xxx           ← 智能体训练分支（⑤组）
  └─ convert/xxx      ← 数据转换分支（⑥组）
```

> 直接从 `main` 创建分支，完成后 PR 合并回 `main`。项目规模不大，两层分支足够。

### 分支命名规范

- `feature/<功能简述>` — 例：`feature/building-popup`
- `fix/<问题简述>` — 例：`fix/map-zoom-bug`
- `map/<内容>` — 例：`map/campus-base-layer`
- `interact/<内容>` — 例：`interact/building-click-handler`
- `platform/<内容>` — 例：`platform/ci-setup`
- `data/<内容>` — 例：`data/dormitory-info`
- `ai/<内容>` — 例：`ai/rag-pipeline`
- `convert/<内容>` — 例：`convert/geojson-export`

### 提交信息规范

采用 Conventional Commits 格式：

```
<type>(<scope>): <description>

[optional body]
```

**type 类型**：
- `feat` — 新功能
- `fix` — Bug 修复
- `docs` — 文档更新
- `style` — 代码格式（不影响逻辑）
- `refactor` — 重构
- `test` — 测试相关
- `chore` — 构建/工具变动
- `data` — 数据更新（④组常用）
- `asset` — 静态资源更新（①组常用）

**scope 范围**：`map`、`interact`、`platform`、`data`、`ai`、`convert`、`docs`

**示例**：
```
feat(interact): 点击建筑弹出详情面板
data(map): 更新东区宿舍楼坐标信息
asset(map): 添加天目湖校区底图 v2
feat(ai): 接入 RAG 检索增强问答管道
```

## 协作流程

### 日常开发

1. 从 `main` 拉取最新代码
2. 创建你的功能分支
3. 在分支上开发并提交
4. 推送到远程并创建 Pull Request
5. 至少一人 Review 后合并到 `main`

### Pull Request 要求

- PR 标题遵循提交信息规范
- 描述清楚做了什么、为什么这样做
- 涉及 UI 改动需附截图
- 涉及数据改动需说明数据来源
- 至少一人 Approve 后方可合并

### 代码 Review 要点

- 逻辑是否正确
- 代码风格是否一致
- 是否有明显的性能问题
- 数据格式是否与约定一致
- 是否有安全风险（如密钥泄露）

## 跨组协作约定

### ①地图美工 → ②交互 & ⑥数据转换
- 地图底图以 **SVG / 高清 PNG** 格式交付，放置于 `assets/map/` 目录
- 建筑标注坐标以 **GeoJSON** 格式提供，每个建筑包含 `id`、`name`、`coordinates` 字段
- 底图更新需在 `#map-assets` 频道通知

### ④调研数据 → ⑥数据转换 → ②交互
- 建筑信息以统一的 **JSON 模板** 填写（模板见 `docs/templates/building-info.json`）
- ⑥组将原始数据转换为前端可用的 GeoJSON 格式
- ②组通过 API 或静态文件读取 GeoJSON 数据

### ⑤智能体 → ②交互 & ③平台
- 智能体提供 **REST API** 或 **WebSocket** 接口
- 接口协议需提前对齐（③组牵头确定 API 规范）
- 知识库内容来源于④组的建筑/设施信息

## 目录结构（规划）

```
nuaa-map/
├── assets/            # 静态资源（地图底图、图标、图片）
│   └── map/           # ①组交付的地图素材
├── data/              # 数据文件（JSON、GeoJSON）
│   ├── raw/           # ④组原始调研数据
│   └── geo/           # ⑥组转换后的地理数据
├── docs/              # 项目文档
│   └── templates/     # 数据模板
├── frontend/          # 前端代码
├── backend/           # 后端代码（含智能体 API）
├── ai-agent/          # ⑤组智能体训练代码
├── scripts/           # 工具脚本
└── .github/           # GitHub Actions CI/CD
```
