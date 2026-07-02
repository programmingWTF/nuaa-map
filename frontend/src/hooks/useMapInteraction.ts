import { useState, useRef, useCallback, useEffect } from 'react';
import type { MapTransform } from '../types';

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const ZOOM_SPEED = 0.001;

interface UseMapInteractionOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageSize: { width: number; height: number } | null;
}

export function useMapInteraction({ containerRef, imageSize }: UseMapInteractionOptions) {
  const [transform, setTransform] = useState<MapTransform>({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef({
    active: false,
    startX: 0, startY: 0,
    startTx: 0, startTy: 0,
  });

  const pinchRef = useRef({
    lastDist: 0,
    startScale: 1, startX: 0, startY: 0,
    midX: 0, midY: 0,
  });

  /* ── 滚轮缩放（以鼠标位置为中心） ── */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    setTransform(prev => {
      const delta = -e.deltaY * ZOOM_SPEED;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale + delta * prev.scale));
      const ratio = newScale / prev.scale;
      return {
        scale: newScale,
        x: cx - ratio * (cx - prev.x),
        y: cy - ratio * (cy - prev.y),
      };
    });
  }, [containerRef]);

  /* ── 鼠标拖拽 ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      startTx: transform.x, startTy: transform.y,
    };
    setIsDragging(true);
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    setTransform(prev => ({
      ...prev,
      x: dragRef.current.startTx + (e.clientX - dragRef.current.startX),
      y: dragRef.current.startTy + (e.clientY - dragRef.current.startY),
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
  }, []);

  /* ── 触摸（移动端拖拽 + 双指缩放） ── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      dragRef.current = {
        active: true,
        startX: t.clientX, startY: t.clientY,
        startTx: transform.x, startTy: transform.y,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      dragRef.current.active = false;
      setIsDragging(false);
      const [t1, t2] = [e.touches[0], e.touches[1]];
      pinchRef.current = {
        lastDist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
        startScale: transform.scale,
        startX: transform.x, startY: transform.y,
        midX: (t1.clientX + t2.clientX) / 2,
        midY: (t1.clientY + t2.clientY) / 2,
      };
    }
  }, [transform]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragRef.current.active) {
      const t = e.touches[0];
      setTransform(prev => ({
        ...prev,
        x: dragRef.current.startTx + (t.clientX - dragRef.current.startX),
        y: dragRef.current.startTy + (t.clientY - dragRef.current.startY),
      }));
    } else if (e.touches.length === 2 && pinchRef.current.lastDist > 0) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinchRef.current.lastDist;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchRef.current.startScale * ratio));

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const midX = pinchRef.current.midX - rect.left;
      const midY = pinchRef.current.midY - rect.top;
      const scaleRatio = newScale / pinchRef.current.startScale;

      setTransform({
        scale: newScale,
        x: midX - scaleRatio * (midX - pinchRef.current.startX),
        y: midY - scaleRatio * (midY - pinchRef.current.startY),
      });
    }
  }, [containerRef]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
    pinchRef.current.lastDist = 0;
  }, []);

  /* ── 适应屏幕 ── */
  const resetTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container || !imageSize) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const fitScale = Math.min(cw / imageSize.width, ch / imageSize.height, 1);

    setTransform({
      scale: fitScale,
      x: (cw - imageSize.width * fitScale) / 2,
      y: (ch - imageSize.height * fitScale) / 2,
    });
  }, [containerRef, imageSize]);

  // 图片加载完成后自动适应
  useEffect(() => {
    if (imageSize) {
      requestAnimationFrame(() => resetTransform());
    }
  }, [imageSize, resetTransform]);

  // 全局 mouseup（鼠标拖出容器外也能结束拖拽）
  useEffect(() => {
    const up = () => { dragRef.current.active = false; setIsDragging(false); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // 注册滚轮事件
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);

  return {
    transform,
    setTransform,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    resetTransform,
  };
}
