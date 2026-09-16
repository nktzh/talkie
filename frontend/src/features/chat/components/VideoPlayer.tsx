"use client";

import {
  FullScreenIcon,
  MinimizeScreenIcon,
  PauseIcon,
  PlayIcon,
  VolumeHighIcon,
  VolumeOffIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/shared/ui";
import { formatDuration } from "../lib/format";
import { pauseOtherPlayback } from "../lib/playback";
import type { MessageAttachment } from "../model/types";
import { SeekBar } from "./SeekBar";
import styles from "./VideoPlayer.module.css";

/** Сколько панель управления остаётся на экране после последнего движения мыши */
const CONTROLS_HIDE_DELAY_MS = 2500;
const DEFAULT_VIDEO_RATIO = 16 / 9;

/** Нажатие пришло в элемент, у которого своя реакция на клавиши — горячие клавиши плеера его не перебивают */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("button, input, textarea, [role='slider']") !== null;
}

/**
 * Видео в просмотрщике. Запускается сразу, панель управления прячется, пока видео играет
 * и мышь не двигается. Горячие клавиши: пробел или K — пауза, M — звук, F — полный экран.
 */
export function VideoPlayer({ video }: { video: MessageAttachment }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [loadedDurationMs, setLoadedDurationMs] = useState<number | null>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [hasError, setHasError] = useState(false);

  const durationMs = video.durationMs ?? loadedDurationMs ?? 0;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const ratio = video.width && video.height ? video.width / video.height : DEFAULT_VIDEO_RATIO;
  const isSilent = isMuted || volume === 0;
  // Плеер монтируется только в открытом просмотрщике, то есть уже в браузере
  const canFullscreen = document.fullscreenEnabled;

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const element = videoRef.current;
      if (!element || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if ((key === " " || key === "k") && !(key === " " && isInteractiveTarget(event.target))) {
        event.preventDefault();
        if (element.paused) element.play().catch(() => {});
        else element.pause();
      } else if (key === "m") {
        element.muted = !element.muted;
      } else if (key === "f" && document.fullscreenEnabled) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else containerRef.current?.requestFullscreen().catch(() => {});
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  function wakeControls() {
    setIsIdle(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsIdle(true), CONTROLS_HIDE_DELAY_MS);
  }

  function togglePlayback() {
    const element = videoRef.current;
    if (!element) return;

    if (element.paused) element.play().catch(() => setIsPlaying(false));
    else element.pause();
  }

  function seekTo(ratioValue: number) {
    const element = videoRef.current;
    if (!element || durationMs === 0) return;

    element.currentTime = (ratioValue * durationMs) / 1000;
    setPositionMs(ratioValue * durationMs);
  }

  /** Состояние звука читаем из события volumechange — оно же приходит от горячей клавиши */
  function changeVolume(value: number) {
    const element = videoRef.current;
    if (!element) return;

    element.volume = value;
    element.muted = value === 0;
  }

  function toggleMute() {
    const element = videoRef.current;
    if (!element) return;

    // Звук выключили ползунком до нуля — включаем сразу на полную, иначе кнопка ничего не изменит
    if (element.volume === 0) element.volume = 1;
    element.muted = !isSilent;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current?.requestFullscreen().catch(() => {});
  }

  return (
    <div
      ref={containerRef}
      className={styles.player}
      style={{ "--media-ratio": ratio } as CSSProperties}
      data-idle={(isPlaying && isIdle) || undefined}
      data-fullscreen={isFullscreen || undefined}
      onPointerMove={wakeControls}
      onKeyDown={wakeControls}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={video.url}
        poster={video.previewUrl}
        autoPlay
        playsInline
        preload="auto"
        onClick={togglePlayback}
        onPlay={(event) => {
          setIsPlaying(true);
          pauseOtherPlayback(event.currentTarget);
          wakeControls();
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(event) => setPositionMs(event.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(event) => {
          const { duration } = event.currentTarget;
          if (Number.isFinite(duration)) setLoadedDurationMs(duration * 1000);
        }}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume);
          setIsMuted(event.currentTarget.muted);
        }}
        onError={() => setHasError(true)}
      />

      {hasError ? (
        <p className={styles.error}>Не удалось воспроизвести видео. Его можно сохранить и открыть на устройстве</p>
      ) : (
        !isPlaying && (
          <span className={styles.center} aria-hidden="true">
            <Icon icon={PlayIcon} size={30} />
          </span>
        )
      )}

      <div className={styles.controls}>
        <SeekBar
          className={styles.seek}
          value={progress}
          onChange={seekTo}
          disabled={hasError || durationMs === 0}
          label="Позиция воспроизведения"
          valueText={`${formatDuration(positionMs)} из ${formatDuration(durationMs)}`}
        />

        <div className={styles.row}>
          <button
            type="button"
            className={styles.button}
            onClick={togglePlayback}
            disabled={hasError}
            aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            title={isPlaying ? "Пауза (K)" : "Воспроизвести (K)"}
          >
            <Icon icon={isPlaying ? PauseIcon : PlayIcon} size={20} />
          </button>

          <span className={styles.time}>
            {formatDuration(positionMs)} / {formatDuration(durationMs)}
          </span>

          <span className={styles.volumeGroup}>
            <button
              type="button"
              className={styles.button}
              onClick={toggleMute}
              aria-label={isSilent ? "Включить звук" : "Выключить звук"}
              title={isSilent ? "Включить звук (M)" : "Выключить звук (M)"}
            >
              <Icon icon={isSilent ? VolumeOffIcon : VolumeHighIcon} size={20} />
            </button>
            <SeekBar
              className={styles.volume}
              value={isMuted ? 0 : volume}
              onChange={changeVolume}
              label="Громкость"
              valueText={`${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </span>

          {canFullscreen && (
            <button
              type="button"
              className={styles.button}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"}
              title={isFullscreen ? "Выйти из полноэкранного режима (F)" : "Во весь экран (F)"}
            >
              <Icon icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon} size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
