"use client";

import { PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { formatDuration } from "../lib/format";
import { pauseOtherPlayback } from "../lib/playback";
import type { VoiceNote } from "../model/types";
import styles from "./VoiceMessagePlayer.module.css";

const KEYBOARD_SEEK_STEP = 0.05;

export function VoiceMessagePlayer({ voice }: { voice: VoiceNote }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);

  // Длительность берём из записи: у webm из MediaRecorder в метаданных её нет
  const progress = voice.durationMs > 0 ? Math.min(1, positionMs / voice.durationMs) : 0;

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }

  function seekTo(ratio: number) {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedRatio = Math.min(1, Math.max(0, ratio));
    audio.currentTime = (clampedRatio * voice.durationMs) / 1000;
    setPositionMs(clampedRatio * voice.durationMs);
  }

  function handleWaveformClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo((event.clientX - rect.left) / rect.width);
  }

  function handleWaveformKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
    if (!direction) return;

    event.preventDefault();
    seekTo(progress + direction * KEYBOARD_SEEK_STEP);
  }

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={voice.url}
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
      />

      <button
        type="button"
        className={styles.toggle}
        onClick={togglePlayback}
        aria-label={isPlaying ? "Пауза" : "Воспроизвести голосовое сообщение"}
      >
        <Icon icon={isPlaying ? PauseIcon : PlayIcon} size={20} />
      </button>

      <div className={styles.body}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Позиция воспроизведения"
          aria-valuemin={0}
          aria-valuemax={Math.round(voice.durationMs / 1000)}
          aria-valuenow={Math.floor(positionMs / 1000)}
          aria-valuetext={`${formatDuration(positionMs)} из ${formatDuration(voice.durationMs)}`}
          className={styles.waveform}
          onClick={handleWaveformClick}
          onKeyDown={handleWaveformKeyDown}
        >
          {voice.waveform.map((value, index) => (
            <span
              key={index}
              className={cn(styles.bar, index / voice.waveform.length < progress && styles.played)}
              style={{ height: `${Math.max(15, value * 100)}%` }}
            />
          ))}
        </div>
        <span className={styles.duration}>
          {formatDuration(isPlaying || positionMs > 0 ? positionMs : voice.durationMs)}
        </span>
      </div>
    </div>
  );
}
