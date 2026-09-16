"use client";

import { PauseIcon, PlayIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui";
import { formatDuration } from "../lib/format";
import { pauseOtherPlayback } from "../lib/playback";
import type { VideoNote } from "../model/types";
import { ProgressRing } from "./ProgressRing";
import styles from "./VideoNotePlayer.module.css";

/**
 * Кружок в ленте, как в Telegram: без звука крутится по кругу, по нажатию играет
 * со звуком с начала — вокруг бежит кольцо прогресса. Повторное нажатие ставит на паузу.
 *
 * Беззвучный повтор идёт, только пока кружок на экране: в длинном чате десятки одновременно
 * декодируемых видео сажали бы батарею и трафик, а iOS ограничивает число одновременных воспроизведений.
 * Видео до первого показа не загружается (preload="none") — до тех пор виден постер.
 */
export function VideoNotePlayer({ videoNote }: { videoNote: VideoNote }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  /** Воспроизведение со звуком (в том числе на паузе); иначе — беззвучный повтор */
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  /** Кружок в видимой части ленты — только тогда крутится беззвучный повтор */
  const isVisibleRef = useRef(false);

  // Длительность берём из записи: у webm из MediaRecorder в метаданных её нет
  const progress = videoNote.durationMs > 0 ? positionMs / videoNote.durationMs : 0;

  function play(video: HTMLVideoElement) {
    video.play().catch(() => setIsPaused(true));
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
      // Со звуком кружок запустил сам пользователь — прокрутка ленты его не останавливает
      if (!video.muted) return;

      if (entry.isIntersecting) playPreview(video);
      else video.pause();
    });

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.loop = false;
      video.muted = false;
      video.currentTime = 0;
      setPositionMs(0);
      setIsActive(true);
      play(video);
    } else if (video.paused) {
      play(video);
    } else {
      video.pause();
    }
  }

  /** Досмотрели — снова беззвучный повтор */
  function handleEnded() {
    const video = videoRef.current;
    if (!video) return;

    setIsActive(false);
    setIsPaused(false);
    setPositionMs(0);
    video.muted = true;
    video.loop = true;
    video.currentTime = 0;
    if (isVisibleRef.current) playPreview(video);
  }

  const label = !isActive
    ? `Воспроизвести видеосообщение, ${formatDuration(videoNote.durationMs)}`
    : isPaused
      ? "Продолжить видеосообщение"
      : "Пауза";

  return (
    <button type="button" className={styles.player} onClick={toggle} aria-label={label} data-active={isActive || undefined}>
      <video
        ref={videoRef}
        className={styles.video}
        src={videoNote.url}
        poster={videoNote.posterUrl}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlay={(event) => {
          setIsPaused(false);
          if (!event.currentTarget.muted) pauseOtherPlayback(event.currentTarget);
        }}
        onPause={(event) => {
          if (!event.currentTarget.muted) setIsPaused(true);
        }}
        onEnded={handleEnded}
        onTimeUpdate={(event) => {
          if (!event.currentTarget.muted) setPositionMs(event.currentTarget.currentTime * 1000);
        }}
      />

      {isActive && <ProgressRing className={styles.ring} progress={progress} />}

      {isActive && isPaused && (
        <span className={styles.center} aria-hidden="true">
          <Icon icon={PlayIcon} size={28} />
        </span>
      )}

      <span className={styles.badge} aria-hidden="true">
        {isActive ? (
          <>
            {!isPaused && <Icon icon={PauseIcon} size={12} />}
            {formatDuration(positionMs)}
          </>
        ) : (
          <>
            {formatDuration(videoNote.durationMs)}
            <Icon icon={VolumeOffIcon} size={12} />
          </>
        )}
      </span>
    </button>
  );
}

/**
 * Беззвучный повтор. Браузер может его запретить (режим энергосбережения в iOS) —
 * тогда хотя бы подгружаем первый кадр, чтобы на месте кружка не было пустого круга
 */
function playPreview(video: HTMLVideoElement) {
  video.play().catch((error: unknown) => {
    // AbortError — кружок ушёл с экрана раньше, чем успел запуститься: это не запрет
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (video.preload === "none") video.preload = "metadata";
  });
}
