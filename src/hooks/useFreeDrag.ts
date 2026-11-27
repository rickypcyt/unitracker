import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const INTERACTIVE = "button, a, input, select, textarea, [role='slider']";
const RESIZE_CORNER = 20;

/** Lets a floating element be dragged with mouse or touch. */
export const useFreeDrag = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as Element).closest(INTERACTIVE)) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    // Leave the bottom-right corner free for CSS resize.
    const onCorner = e.clientX > rect.right - RESIZE_CORNER && e.clientY > rect.bottom - RESIZE_CORNER;
    if (el.style.resize === "both" && onCorner) return;
    start.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!start.current) return;
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };

  const stop = () => {
    start.current = null;
  };

  const style: CSSProperties = { translate: `${offset.x}px ${offset.y}px`, touchAction: "none" };

  return {
    style,
    handlers: { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop },
  };
};
