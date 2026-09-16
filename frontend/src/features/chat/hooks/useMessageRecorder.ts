import { useEffect, useRef, useState } from "react";
import { buildWaveform } from "../lib/waveform";
import type { OutgoingMessageContent } from "../model/types";

/** Что записываем: голосовое или видеосообщение-«кружок» */
export type RecordingKind = "voice" | "video";

export const MAX_DURATION_MS: Record<RecordingKind, number> = {
  voice: 10 * 60 * 1000,
  video: 60 * 1000,
};

const MIN_DURATION_MS = 700;
const LEVEL_SAMPLE_INTERVAL_MS = 100;

/** Сколько последних уровней громкости показывать во время записи */
export const LIVE_LEVELS_COUNT = 48;

/**
 * Первый поддерживаемый формат: webm/ogg — Chromium и Firefox, mp4 — Safari.
 * Для кружков vp9 заметно легче vp8 при том же качестве.
 */
const PREFERRED_MIME_TYPES: Record<RecordingKind, string[]> = {
  voice: ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"],
  video: ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"],
};

const MEDIA_CONSTRAINTS: Record<RecordingKind, MediaStreamConstraints> = {
  voice: { audio: true },
  // Кружок квадратный: просим квадратный кадр, а если камера не умеет — лишнее обрезается при показе
  video: {
    audio: true,
    video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 }, aspectRatio: { ideal: 1 } },
  },
};

/** Кружку хватает ~1 Мбит/с: минута видео весит около 7 МБ */
const VIDEO_BITS_PER_SECOND = 1_000_000;

export type MessageRecorderStatus = "idle" | "requesting" | "recording";

/** Записанное медиа — ровно одно из полей заполнено */
export type RecordedMedia = Pick<OutgoingMessageContent, "voice" | "videoNote">;

interface RecordingSession {
  kind: RecordingKind;
  recorder: MediaRecorder;
  stream: MediaStream;
  audioContext: AudioContext;
  chunks: Blob[];
  levels: number[];
  startedAt: number;
  frameId: number;
  shouldSend: boolean;
}

function isRecordingSupported(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";
}

function getDeviceErrorMessage(kind: RecordingKind, error: unknown): string {
  const isVideo = kind === "video";

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return isVideo
        ? "Нет доступа к камере — разрешите камеру и микрофон в настройках браузера"
        : "Нет доступа к микрофону — разрешите его в настройках браузера";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return isVideo ? "Камера не найдена" : "Микрофон не найден";
    }
    if (error.name === "NotReadableError") {
      return isVideo ? "Камера занята другим приложением" : "Микрофон занят другим приложением";
    }
  }
  return "Не удалось начать запись";
}

interface UseMessageRecorderOptions {
  onRecorded: (media: RecordedMedia) => void;
}

/**
 * Запись голосового или видеосообщения. MediaRecorder пишет поток, AnalyserNode снимает уровни
 * громкости — из них строится живая волна во время записи и итоговая волна голосового.
 */
