"use client";

import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useEffect } from "react";
import { Icon, IconButton } from "@/shared/ui";
import { LIVE_LEVELS_COUNT, MAX_DURATION_MS, type RecordingKind } from "../hooks/useMessageRecorder";
import { formatDuration } from "../lib/format";
import styles from "./RecordingBar.module.css";

interface RecordingBarProps {
  kind: RecordingKind;
  elapsedMs: number;
  levels: number[];
  /** Запись закреплена: кнопку отпустили, отправка и отмена — кнопками */
  isLocked: boolean;
  /** Смещение пальца влево, px — подсказка отмены едет вслед */
  offsetX: number;
  onCancel: () => void;
  onSend: () => void;
}

/** Заменяет поле ввода на время записи: таймер, волна и отмена */
export function RecordingBar({ kind, elapsedMs, levels, isLocked, offsetX, onCancel, onSend }: RecordingBarProps) {
  const isVideo = kind === "video";

  // Горячие клавиши на время записи: Enter — отправить, Esc — отменить
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;
      // Не мешаем модальным окнам и собственной активации кнопок
      if (event.target instanceof Element && event.target.closest("dialog")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      } else if (event.key === "Enter" && !event.repeat && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        onSend();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onSend]);

  // Новые уровни появляются справа, свободные слоты — слева
  const bars = [
    ...Array<number>(Math.max(0, LIVE_LEVELS_COUNT - levels.length)).fill(0),
    ...levels.slice(-LIVE_LEVELS_COUNT),
  ];

  return (
    <div className={styles.bar}>
      {isLocked && (
        <IconButton label="Отменить запись" onClick={onCancel} className={styles.cancel}>
          <Icon icon={Delete02Icon} size={20} />
        </IconButton>
      )}

      <span className={styles.status}>
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.timer}>{formatDuration(elapsedMs)}</span>
        {isVideo && <span className={styles.limit}>/ {formatDuration(MAX_DURATION_MS.video)}</span>}
      </span>
      <span className="sr-only">
        {isVideo ? "Идёт запись видеосообщения." : "Идёт запись голосового сообщения."}{" "}
        {isLocked ? "Enter — отправить, Escape — отменить" : "Отпустите кнопку, чтобы отправить. Escape — отменить"}
      </span>

      {isLocked ? (
        <>
          {isVideo ? (
            <span className={styles.label} aria-hidden="true">
              Видеосообщение
            </span>
          ) : (
            <span className={styles.waveform} aria-hidden="true">
              {bars.map((level, index) => (
                <span key={index} className={styles.level} style={{ height: `${Math.max(12, level * 100)}%` }} />
              ))}
            </span>
          )}

          <span className={styles.hint} aria-hidden="true">
            <kbd>Esc</kbd> отмена
          </span>
        </>
      ) : (
        <span className={styles.slideSlot} aria-hidden="true">
          <span
            className={styles.slideHint}
            // Подсказка уезжает за пальцем медленнее него и тает ближе к порогу отмены
            style={{ transform: `translateX(${offsetX * 0.6}px)`, opacity: 1 + offsetX / 140 }}
          >
            <Icon icon={ArrowLeft01Icon} size={16} />
            Влево — отмена
          </span>
        </span>
      )}
    </div>
  );
}
