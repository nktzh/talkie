"use client";

import { useEffect, useRef } from "react";
import { MAX_DURATION_MS } from "../hooks/useMessageRecorder";
import { ProgressRing } from "./ProgressRing";
import styles from "./VideoNoteRecorderPreview.module.css";

interface VideoNoteRecorderPreviewProps {
  stream: MediaStream;
  elapsedMs: number;
}

/** Живой кружок над полем ввода во время записи: кольцо показывает, сколько осталось до минуты */
export function VideoNoteRecorderPreview({ stream, elapsedMs }: VideoNoteRecorderPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <div className={styles.preview} aria-hidden="true">
      {/* Звук не выводим: иначе микрофон услышит сам себя */}
      <video ref={videoRef} className={styles.video} autoPlay muted playsInline />
      <ProgressRing className={styles.ring} progress={elapsedMs / MAX_DURATION_MS.video} />
    </div>
  );
}
