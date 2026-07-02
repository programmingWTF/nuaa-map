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

  const handleBuildingClick = useCallback((data: BuildingClickData | null) => {
    setSelectedBuilding(data?.building ?? null);
  }, []);

  const handleMinimapNavigate = useCallback((t: MapTransform) => {
    // Minimap 导航通过更新 mapState 来实现，但这需要 MapView 响应。
    // 当前方案：通过 window.dispatchEvent 向 MapView 发送自定义事件
    window.dispatchEvent(new CustomEvent('map-navigate', { detail: t }));
  }, []);

  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        <MapView
          buildings={buildings}
          selectedBuilding={selectedBuilding}
          onBuildingClick={handleBuildingClick}
          onMapStateChange={setMapState}
        />
      </main>
      <Minimap
        imageSrc={mapState.imageSrc || '/placeholder-map.svg'}
        imageWidth={mapState.imageWidth}
        imageHeight={mapState.imageHeight}
        transform={mapState.transform}
        containerWidth={mapState.containerWidth}
        containerHeight={mapState.containerHeight}
        onNavigate={handleMinimapNavigate}
      />
      <ChatWidget />
    </div>
  );
}

export default App;
