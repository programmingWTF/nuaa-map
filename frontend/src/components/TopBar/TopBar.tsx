import { useState, useRef, useEffect, useCallback } from 'react';
import type { Building } from '../../types';
import './TopBar.css';

interface TopBarProps {
  buildings: Building[];
  onSearchSelect: (building: Building) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  teaching: '教学楼', dormitory: '宿舍', canteen: '食堂',
  library: '图书馆', sports: '体育设施', service: '生活服务',
  gate: '校门', landscape: '景观', facility: '设施', other: '其他',
};

/* 简单模糊匹配：搜索词各字符在目标中按顺序出现即匹配 */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function TopBar({ buildings, onSearchSelect }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* 搜索结果 */
  const results = query.trim().length > 0
    ? buildings
        .filter(b => fuzzyMatch(query, b.name) || fuzzyMatch(query, CATEGORY_LABELS[b.category] || b.category))
        .slice(0, 8)
    : [];

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIdx(0);
  }, []);

  const select = useCallback((b: Building) => {
    onSearchSelect(b);
    close();
  }, [onSearchSelect, close]);

  /* Ctrl+K / Escape 快捷键 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  /* 点击外部关闭 */
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { select(results[selectedIdx]); }
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">NUAA</span>
        <h1 className="topbar-title">天目湖校区地图</h1>
      </div>
      <div className={`topbar-search${isOpen ? ' topbar-search--open' : ''}`} ref={panelRef}>
        <svg className="topbar-search-icon" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          className="topbar-search-input"
          type="text"
          placeholder="搜索建筑…"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="topbar-search-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="清除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <kbd className="topbar-search-kbd">Ctrl+K</kbd>

        {/* 搜索结果下拉 */}
        {isOpen && results.length > 0 && (
          <div className="topbar-search-panel">
            {results.map((b, i) => (
              <button
                key={b.id}
                className={`topbar-search-item${i === selectedIdx ? ' topbar-search-item--active' : ''}`}
                onClick={() => select(b)}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <span className="topbar-search-item-icon" data-cat={b.category} />
                <span className="topbar-search-item-info">
                  <span className="topbar-search-item-name">{b.name}</span>
                  <span className="topbar-search-item-cat">{CATEGORY_LABELS[b.category]}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 无结果 */}
        {isOpen && query.trim() && results.length === 0 && (
          <div className="topbar-search-panel">
            <div className="topbar-search-empty">未找到匹配的建筑</div>
          </div>
        )}
      </div>
    </header>
  );
}
