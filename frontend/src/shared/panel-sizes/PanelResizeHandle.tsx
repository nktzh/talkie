"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { RESIZABLE_PANELS, clampPanelWidth, type ResizablePanelId } from "./constants";
import styles from "./PanelResizeHandle.module.css";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const KEYBOARD_STEP = 16;
const KEYBOARD_STEP_LARGE = 64;

interface PanelResizeHandleProps {
  panel: ResizablePanelId;
  /** Край панели, за который её тянут: у левой колонки — правый, у правой — левый */
  edge: "left" | "right";
  label: string;
  className?: string;
}

interface DragState {
  pointerId: number;
  startX: number;
  startWidth: number;
  width: number;
}

/**
 * Ручка на границе панели. Кладётся внутрь панели (родитель должен быть позиционирован)
 * и меняет CSS-переменную ширины на <html>. Двойной клик возвращает ширину по умолчанию.
 */
export function PanelResizeHandle({ panel, edge, label, className }: PanelResizeHandleProps) {
  const dragRef = useRef<DragState | null>(null);
  const { cssVariable, cookieName, minWidth, maxWidth } = RESIZABLE_PANELS[panel];
  // Тянем от панели — растёт; у правой панели это движение влево
  const direction = edge === "right" ? 1 : -1;

  function getPanelWidth(handle: HTMLElement): number {
    return handle.parentElement?.getBoundingClientRect().width ?? minWidth;
  }

  function applyWidth(width: number) {
    document.documentElement.style.setProperty(cssVariable, `${width}px`);
  }

  function saveWidth(width: number) {
    document.cookie = `${cookieName}=${width}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
  }

  function resetWidth() {
    document.documentElement.style.removeProperty(cssVariable);
    document.cookie = `${cookieName}=; path=/; max-age=0; samesite=lax`;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Без этого браузер начнёт выделять текст в ленте, пока тянем
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startWidth = getPanelWidth(event.currentTarget);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth, width: startWidth };
    event.currentTarget.dataset.dragging = "";
    document.documentElement.dataset.panelResizing = "";
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // Ширина считается от точки захвата, а не накапливается: курсор за пределом и обратно не сбивает ручку
    drag.width = clampPanelWidth(panel, drag.startWidth + (event.clientX - drag.startX) * direction);
    applyWidth(drag.width);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
    delete document.documentElement.dataset.panelResizing;
    if (drag.width !== drag.startWidth) saveWidth(drag.width);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    const currentWidth = getPanelWidth(event.currentTarget);
    let width: number;

    switch (event.key) {
      case "ArrowRight":
        width = currentWidth + step * direction;
        break;
      case "ArrowLeft":
        width = currentWidth - step * direction;
        break;
      case "Home":
        width = minWidth;
        break;
      case "End":
        width = maxWidth;
        break;
      default:
        return;
    }

    event.preventDefault();
    width = clampPanelWidth(panel, width);
    applyWidth(width);
    saveWidth(width);
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      tabIndex={0}
      title="Потяните, чтобы изменить ширину. Двойной клик — исходная ширина"
      className={cn(styles.handle, edge === "right" ? styles.right : styles.left, className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onDoubleClick={resetWidth}
      onKeyDown={handleKeyDown}
    />
  );
}
