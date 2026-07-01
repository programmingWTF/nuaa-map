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

> 直接从 `main` 创建分支，完成后 PR 合并回 `main`。

### 分支命名规范

- `feature/<功能简述>` — 例：`feature/building-popup`
- `fix/<问题简述>` — 例：`fix/map-zoom-bug`
- `map/<内容>` — 例：`map/hand-drawn-v2`
- `interact/<内容>` — 例：`interact/building-hotspot`
- `platform/<内容>` — 例：`platform/ci-setup`
- `data/<内容>` — 例：`data/dormitory-info`
- `ai/<内容>` — 例：`ai/rag-pipeline`
- `convert/<内容>` — 例：`convert/coordinate-annotation`

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
feat(interact): 点击建筑热区弹出详情面板
data(map): 更新东区宿舍楼像素坐标信息
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

### 代码 Review 要点

- 逻辑是否正确
- 代码风格是否一致
- 是否有明显的性能问题
- 数据格式是否与约定一致
- 是否有安全风险（如密钥泄露）

## 跨组协作约定

### ①地图美工 → ②交互 & ⑥数据转换
- ①组交付**手绘地图的高清扫描图**（建议 ≥ 4K 分辨率，PNG/JPEG 格式），放置于 `assets/map/` 目录
- 扫描图应保持平正，避免倾斜和透视变形
- ⑥组基于该扫描图标注建筑像素坐标
- 手绘地图更新时，需在群内通知②组和⑥组

### ④调研数据 → ⑥数据转换 → ②交互
- ④组按模板填写建筑文字信息（`docs/templates/building-info.json`）
- ⑥组在手绘地图扫描图上确定每个建筑的**像素坐标**（pixelX, pixelY），补充到数据中
- ⑥组同时标注建筑的**可点击区域**（矩形或多边形）
- 最终产出放在 `data/positions/`，②组前端直接读取

### ⑤智能体 → ②交互 & ③平台
- 智能体提供 **REST API** 或 **WebSocket** 接口
- 接口协议需提前对齐（③组牵头确定 API 规范）
- 知识库内容来源于 `data/positions/` 中的建筑/设施信息（含 FAQ）

## 坐标标注参考

由于是手绘地图，坐标系统很简单：

```
图片左上角 → (0, 0)
x 轴 → 向右递增
y 轴 → 向下递增
单位 → 像素（px）
```

⑥组可用浏览器的开发者工具或自制 HTML 页面来点击取坐标。推荐在 `scripts/` 下放一个简单的坐标拾取工具。

## 目录结构（规划）

```
nuaa-map/
├── assets/            # 静态资源
│   └── map/           # ①组交付：手绘地图扫描图、图标
├── data/              # 数据文件
│   ├── raw/           # ④组原始调研数据（纯文字，无坐标）
│   └── positions/     # ⑥组产出：带像素坐标的完整建筑数据
├── docs/              # 项目文档
│   └── templates/     # 数据模板
├── frontend/          # 前端代码
├── backend/           # 后端代码（含智能体 API）
├── ai-agent/          # ⑤组智能体训练代码
├── scripts/           # 工具脚本（坐标拾取器等）
└── .github/           # GitHub Actions CI/CD
```
