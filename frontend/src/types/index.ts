/** 建筑热区坐标（像素，相对于手绘地图原图） */
export interface Hotspot {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 建筑信息 */
export interface Building {
  id: string;
  name: string;
  category: 'teaching' | 'dormitory' | 'canteen' | 'library' | 'sports' | 'service' | 'gate' | 'landscape' | 'facility' | 'other';
  hotspot: Hotspot;
  description: string;
  openTime?: string;
  floors?: number;
  facilities?: string[];
  imageUrl?: string;
  /** 多张图片，用于轮播。为空时回退到 imageUrl */
  images?: string[];
}

/** 地图交互状态 */
export interface MapTransform {
  scale: number;
  x: number;
  y: number;
}

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/** 点击建筑时的完整数据（含屏幕坐标，用于气泡定位） */
export interface BuildingClickData {
  building: Building;
  /** hotspot 在视口上的 X 坐标 */
  screenX: number;
  /** hotspot 在视口上的 Y 坐标 */
  screenY: number;
  /** hotspot 在视口上的宽度 */
  screenWidth: number;
  /** hotspot 在视口上的高度 */
  screenHeight: number;
}

/** 地图图片元信息（运行时从图片读取） */
export interface MapImageMeta {
  width: number;
  height: number;
  loaded: boolean;
}
