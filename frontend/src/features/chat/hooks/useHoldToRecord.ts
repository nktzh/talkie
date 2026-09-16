import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

/** Нажатие короче этого — переключение режима, дольше — начало записи */
const HOLD_DELAY_MS = 250;
/** Насколько увести палец вверх, чтобы закрепить запись и отпустить кнопку */
const LOCK_DISTANCE_PX = 72;
/** Насколько увести палец влево, чтобы отменить запись */
const CANCEL_DISTANCE_PX = 120;

interface Gesture {
  /** null — жест с клавиатуры */
  pointerId: number | null;
  startX: number;
  startY: number;
  timerId: number;
  isHolding: boolean;
}

interface UseHoldToRecordOptions {
  /** Жест доступен, только пока кнопка в режиме записи */
  enabled: boolean;
  /** Короткое нажатие */
  onTap: () => void;
  /** Кнопку удерживают — пора записывать */
  onHoldStart: () => void;
  /** Кнопку отпустили, запись не закреплена — отправляем */
  onRelease: () => void;
  onCancel: () => void;
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

/**
 * Жест кнопки записи, как в Telegram: удерживать — записывать, отпустить — отправить,
 * увести вверх — закрепить запись, влево — отменить, коротко нажать — сменить голос на видео.
 * С клавиатуры удержание Space/Enter сразу закрепляет запись: дальше Enter отправляет, Esc отменяет.
 */
export function useHoldToRecord(options: UseHoldToRecordOptions) {
  const [isLocked, setIsLocked] = useState(false);
  /** Смещение влево, px (≤ 0) — подсказка «отмена» едет вслед за пальцем */
  const [offsetX, setOffsetX] = useState(0);
  /** Насколько близко к закреплению, 0..1 */
  const [lockProgress, setLockProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const gestureRef = useRef<Gesture | null>(null);
  const isLockedRef = useRef(false);
  /** После жеста браузер присылает click — его нельзя принять за нажатие «Отправить» */
  const suppressClickRef = useRef(false);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => () => clearTimeout(gestureRef.current?.timerId), []);

  function lock(locked: boolean) {
    isLockedRef.current = locked;
    setIsLocked(locked);
  }

  function resetDrag() {
    setOffsetX(0);
    setLockProgress(0);
  }

  function begin(pointerId: number | null, x: number, y: number) {
    lock(false);
    resetDrag();

    const gesture: Gesture = { pointerId, startX: x, startY: y, timerId: 0, isHolding: false };
    gesture.timerId = window.setTimeout(() => {
      gesture.isHolding = true;
      setIsHolding(true);
      // С клавиатуры тянуть некуда — запись сразу закреплена
      if (pointerId === null) lock(true);
      optionsRef.current.onHoldStart();
    }, HOLD_DELAY_MS);
    gestureRef.current = gesture;
  }

  /** Завершает жест; возвращает его, если он был */
  function end() {
    const gesture = gestureRef.current;
    if (!gesture) return null;

    clearTimeout(gesture.timerId);
    gestureRef.current = null;
    setIsHolding(false);
    resetDrag();
    return gesture;
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    suppressClickRef.current = false;
    if (!optionsRef.current.enabled || event.button !== 0 || gestureRef.current) return;

    // Фокус остаётся в поле ввода, а долгое касание не выделяет текст
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    begin(event.pointerId, event.clientX, event.clientY);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || !gesture.isHolding || isLockedRef.current) return;

    const deltaX = Math.min(0, event.clientX - gesture.startX);
    const deltaY = Math.min(0, event.clientY - gesture.startY);

    if (-deltaX >= CANCEL_DISTANCE_PX) {
      end();
      optionsRef.current.onCancel();
      return;
    }

    if (-deltaY >= LOCK_DISTANCE_PX) {
      lock(true);
      resetDrag();
      return;
    }

    setOffsetX(deltaX);
    setLockProgress(-deltaY / LOCK_DISTANCE_PX);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (gestureRef.current?.pointerId !== event.pointerId) return;

    const gesture = end();
    suppressClickRef.current = true;
    if (!gesture?.isHolding) optionsRef.current.onTap();
    else if (!isLockedRef.current) optionsRef.current.onRelease();
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (gestureRef.current?.pointerId !== event.pointerId) return;

    const gesture = end();
    if (gesture?.isHolding && !isLockedRef.current) optionsRef.current.onCancel();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isActivationKey(event.key) || !optionsRef.current.enabled) return;

    // Иначе браузер сам «нажмёт» кнопку
    event.preventDefault();
    if (event.repeat || gestureRef.current) return;
    begin(null, 0, 0);
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (!isActivationKey(event.key) || gestureRef.current?.pointerId !== null) return;

    event.preventDefault();
    const gesture = end();
    if (!gesture?.isHolding) optionsRef.current.onTap();

    // Space активирует кнопку на keyup — гасим этот click
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    });
  }

  /** Потеряли фокус, не дождавшись начала записи — жест отменяется */
  function handleBlur() {
    if (gestureRef.current?.pointerId === null && !gestureRef.current.isHolding) end();
  }

  return {
    isLocked,
    isHolding,
    offsetX,
    lockProgress,
    /** true, если click порождён жестом и обрабатывать его не нужно */
    consumeGestureClick: () => {
      const isSuppressed = suppressClickRef.current;
      suppressClickRef.current = false;
      return isSuppressed;
    },
    buttonProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onKeyDown: handleKeyDown,
      onKeyUp: handleKeyUp,
      onBlur: handleBlur,
      // Долгое касание на телефоне не должно открывать системное меню
      onContextMenu: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
    },
  };
}
