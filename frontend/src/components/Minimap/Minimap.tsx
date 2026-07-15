import { useRef, useCallback, useEffect } from 'react';
import type { MapTransform } from '../../types';
import './Minimap.css';

interface MinimapProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  transform: MapTransform;
  containerWidth: number;
  containerHeight: number;
  onNavigate: (t: MapTransform) => void;
}

const MINIMAP_W = 180;
const DRAG_THRESHOLD = 3; // 超过此像素才视为拖拽

export function Minimap({
  imageSrc, imageWidth, imageHeight, transform,
  containerWidth, containerHeight, onNavigate,
}: MinimapProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  // 缩略图高度按图片真实比例计算（地图 1536×1536 → 1:1 → minimap 180×180）
  const minimapH = imageHeight > 0 ? Math.round(MINIMAP_W * imageHeight / imageWidth) : 120;
  // X/Y 分别使用独立 scale，避免方形地图在非方形缩略图上的坐标偏移
  const scaleX = imageWidth > 0 ? MINIMAP_W / imageWidth : 1;
  const scaleY = imageHeight > 0 ? minimapH / imageHeight : 1;

  // 拖拽状态
  const dragRef = useRef({
    active: false,       // 是否正在拖拽
    startX: 0, startY: 0,
    startTx: 0, startTy: 0,
    moved: false,        // 是否移动超过阈值
  });

  // Refs 保存最新值，供全局 document mousemove 使用（避免闭包过期）
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;
  const transformRef = useRef(transform);
  transformRef.current = transform;
  const scaleRef = useRef({ scaleX, scaleY });
  scaleRef.current = { scaleX, scaleY };

  /* 视口指示器 */
  const visX = -transform.x / transform.scale;
  const visY = -transform.y / transform.scale;
  const visW = containerWidth / transform.scale;
  const visH = containerHeight / transform.scale;

  const ix = visX * scaleX, iy = visY * scaleY;
  const iw = visW * scaleX, ih = visH * scaleY;
  const cx = Math.max(0, ix), cy = Math.max(0, iy);
  const cw = Math.min(MINIMAP_W - cx, iw + (ix < 0 ? ix : 0));
  const ch = Math.min(minimapH - cy, ih + (iy < 0 ? iy : 0));

  /* ── 鼠标按下 ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startTx: transform.x,
      startTy: transform.y,
      moved: false,
    };
  }, [transform.x, transform.y]);

  /* ── 全局 mousemove（鼠标拖出缩略图也能继续拖拽） ── */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (!dragRef.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        dragRef.current.moved = true;
      }
      if (!dragRef.current.moved) return;
      const { scaleX: sx, scaleY: sy } = scaleRef.current;
      const mapDx = dx / sx;
      const mapDy = dy / sy;
      const t = transformRef.current;
      navRef.current({
        ...t,
        x: dragRef.current.startTx - mapDx * t.scale,
        y: dragRef.current.startTy - mapDy * t.scale,
      });
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  /* ── 鼠标松开 ── */
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;

    // 没有拖拽 → 视为点击跳转
    if (!dragRef.current.moved) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) { dragRef.current.active = false; return; }
      const mapX = (e.clientX - rect.left) / scaleX;
      const mapY = (e.clientY - rect.top) / scaleY;
      onNavigate({
        ...transform,
        x: containerWidth / 2 - mapX * transform.scale,
        y: containerHeight / 2 - mapY * transform.scale,
      });
    }

    dragRef.current.active = false;
    dragRef.current.moved = false;
  }, [scaleX, scaleY, transform, containerWidth, containerHeight, onNavigate]);

  /* ── 全局 mouseup（拖出缩略图外也结束） ── */
  useEffect(() => {
    const up = () => { dragRef.current.active = false; dragRef.current.moved = false; };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  /* ── 触摸事件 ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    dragRef.current = {
      active: true, startX: t.clientX, startY: t.clientY,
      startTx: transform.x, startTy: transform.y, moved: false,
    };
  }, [transform.x, transform.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.active || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.startX;
    const dy = t.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      dragRef.current.moved = true;
    }
    if (!dragRef.current.moved) return;
    const mapDx = dx / scaleX;
    const mapDy = dy / scaleY;
    onNavigate({
      ...transform,
      x: dragRef.current.startTx - mapDx * transform.scale,
      y: dragRef.current.startTy - mapDy * transform.scale,
    });
  }, [scaleX, scaleY, transform, onNavigate]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.moved = false;
  }, []);

  if (imageWidth === 0) return null;

  return (
    <div className="minimap">
      <div className="minimap-label">总览</div>
      <div
        ref={canvasRef}
        className="minimap-canvas minimap-canvas--draggable"
        style={{ width: MINIMAP_W, height: minimapH }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="img"
        aria-label="地图缩略图，拖拽或点击可导航"
      >
        <img className="minimap-img" src={imageSrc} alt=""
          style={{ width: MINIMAP_W, height: minimapH }} draggable={false} />
        {cw > 0 && ch > 0 ? (
          <div
            className="minimap-viewport minimap-viewport--drag"
            style={{ left: cx, top: cy, width: cw, height: ch }}
          />
        ) : (
          <div className="minimap-viewport minimap-viewport--full" />
        )}
      </div>
    </div>
  );
}
