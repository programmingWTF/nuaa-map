import { useState, useCallback } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { MapView } from './components/MapView/MapView';
import type { MapViewState } from './components/MapView/MapView';
import { Minimap } from './components/Minimap/Minimap';
import { ChatWidget } from './components/ChatWidget/ChatWidget';
import type { Building, BuildingClickData, MapTransform } from './types';
import mockBuildings from './data/mock-buildings.json';
import './App.css';

const DEFAULT_MAP_STATE: MapViewState = {
  transform: { scale: 1, x: 0, y: 0 },
  containerWidth: 0, containerHeight: 0,
  imageWidth: 0, imageHeight: 0, imageSrc: '',
};

function App() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [mapState, setMapState] = useState<MapViewState>(DEFAULT_MAP_STATE);
  const buildings = mockBuildings as Building[];

  /* 点击地标 → 居中适当放大 + 弹出详情；关闭 → 适度缩小 */
  const handleBuildingClick = useCallback((data: BuildingClickData | null) => {
    setSelectedBuilding(data?.building ?? null);
    const { containerWidth, containerHeight, imageWidth, imageHeight } = mapState;
    if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) return;

    if (!data) {
      // 关闭弹窗 → 适度缩小，保持视野中心
      const cur = mapState.transform;
      const fitScale = containerWidth / imageWidth;
      const newScale = Math.max(cur.scale * 0.6, fitScale);
      const mx = (containerWidth / 2 - cur.x) / cur.scale;
      const my = (containerHeight / 2 - cur.y) / cur.scale;
      window.dispatchEvent(new CustomEvent('map-navigate', {
        detail: { scale: newScale, x: containerWidth / 2 - mx * newScale, y: containerHeight / 2 - my * newScale },
      }));
      return;
    }
    const b = data.building;
    const hotspotCX = b.hotspot.x + b.hotspot.width / 2;
    const hotspotCY = b.hotspot.y + b.hotspot.height / 2;
    const scale = Math.max(mapState.transform.scale * 1.5, 1.5);
    const tx = containerWidth / 2 - hotspotCX * scale;
    const ty = containerHeight / 2 - hotspotCY * scale;
    window.dispatchEvent(new CustomEvent('map-navigate', { detail: { scale, x: tx, y: ty } }));
  }, [mapState]);

  const handleMinimapNavigate = useCallback((t: MapTransform) => {
    window.dispatchEvent(new CustomEvent('map-navigate', { detail: t }));
  }, []);

  /* 搜索选中 → 地图飞入 + 弹出详情 */
  const handleSearchSelect = useCallback((building: Building) => {
    const { transform, containerWidth, containerHeight, imageWidth, imageHeight } = mapState;
    if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) return;

    const hotspotCX = building.hotspot.x + building.hotspot.width / 2;
    const hotspotCY = building.hotspot.y + building.hotspot.height / 2;
    const scale = Math.max(transform.scale, 1.5);
    const tx = containerWidth / 2 - hotspotCX * scale;
    const ty = containerHeight / 2 - hotspotCY * scale;

    window.dispatchEvent(new CustomEvent('map-navigate', { detail: { scale, x: tx, y: ty } }));
    setSelectedBuilding(building);
  }, [mapState]);

  return (
    <div className="app">
      <TopBar
        buildings={buildings}
        onSearchSelect={handleSearchSelect}
      />
      <main className="app-main">
        <MapView
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          onBuildingClick={handleBuildingClick}
          onMapStateChange={setMapState}
        />
      </main>
      {!selectedBuilding && (
        <Minimap
          imageSrc={mapState.imageSrc || '/placeholder-map.svg'}
          imageWidth={mapState.imageWidth}
          imageHeight={mapState.imageHeight}
          transform={mapState.transform}
          containerWidth={mapState.containerWidth}
          containerHeight={mapState.containerHeight}
          onNavigate={handleMinimapNavigate}
        />
      )}
      {!selectedBuilding && (
        <ChatWidget
          selectedBuilding={selectedBuilding}
          onViewBuilding={(bld) => handleSearchSelect(bld)}
        />
      )}
    </div>
  );
}

export default App;
