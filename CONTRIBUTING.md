# 团队协作规范

> 🆕 还不会用 Git/GitHub？先看 [GitHub 协作入门指南](docs/github-guide.md)，从零开始手把手教学。

## Git 工作流

### 分支策略

```
main  ← 主分支（所有代码最终合并到这里）
  ├─ map/xxx          ← 地图图纸/美工分支（①组）
  ├─ interact/xxx     ← 交互功能分支（②组）
  ├─ platform/xxx     ← 平台搭建分支（③组）
  ├─ data/xxx         ← 数据采集分支（④组）
  ├─ ai/xxx           ← 智能体训练分支（⑤组）
  └─ convert/xxx      ← 数据转换分支（⑥组）
```

> 直接从 `main` 创建分支，完成后 PR 合并回 `main`。

### 提交信息规范

采用 Conventional Commits 格式：

```
<type>(<scope>): <description>
```

**type**：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `data` / `asset`

**scope**：`map` / `interact` / `platform` / `data` / `ai` / `convert` / `docs`

**示例**：
```
feat(interact): 点击建筑热区弹出详情面板
data(ai): 添加宿舍区问答数据
data(map): 更新东区宿舍楼建筑信息
asset(map): 更新手绘地图扫描图 v2
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

## 跨组协作约定

### ①地图美工 → ②交互 & ⑥数据转换
- ①组交付**手绘地图的高清扫描图**（≥ 4K，PNG/JPEG），放 `assets/map/`
- 扫描图保持平正，避免倾斜变形
- ⑥组基于该图标注建筑像素坐标
- 地图更新时群内通知②组和⑥组

### ④调研数据 → 两个方向

**→ ⑤智能体（主要通道，直接对接）**
- ④组**核心产出**：校园问答知识库，按 `docs/templates/qa-knowledge.json` 模板填写
- 放 `data/qa/`，⑤组直接读取用于 RAG 和 Prompt 工程
- 这是④组最重要的工作，覆盖新生所有常见问题

**→ ⑥数据转换 → ②交互（次要通道）**
- ④组**次要产出**：建筑基本信息，按 `docs/templates/building-info.json` 模板填写（只填文字）
- 放 `data/raw/`，⑥组补充像素坐标后输出到 `data/positions/`
- ②组前端读取用于地图详情展示

### ⑤智能体 → ②交互 & ③平台
- 智能体提供 REST API 或 WebSocket 接口
- 知识库核心来源：`data/qa/`（④组 QA 数据）
- 辅助信息来源：`data/positions/`（建筑信息）
- 接口协议由③组牵头确定

## 目录结构（规划）

```
nuaa-map/
├── assets/            # 静态资源
│   └── map/           # ①组：手绘地图扫描图、图标
├── data/
│   ├── qa/            # ④组核心产出：问答知识库 → ⑤组直接使用
│   ├── raw/           # ④组次要产出：建筑信息（无坐标）
│   └── positions/     # ⑥组产出：建筑信息 + 像素坐标
├── docs/
│   └── templates/     # 数据模板（qa-knowledge.json / building-info.json）
├── frontend/          # ②③组：前端代码
├── backend/           # ③组：后端 API
├── ai-agent/          # ⑤组：RAG + Prompt 工程
├── scripts/           # 工具脚本
└── .github/           # CI/CD
```
