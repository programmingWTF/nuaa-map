import type { Building, BuildingClickData, MapTransform } from '../../types';
import './HotspotLayer.css';

interface HotspotLayerProps {
  buildings: Building[];
  imageWidth: number;
  imageHeight: number;
  transform: MapTransform;
  onBuildingClick: (data: BuildingClickData) => void;
  selectedBuildingId?: string;
  disabled?: boolean;
}

export function HotspotLayer({
  buildings, imageWidth, imageHeight, transform,
  onBuildingClick, selectedBuildingId, disabled,
}: HotspotLayerProps) {
  return (
    <div className="hotspot-layer" style={{ width: imageWidth, height: imageHeight }}>
      {buildings.map((b) => {
        const { x, y, width, height } = b.hotspot;
        const isSelected = b.id === selectedBuildingId;
        // 移动端保证点击区域至少 44×44 屏幕像素（反算为地图坐标）
        const MIN_TOUCH = 44;
        const minMapSize = MIN_TOUCH / transform.scale;
        const w = Math.max(width, minMapSize);
        const h = Math.max(height, minMapSize);
        const dx = (w - width) / 2;
        const dy = (h - height) / 2;

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          // 计算 hotspot 在视口上的屏幕坐标
          const screenX = transform.x + x * transform.scale;
          const screenY = transform.y + y * transform.scale;
          const screenWidth = width * transform.scale;
          const screenHeight = height * transform.scale;
          onBuildingClick({ building: b, screenX, screenY, screenWidth, screenHeight });
        };

        return (
          <button
            key={b.id}
            className={`hotspot hotspot--cat-${b.category} ${isSelected ? 'hotspot--selected' : ''}`}
            style={{ left: x - dx, top: y - dy, width: w, height: h, ...(disabled ? { pointerEvents: 'none' } : {}) }}
            onClick={handleClick}
            aria-label={`查看 ${b.name} 详情`}
          >
            <span className="hotspot-marker">
              <span className="hotspot-marker-outer" />
              <span className="hotspot-marker-inner" />
            </span>
            <span className="hotspot-label">{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}
