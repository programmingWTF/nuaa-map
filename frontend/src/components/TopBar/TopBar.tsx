import './TopBar.css';

interface TopBarProps {
  onSearchFocus?: () => void;
}

export function TopBar({ onSearchFocus }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">NUAA</span>
        <h1 className="topbar-title">天目湖校区地图</h1>
      </div>
      <div className="topbar-search">
        <svg
          className="topbar-search-icon"
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="topbar-search-input"
          type="text"
          placeholder="搜索建筑、地点…"
          onFocus={onSearchFocus}
        />
      </div>
    </header>
  );
}
