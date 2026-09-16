"use client";

import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./SeekBar.module.css";

const KEYBOARD_STEP = 0.05;

interface SeekBarProps {
  /** 0..1 */
  value: number;
  onChange: (ratio: number) => void;
  label: string;
  /** Текущее значение словами — для скринридеров: «1:12 из 3:45» */
  valueText: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Полоса перемотки и громкости: клик, перетаскивание и стрелки на клавиатуре.
 * Цвета — через --seek-track, --seek-fill и --seek-thumb: в пузырях и в просмотрщике они разные.
 */
export function SeekBar({ value, onChange, label, valueText, disabled = false, className }: SeekBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const clampedValue = Math.min(1, Math.max(0, value));

  function changeTo(ratio: number) {
    onChange(Math.min(1, Math.max(0, ratio)));
  }

  function changeToPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    changeTo((event.clientX - rect.left) / rect.width);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.button !== 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    changeToPointer(event);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;

    const target = {
      ArrowRight: clampedValue + KEYBOARD_STEP,
      ArrowUp: clampedValue + KEYBOARD_STEP,
      ArrowLeft: clampedValue - KEYBOARD_STEP,
      ArrowDown: clampedValue - KEYBOARD_STEP,
      Home: 0,
      End: 1,
    }[event.key];
    if (target === undefined) return;

    // Просмотрщик листает стрелками — отмена события говорит ему, что стрелку уже обработали
    event.preventDefault();
    changeTo(target);
  }

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clampedValue * 100)}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      className={cn(styles.bar, className)}
      style={{ "--seek-value": clampedValue } as CSSProperties}
      data-dragging={isDragging || undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => {
        if (isDragging) changeToPointer(event);
      }}
      onPointerUp={() => setIsDragging(false)}
      onPointerCancel={() => setIsDragging(false)}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.track}>
        <span className={styles.fill} />
      </span>
      <span className={styles.thumb} />
    </div>
  );
}
