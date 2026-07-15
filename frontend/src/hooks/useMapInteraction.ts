import { useState, useRef, useCallback, useEffect } from 'react';
import type { MapTransform } from '../types';

const MAX_SCALE = 4;
const ZOOM_SPEED = 0.001;

interface UseMapInteractionOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  imageSize: { width: number; height: number } | null;
}

/** 钳制变换，确保图片始终覆盖容器（拖拽不超出边界，不留白边） */
function clampTransform(
  t: MapTransform,
  cw: number, ch: number,
  iw: number, ih: number,
): MapTransform {
  const maxX = 0;
  const minX = cw - iw * t.scale;
  const maxY = 0;
  const minY = ch - ih * t.scale;

  return {
    scale: t.scale,
    // 图片比容器窄时居中，否则钳制在边界内
    x: minX > maxX ? (cw - iw * t.scale) / 2 : Math.min(maxX, Math.max(minX, t.x)),
    y: minY > maxY ? (ch - ih * t.scale) / 2 : Math.min(maxY, Math.max(minY, t.y)),
  };
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

  /* 动态最小缩放 = 容器宽度 / 图片宽度（保证左右边界对齐窗口） */
  const getMinScale = useCallback(() => {
    const cw = containerRef.current?.clientWidth;
    if (!cw || cw === 0 || !imageSize) return 0.5;
    return cw / imageSize.width;
  }, [containerRef, imageSize]);

  /* 双击放大 */
  const lastTapRef = useRef(0);
  const DOUBLE_TAP_MS = 300;
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || !imageSize) return;
    const rect = container.getBoundingClientRect();
    const now = Date.now();
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;

    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      // 双击：以点击位置为中心放大
      setTransform(prev => {
        const targetScale = prev.scale >= 2 ? getMinScale() : Math.min(MAX_SCALE, prev.scale * 2);
        const cx = clientX - rect.left;
        const cy = clientY - rect.top;
        const ratio = targetScale / prev.scale;
        return clampTransform(
          { scale: targetScale, x: cx - ratio * (cx - prev.x), y: cy - ratio * (cy - prev.y) },
          rect.width, rect.height, imageSize.width, imageSize.height,
        );
      });
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [containerRef, imageSize, getMinScale]);

  /* ── 滚轮缩放（以鼠标位置为中心，钳制边界） ── */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container || !imageSize) return;

    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const cw = rect.width;
    const ch = rect.height;

    setTransform(prev => {
      const minScale = getMinScale();
      const delta = -e.deltaY * ZOOM_SPEED;
      const newScale = Math.min(MAX_SCALE, Math.max(minScale, prev.scale + delta * prev.scale));
      const ratio = newScale / prev.scale;
      return clampTransform(
        { scale: newScale, x: cx - ratio * (cx - prev.x), y: cy - ratio * (cy - prev.y) },
        cw, ch, imageSize.width, imageSize.height,
      );
    });
  }, [containerRef, imageSize, getMinScale]);

  /* ── 鼠标拖拽（钳制边界） ── */
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
    const container = containerRef.current;
    if (!container || !imageSize) return;
    const rect = container.getBoundingClientRect();

    setTransform(prev =>
      clampTransform(
        {
          ...prev,
          x: dragRef.current.startTx + (e.clientX - dragRef.current.startX),
          y: dragRef.current.startTy + (e.clientY - dragRef.current.startY),
        },
        rect.width, rect.height, imageSize.width, imageSize.height,
      ),
    );
  }, [containerRef, imageSize]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
  }, []);

  /* ── 触摸（移动端拖拽 + 双指缩放，钳制边界） ── */
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
    const container = containerRef.current;
    if (!container || !imageSize) return;
    const rect = container.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const iw = imageSize.width;
    const ih = imageSize.height;

    if (e.touches.length === 1 && dragRef.current.active) {
      const t = e.touches[0];
      setTransform(prev =>
        clampTransform(
          {
            ...prev,
            x: dragRef.current.startTx + (t.clientX - dragRef.current.startX),
            y: dragRef.current.startTy + (t.clientY - dragRef.current.startY),
          },
          cw, ch, iw, ih,
        ),
      );
    } else if (e.touches.length === 2 && pinchRef.current.lastDist > 0) {
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinchRef.current.lastDist;
      const minScale = getMinScale();
      const newScale = Math.min(MAX_SCALE, Math.max(minScale, pinchRef.current.startScale * ratio));

      const midX = pinchRef.current.midX - rect.left;
      const midY = pinchRef.current.midY - rect.top;
      const scaleRatio = newScale / pinchRef.current.startScale;

      setTransform(
        clampTransform(
          {
            scale: newScale,
            x: midX - scaleRatio * (midX - pinchRef.current.startX),
            y: midY - scaleRatio * (midY - pinchRef.current.startY),
          },
          cw, ch, iw, ih,
        ),
      );
    }
  }, [containerRef, imageSize, getMinScale]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
    pinchRef.current.lastDist = 0;
  }, []);

  /* ── 适应屏幕：宽度适配，左右边界对齐窗口 ── */
  const resetTransform = useCallback(() => {
    const container = containerRef.current;
    if (!container || !imageSize) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw === 0 || ch === 0) return;

    const fitScale = cw / imageSize.width;

    setTransform({
      scale: fitScale,
      x: 0,
      y: (ch - imageSize.height * fitScale) / 2,
    });
  }, [containerRef, imageSize]);

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

  /* 触摸开始：同时处理拖拽 + 双击检测 */
  const handleTouchStartWithDoubleTap = useCallback((e: React.TouchEvent) => {
    handleTouchStart(e);
    handleDoubleTap(e);
  }, [handleTouchStart, handleDoubleTap]);

  return {
    transform,
    setTransform,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onTouchStart: handleTouchStartWithDoubleTap,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onDoubleClick: handleDoubleTap,
    },
    resetTransform,
  };
}
