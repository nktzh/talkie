"use client";

import { useEffect } from "react";

/** Отклонение масштаба, после которого считаем, что страницу увеличили жестом */
const ZOOM_TOLERANCE = 0.01;
/** Видимая область ниже окна хотя бы на столько — значит, открыта клавиатура, а не спряталась панель адреса */
const KEYBOARD_MIN_HEIGHT = 120;

/**
 * Держит в `--app-height` высоту видимой области без экранной клавиатуры.
 * iOS Safari не уменьшает ни layout viewport, ни `dvh`, когда открывается клавиатура, —
 * меняется только visualViewport. Без этого поле ввода внизу чата уходит под клавиатуру.
 * Android и Firefox сжимают layout viewport сами (`interactive-widget=resizes-content`),
 * там переменная просто совпадает с `100dvh`.
 * Пока клавиатура открыта, на корне стоит `data-keyboard-open`: нижняя безопасная зона под ней не нужна.
 */
export function VisualViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const root = document.documentElement;

    const sync = () => {
      // При увеличении жестом visualViewport тоже уменьшается, но это не клавиатура — оболочку не трогаем
      if (Math.abs(viewport.scale - 1) > ZOOM_TOLERANCE) return;

      root.style.setProperty("--app-height", `${viewport.height}px`);
      root.toggleAttribute("data-keyboard-open", window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT);
      // iOS прокручивает документ, чтобы показать поле над клавиатурой, и шапка уезжает вверх.
      // Оболочка уже помещается в видимую область — возвращаем документ на место
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);

    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
      root.style.removeProperty("--app-height");
      root.removeAttribute("data-keyboard-open");
    };
  }, []);

  return null;
}
