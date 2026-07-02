# 官方地图数据提取参考

## 来源

- 网址：https://map.nuaa.edu.cn/
- 系统类型：专有三维校园 GIS 平台（非开源）
- 提取日期：2026-07-02

## 技术架构分析

官方地图网站的架构如下：

```
主页面 (map.nuaa.edu.cn)
├── 导航栏 (Bootstrap) — 校区切换下拉菜单
├── iframe (同源) — 地图渲染容器
│   ├── 瓦片底图：/mapdata/zoom3/{col}_{row}.jpg
│   ├── 建筑热点：/xml/gadgets/{zoom}/{col},{row}.xml
│   ├── 地图引擎：xbgis (300KB+ 混淆 JS 配置)
│   ├── 核心库：JSLibrary.js, a.js, h.js, hc.js, fs.js
│   └── 鹰眼图：/mapdata/eyemap/zoom3/{col}_{row}.jpg
└── 标签图层
```

## 校区切换机制

- 校区列表在 HTML 中定义为 Bootstrap 下拉菜单：
  - `#campus1` → 明故宫校区
  - `#campus2` → 将军路校区
  - `#campus3` → 天目湖校区
- 切换时改变 iframe 中地图的视口位置

## 天目湖校区数据

### 地图瓦片

- 缩放级别：zoom3（最高细节层级）
- 瓦片范围：列 44-49，行 13-18
- 总计：6x6 = 36 块，每块 256x256 像素
- 合成尺寸：1536x1536 像素
- URL 格式：https://map.nuaa.edu.cn/mapdata/zoom3/{col}_{row}.jpg

### 建筑坐标（29个）

详见 tianmuhu-buildings.json。坐标位于全局地图像素坐标系中。

## 可提取 vs 不可提取

| 数据类型 | 可提取？ | 备注 |
|----------|----------|------|
| 地图瓦片 (JPG) | 可 | 36块可直接下载拼接 |
| 建筑名称列表 | 可 | 从 DOM 中提取到 29 个建筑 |
| 建筑标签坐标 | 可 | DOM 元素全局像素位置 |
| 建筑热区（精确多边形） | 不可 | 存储在混淆的 xbgis JS 中 |
| 建筑详细信息 | 不可 | 通过专有 API 动态加载 |
| VR/全景链接 | 部分 | XML 中包含但仅明故宫校区有数据 |
| 3D 建筑模型 | 不可 | WebGL 渲染，非 DOM |
| 导航路径数据 | 不可 | 服务端计算 |

## 与 NUAAMap 项目的关系

NUAAMap 使用手绘地图 + 前端热区叠加方案，与官方 GIS 技术路线完全不同。

可以从官方地图借用的：
1. 建筑名称和位置关系 — 作为手绘标注参考
2. 地图瓦片截图 — 验证校园布局准确性
3. 建筑分类 — 了解建筑类型分布

不建议直接使用：
- 官方瓦片图有版权问题且风格与手绘不匹配
- 混淆 JS 代码不应逆向工程
- 坐标系统不同

## 文件清单

```
data/extracted-map/
├── README.md
├── tianmuhu-buildings.json
├── tile-sample-44_13.jpg
├── tile-sample-46_15.jpg
└── tile-sample-48_17.jpg
```
