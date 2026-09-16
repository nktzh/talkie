import { useEffect, useRef, type MouseEvent, type PointerEvent } from "react";

/** Столько держать палец, чтобы жест сработал. Заметно меньше системного таймаута Android (~500 мс) */
const LONG_PRESS_MS = 300;
/** Сдвиг пальца больше этого — прокрутка, а не удержание */
const MOVE_TOLERANCE_PX = 10;
/** Удержание на этих элементах — их собственный жест: перемотка ползунком, выделение в поле ввода */
const IGNORED_TARGETS = '[role="slider"], input, textarea';

export interface LongPress<E extends HTMLElement> {
  /** Элемент, на котором висят обработчики */
  element: E;
  /** Элемент под пальцем — например, конкретное вложение */
  target: Element;
  x: number;
  y: number;
}

interface Gesture<E extends HTMLElement> extends LongPress<E> {
  pointerId: number;
  timerId: number;
}

/**
 * Долгое касание пальцем или стилусом. Мышь не участвует — у неё есть правый клик.
 * Пока жест длится, браузер не показывает своё меню и выделение, а клик после отпускания пальца гасится:
 * иначе он открыл бы фото или видео, на котором держали палец
 */
export function useLongPress<E extends HTMLElement>(onLongPress: (press: LongPress<E>) => void) {
  const gestureRef = useRef<Gesture<E> | null>(null);
  const isTouchRef = useRef(false);
  const suppressClickRef = useRef(false);
  const onLongPressRef = useRef(onLongPress);
  const releaseScrollLockRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
  });

  useEffect(
    () => () => {
      clearTimeout(gestureRef.current?.timerId);
      releaseScrollLockRef.current?.();
    },
    [],
  );

  function cancel() {
    clearTimeout(gestureRef.current?.timerId);
    gestureRef.current = null;
  }

  function fire() {
    const gesture = gestureRef.current;
    if (!gesture) return;
    cancel();

    suppressClickRef.current = true;
    lockScrollUntilRelease();
    // Касание само по себе не даёт права на вибрацию: до первого тапа по странице Chrome ругается в консоль
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(10);
    onLongPressRef.current({ element: gesture.element, target: gesture.target, x: gesture.x, y: gesture.y });
  }

  /** Меню уже открыто, а палец ещё на экране: без этого его движение прокрутило бы ленту и закрыло меню */
  function lockScrollUntilRelease() {
    releaseScrollLockRef.current?.();

    const preventScroll = (event: TouchEvent) => event.preventDefault();
    const release = () => {
      document.removeEventListener("touchmove", preventScroll);
      document.removeEventListener("touchend", release);
      document.removeEventListener("touchcancel", release);
      releaseScrollLockRef.current = null;
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("touchend", release);
    document.addEventListener("touchcancel", release);
    releaseScrollLockRef.current = release;
  }

  const handlers = {
    onPointerDown(event: PointerEvent<E>) {
      cancel();
      suppressClickRef.current = false;
      isTouchRef.current = event.pointerType !== "mouse";

      const target = event.target as Element;
      if (!isTouchRef.current || !event.isPrimary || target.closest(IGNORED_TARGETS)) return;

      gestureRef.current = {
        pointerId: event.pointerId,
        element: event.currentTarget,
        target,
        x: event.clientX,
        y: event.clientY,
        timerId: window.setTimeout(fire, LONG_PRESS_MS),
      };
    },

    onPointerMove(event: PointerEvent<E>) {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== event.pointerId) return;

      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > MOVE_TOLERANCE_PX) cancel();
    },

    onPointerUp: cancel,
    onPointerCancel: cancel,

    onClickCapture(event: MouseEvent<E>) {
      if (!suppressClickRef.current) return;

      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };

  /**
   * Системное меню на касание: Android присылает contextmenu сам, иногда раньше нашего таймера, —
   * тогда жест срабатывает сразу. Возвращает true, если событие пришло от касания и уже обработано;
   * false — это правый клик мышью, его обрабатывает вызывающий
   */
  function handleContextMenu(event: MouseEvent<E>): boolean {
    if (!isTouchRef.current) return false;

    event.preventDefault();
    fire();
    return true;
  }

  return { handlers, handleContextMenu };
}
