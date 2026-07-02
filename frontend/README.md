# NUAAMap 前端

南京航空航天大学天目湖校区智能校园地图 — 前端交互模块。

## 技术栈

- **React 19** + **TypeScript** — 组件化 UI，类型安全
- **Vite 8** — 构建工具，极速 HMR
- **CSS Custom Properties** — 设计令牌体系（航迹云主题：玻璃态 + 天空渐变）

## 快速开始

```bash
npm install
npm run dev        # 开发模式 → http://localhost:5173
npm run build      # 生产构建
npm run preview    # 预览构建产物
```

## 目录结构

```
src/
├── main.tsx                    # React 挂载入口
├── App.tsx                     # 根组件：组装地图 / 气泡 / 聊天 / 缩略图
├── index.css                   # 全局样式 & 设计令牌（CSS 变量）
├── components/
│   ├── TopBar/                 # 顶部导航栏（Logo + 搜索框）
│   ├── MapView/
│   │   ├── MapView.tsx         # 地图容器：加载图片、缩放/拖拽、控件
│   │   └── HotspotLayer.tsx    # 建筑热区层：航路点标记，计算屏幕坐标
│   ├── BuildingPopover/        # 建筑气泡弹窗（定位在 hotspot 旁，内嵌 AI 问答）
│   ├── ChatWidget/             # AI 浮动聊天按钮 → 可展开对话面板
│   └── Minimap/                # 缩略图导航（左下角，支持点击跳转 + 拖拽平移）
├── hooks/
│   └── useMapInteraction.ts    # 地图交互 Hook（滚轮缩放 / 鼠标拖拽 / 双指捏合）
├── types/
│   └── index.ts                # 全部 TypeScript 类型定义
└── data/
    └── mock-buildings.json     # 6 个建筑的 Mock 数据（含像素坐标）
```

## 关键设计

### 地图自适应

地图图片尺寸不写死，运行时从 `img.naturalWidth` / `img.naturalHeight` 读取。换任意分辨率的图片都不需要改代码。

缩放范围 0.5x – 4x，滚轮以鼠标位置为中心平滑缩放（CSS transition），拖拽时自动关闭过渡保证跟手。

### 气泡弹窗定位

HotspotLayer 接收地图 `transform`，点击时计算屏幕坐标（`screenX = tx + hx × scale`）。气泡渲染在地图容器内但变换层外——不随地图缩放，仅位置跟随 transform 变化实时移动。

### 数据替换

Mock 数据 `src/data/mock-buildings.json` 格式与⑥组最终产出一致。手绘地图交付后：

1. 替换 `public/placeholder-map.svg` → 手绘地图扫描图
2. 替换 `src/data/mock-buildings.json` → ⑥组 `data/positions/` 产出
3. 修改 `MapView.tsx` 中的 `MAP_SRC` 路径

## 对接后端

| 功能 | 状态 | 接入口 |
|------|------|--------|
| AI 聊天 | Mock | `ChatWidget.tsx` 第 55 行 → `fetch('/api/chat')` |
| 建筑专属问答 | Mock | `BuildingPopover.tsx` 第 46 行 → `fetch('/api/chat')` |
| 流式输出 | 预留 | 替换为 `EventSource` 或 `fetch` + `ReadableStream` |
| 登录验证 | 待开发 | 在 `App.tsx` 外包 `<AuthGuard>` 路由守卫 |