export function useMessageRecorder({ onRecorded }: UseMessageRecorderOptions) {
  const [status, setStatus] = useState<MessageRecorderStatus>("idle");
  const [kind, setKind] = useState<RecordingKind>("voice");
  /** Живой поток для превью кружка во время записи */
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveLevels, setLiveLevels] = useState<number[]>([]);
  const sessionRef = useRef<RecordingSession | null>(null);
  const isRequestingRef = useRef(false);
  /** Кнопку отпустили, пока браузер спрашивал разрешение — запись начинать не нужно */
  const isStartCancelledRef = useRef(false);
  const isMountedRef = useRef(false);
  const onRecordedRef = useRef(onRecorded);

  useEffect(() => {
    onRecordedRef.current = onRecorded;
  }, [onRecorded]);

  // При уходе из чата прерываем запись и отпускаем камеру с микрофоном
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      const session = sessionRef.current;
      if (session && session.recorder.state !== "inactive") {
        session.shouldSend = false;
        session.recorder.stop();
      }
    };
  }, []);

  function releaseSession(session: RecordingSession) {
    cancelAnimationFrame(session.frameId);
    session.stream.getTracks().forEach((track) => track.stop());
    void session.audioContext.close();
    if (sessionRef.current === session) sessionRef.current = null;
  }

  function finish(shouldSend: boolean) {
    if (isRequestingRef.current) {
      isStartCancelledRef.current = true;
      return;
    }

    const session = sessionRef.current;
    if (!session || session.recorder.state === "inactive") return;

    session.shouldSend = shouldSend;
    session.recorder.stop();
  }

  async function start(recordingKind: RecordingKind) {
    if (sessionRef.current || isRequestingRef.current) return;

    setError(null);
    if (!isRecordingSupported()) {
      setError(
        recordingKind === "video"
          ? "Браузер не поддерживает запись видеосообщений"
          : "Браузер не поддерживает запись голосовых сообщений",
      );
      return;
    }

    isRequestingRef.current = true;
    isStartCancelledRef.current = false;
    setKind(recordingKind);
    setStatus("requesting");

    let mediaStream: MediaStream;
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS[recordingKind]);
    } catch (cause) {
      isRequestingRef.current = false;
      setStatus("idle");
      if (!isStartCancelledRef.current) setError(getDeviceErrorMessage(recordingKind, cause));
      return;
    }
    isRequestingRef.current = false;

    // Пока браузер спрашивал разрешение, пользователь мог уйти из чата или отпустить кнопку
    if (!isMountedRef.current || isStartCancelledRef.current) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setStatus("idle");
      return;
    }

    const mimeType = PREFERRED_MIME_TYPES[recordingKind].find((type) => MediaRecorder.isTypeSupported(type));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: recordingKind === "video" ? VIDEO_BITS_PER_SECOND : undefined,
      });
    } catch {
      mediaStream.getTracks().forEach((track) => track.stop());
      setStatus("idle");
      setError("Не удалось начать запись");
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    audioContext.createMediaStreamSource(mediaStream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);

    const session: RecordingSession = {
      kind: recordingKind,
      recorder,
      stream: mediaStream,
      audioContext,
      chunks: [],
      levels: [],
      startedAt: performance.now(),
      frameId: 0,
      shouldSend: false,
    };
    sessionRef.current = session;
    const maxDurationMs = MAX_DURATION_MS[recordingKind];

    let lastSampleAt = 0;
    const measure = (now: number) => {
      const elapsed = now - session.startedAt;

      if (now - lastSampleAt >= LEVEL_SAMPLE_INTERVAL_MS) {
        lastSampleAt = now;
        analyser.getByteTimeDomainData(samples);

        let sumOfSquares = 0;
        for (const sample of samples) {
          const amplitude = (sample - 128) / 128;
          sumOfSquares += amplitude * amplitude;
        }

        // RMS речи обычно невелик, поэтому усиливаем его, чтобы волна была наглядной
        session.levels.push(Math.min(1, Math.sqrt(sumOfSquares / samples.length) * 4));
        setElapsedMs(elapsed);
        setLiveLevels(session.levels.slice(-LIVE_LEVELS_COUNT));
      }

      // Лимит длительности — запись отправляется сама
      if (elapsed >= maxDurationMs) {
        finish(true);
        return;
      }

      session.frameId = requestAnimationFrame(measure);
    };

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) session.chunks.push(event.data);
    };

    recorder.onstop = () => {
      const durationMs = Math.min(maxDurationMs, Math.round(performance.now() - session.startedAt));

      releaseSession(session);
      setStatus("idle");
      setStream(null);
      setElapsedMs(0);
      setLiveLevels([]);

      if (!session.shouldSend) return;
      if (durationMs < MIN_DURATION_MS) {
        setError(session.kind === "video" ? "Слишком короткое видеосообщение" : "Слишком короткое голосовое сообщение");
        return;
      }

      const type = recorder.mimeType || mimeType || (session.kind === "video" ? "video/webm" : "audio/webm");
      const blob = new Blob(session.chunks, { type });
      const url = URL.createObjectURL(blob);

      onRecordedRef.current(
        session.kind === "video"
          ? { voice: null, videoNote: { blob, url, mimeType: type, durationMs } }
          : {
              voice: { blob, url, mimeType: type, durationMs, waveform: buildWaveform(session.levels) },
              videoNote: null,
            },
      );
    };

    recorder.start();
    session.frameId = requestAnimationFrame(measure);
    setStream(mediaStream);
    setStatus("recording");
  }

  return {
    status,
    /** Вид текущей (или последней) записи */
    kind,
    stream,
    error,
    elapsedMs,
    liveLevels,
    start,
    stop: () => finish(true),
    cancel: () => finish(false),
    dismissError: () => setError(null),
  };
}
