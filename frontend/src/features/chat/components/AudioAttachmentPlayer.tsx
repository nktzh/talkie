"use client";

import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { useRef, useState } from "react";
import { Icon } from "@/shared/ui";
import { formatDuration, formatFileSize } from "../lib/format";
import { MEDIA_ID_ATTRIBUTE } from "../lib/media";
import { pauseOtherPlayback } from "../lib/playback";
import type { MessageAttachment } from "../model/types";
import { SeekBar } from "./SeekBar";
import styles from "./AudioAttachmentPlayer.module.css";

/** Аудиофайл в сообщении: карточка файла, у которой вместо иконки — кнопка воспроизведения */
export function AudioAttachmentPlayer({ audio }: { audio: MessageAttachment }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  /** Длительность из метаданных — если её не передали вместе с вложением */
  const [loadedDurationMs, setLoadedDurationMs] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const durationMs = audio.durationMs ?? loadedDurationMs ?? 0;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const hasStarted = isPlaying || positionMs > 0;

  function togglePlayback() {
    const element = audioRef.current;
    if (!element) return;

    if (element.paused) {
      element.play().catch(() => setIsPlaying(false));
    } else {
      element.pause();
    }
  }

  function seekTo(ratio: number) {
    const element = audioRef.current;
    if (!element || durationMs === 0) return;

    element.currentTime = (ratio * durationMs) / 1000;
    setPositionMs(ratio * durationMs);
  }

  let details: string;
  if (hasError) {
    details = `Формат не поддерживается · ${formatFileSize(audio.size)}`;
  } else if (hasStarted) {
    details = `${formatDuration(positionMs)} / ${formatDuration(durationMs)}`;
  } else {
    details = durationMs > 0 ? `${formatDuration(durationMs)} · ${formatFileSize(audio.size)}` : formatFileSize(audio.size);
  }

  return (
    <div className={styles.player} {...{ [MEDIA_ID_ATTRIBUTE]: audio.id }}>
      <audio
        ref={audioRef}
        src={audio.url}
        preload="metadata"
        onPlay={(event) => {
          setIsPlaying(true);
          pauseOtherPlayback(event.currentTarget);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setPositionMs(0);
        }}
        onTimeUpdate={(event) => setPositionMs(event.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(event) => {
          const { duration } = event.currentTarget;
          if (Number.isFinite(duration)) setLoadedDurationMs(duration * 1000);
        }}
        onError={() => setHasError(true)}
      />

      <button
        type="button"
        className={styles.toggle}
        onClick={togglePlayback}
        disabled={hasError}
        aria-label={isPlaying ? `Пауза: ${audio.name}` : `Воспроизвести: ${audio.name}`}
      >
        <Icon icon={isPlaying ? PauseIcon : PlayIcon} size={20} />
      </button>

      <div className={styles.body}>
        <span className={styles.name} title={audio.name}>
          {audio.name}
        </span>
        <SeekBar
          className={styles.seek}
          value={progress}
          onChange={seekTo}
          disabled={hasError || durationMs === 0}
          label="Позиция воспроизведения"
          valueText={`${formatDuration(positionMs)} из ${formatDuration(durationMs)}`}
        />
        <span className={styles.details}>{details}</span>
      </div>
    </div>
  );
}
