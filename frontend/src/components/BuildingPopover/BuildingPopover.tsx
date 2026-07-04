import { useState, useRef, useEffect, useCallback } from 'react';
import type { Building, ChatMessage } from '../../types';
import './BuildingPopover.css';

interface BuildingPopoverProps {
  building: Building;
  screenX: number; screenY: number;
  screenWidth: number; screenHeight: number;
  containerWidth: number;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<Building['category'], string> = {
  teaching: '教学楼', dormitory: '宿舍', canteen: '食堂',
  library: '图书馆', sports: '体育设施', service: '生活服务',
  gate: '校门', landscape: '景观', facility: '设施', other: '其他',
};

const POPOVER_W = 300;
const POPOVER_MAX_H = 380;
const ARROW_H = 8;
const GAP = 10;

export function BuildingPopover({
  building, screenX, screenY, screenWidth, screenHeight,
  containerWidth, onClose,
}: BuildingPopoverProps) {
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [chatMsgs]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.stopPropagation(); };
    el.addEventListener('wheel', onWheel);
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sendQuestion = useCallback(() => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatMsgs(prev => [...prev, {
      id: `q-${Date.now()}`, role: 'user', content: text, timestamp: Date.now(),
    }]);
    setChatInput(''); setChatLoading(true);
    // TODO: 对接后端 /api/chat（带 building context）
    setTimeout(() => {
      setChatMsgs(prev => [...prev, {
        id: `a-${Date.now()}`, role: 'assistant',
        content: `关于「${building.name}」的"${text}"：\n\n⑤组 RAG 接入后将基于「${building.description}」的建筑上下文给出准确回答。`,
        timestamp: Date.now(),
      }]);
      setChatLoading(false);
    }, 1000);
  }, [chatInput, chatLoading, building]);

  /* 定位 */
  const hotspotCX = screenX + screenWidth / 2;
  const hotspotTop = screenY;
  const hotspotBot = screenY + screenHeight;

  // 下方弹出：top 直接计算即可；上方弹出：用 translateY(-100%) 让弹窗底边对齐热区上方
  let anchorTop: number;
  let arrowDir: 'bottom' | 'top';
  let anchorAbove = false;

  const belowTop = hotspotBot + GAP + ARROW_H;
  if (hotspotTop - POPOVER_MAX_H - GAP - ARROW_H >= 0) {
    // 上方空间够：锚点顶边放在热区上方 GAP+ARROW_H 处，translateY(-100%) 后底边正好对齐
    anchorTop = hotspotTop - GAP - ARROW_H;
    arrowDir = 'bottom';
    anchorAbove = true;
  } else {
    anchorTop = belowTop;
    arrowDir = 'top';
  }

  let popLeft = hotspotCX - POPOVER_W / 2;
  popLeft = Math.max(8, Math.min(popLeft, containerWidth - POPOVER_W - 8));
  const arrowOff = hotspotCX - (popLeft + POPOVER_W / 2);

  return (
    <>
      <div className="popover-backdrop" onClick={onClose} />
      <div
        className={`popover-anchor${anchorAbove ? ' popover-anchor--above' : ''}`}
        style={{ left: popLeft, top: anchorTop, width: POPOVER_W }}
      >
        <div
          ref={popoverRef}
          className="popover"
          style={{ maxHeight: POPOVER_MAX_H }}
          role="dialog" aria-label={`${building.name} 详情`}
        >
          <div className={`popover-arrow popover-arrow--${arrowDir}`}
            style={{ left: `calc(50% + ${arrowOff}px)` }} />

          <div className="popover-header">
            <div>
              <span className="popover-category">{CATEGORY_LABELS[building.category]}</span>
              <h3 className="popover-name">{building.name}</h3>
            </div>
            <button className="popover-close" onClick={onClose} aria-label="关闭">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="popover-body">
            <p className="popover-desc">{building.description}</p>
            {building.openTime && (
              <div className="popover-meta-row">
                <span className="popover-meta-label">开放时间</span><span>{building.openTime}</span>
              </div>
            )}
            {building.floors && (
              <div className="popover-meta-row">
                <span className="popover-meta-label">楼层</span><span>{building.floors} 层</span>
              </div>
            )}
            {building.facilities && building.facilities.length > 0 && (
              <div className="popover-tags">
                {building.facilities.map(f => <span key={f} className="popover-tag">{f}</span>)}
              </div>
            )}

            <div className="popover-chat">
              <div className="popover-chat-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                关于{building.name}想问什么？
              </div>

              {chatMsgs.length > 0 && (
                <div className="popover-chat-msgs">
                  {chatMsgs.map(m => (
                    <div key={m.id} className={`popover-chat-msg ${m.role === 'user' ? 'popover-chat-msg--user' : ''}`}>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && <div className="popover-chat-msg popover-chat-typing">思考中…</div>}
                  <div ref={chatEndRef} />
                </div>
              )}

              <div className="popover-chat-input-row">
                <input ref={inputRef} className="popover-chat-input" type="text"
                  placeholder={`问问关于${building.name}的问题…`}
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion(); }}}
                  disabled={chatLoading} />
                <button className="popover-chat-send" onClick={sendQuestion}
                  disabled={!chatInput.trim() || chatLoading} aria-label="发送">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
