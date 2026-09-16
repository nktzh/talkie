import { useLayoutEffect, useRef } from "react";

/**
 * Панель (шапка списка, подвал чата) лежит поверх прокручиваемой области, чтобы стеклу
 * и градиенту было над чем показывать. Хук следит за её высотой и передаёт её контейнеру
 * через CSS-переменную — на неё область делает отступ, без перерисовки React на каждый рост панели.
 */
export function useOverlayInset<TContainer extends HTMLElement, TOverlay extends HTMLElement>(cssVar: string) {
  const containerRef = useRef<TContainer>(null);
  const overlayRef = useRef<TOverlay>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) return;

    // contentRect — без padding: отступ, продлевающий градиент, занят только им и область не сдвигает
    const observer = new ResizeObserver(([entry]) => {
      container.style.setProperty(cssVar, `${entry.contentRect.height}px`);
    });
    observer.observe(overlay);

    return () => observer.disconnect();
  }, [cssVar]);

  return { containerRef, overlayRef };
}
