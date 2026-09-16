import { createLocalId } from "@/shared/lib/id";
import type { OutgoingAttachment } from "../model/types";
import { formatFileSize } from "./format";

export const MAX_ATTACHMENTS = 10;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Форматы, которые браузеры надёжно показывают в <img> */
const PREVIEWABLE_IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|avif|bmp)$/;

/** «Отчёт.pdf» → «PDF»; длинные и отсутствующие расширения не показываем */
export function getFileExtension(fileName: string): string | null {
  const match = /\.([a-z0-9]{1,4})$/i.exec(fileName);
  return match ? match[1].toUpperCase() : null;
}

function readImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    image.src = url;
  });
}

/** Если метаданные так и не пришли (например, файл повреждён), не держим добавление вложений */
const MEDIA_METADATA_TIMEOUT_MS = 5000;

interface MediaMetadata {
  /** 0 — в файле нет видеодорожки */
  width: number;
  height: number;
  durationMs: number | undefined;
}

/** Читает метаданные через <video>: он открывает и аудиофайлы, а по размеру кадра видно, есть ли картинка */
function readMediaMetadata(url: string): Promise<MediaMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    function finish(result: MediaMetadata | null) {
      clearTimeout(timeout);
      video.onloadedmetadata = null;
      video.onerror = null;
      // Отпускаем файл: иначе браузер продолжит его буферизовать
      video.removeAttribute("src");
      video.load();

      if (result) resolve(result);
      else reject(new Error("Не удалось прочитать медиафайл"));
    }

    const timeout = setTimeout(() => finish(null), MEDIA_METADATA_TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () =>
      finish({
        width: video.videoWidth,
        height: video.videoHeight,
        // У webm из MediaRecorder длительность в метаданных бывает Infinity
        durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : undefined,
      });
    video.onerror = () => finish(null);
    video.src = url;
  });
}

type DetectedMedia = Pick<OutgoingAttachment, "kind" | "width" | "height" | "durationMs">;

async function detectMedia(file: File, url: string): Promise<DetectedMedia> {
  if (PREVIEWABLE_IMAGE_TYPES.test(file.type)) {
    const dimensions = await readImageDimensions(url).catch(() => null);
    return dimensions ? { kind: "image", ...dimensions } : { kind: "file" };
  }

  const isVideo = file.type.startsWith("video/");
  if (!isVideo && !file.type.startsWith("audio/")) return { kind: "file" };

  const metadata = await readMediaMetadata(url).catch(() => null);
  if (!metadata) return { kind: "file" };

  // Видеоконтейнер без картинки (например, звук в .mp4) показываем как аудио
  if (isVideo && metadata.width > 0) {
    return { kind: "video", width: metadata.width, height: metadata.height, durationMs: metadata.durationMs };
  }
  return { kind: "audio", durationMs: metadata.durationMs };
}

/** Готовит файл к показу в превью. Медиа, которое браузер не смог открыть, прикладывается как файл */
export async function createOutgoingAttachment(file: File): Promise<OutgoingAttachment> {
  const url = URL.createObjectURL(file);
  const media = await detectMedia(file, url);

  return {
    id: createLocalId("attachment"),
    name: file.name || "Без названия",
    size: file.size,
    mimeType: file.type,
    url,
    ...media,
    file,
  };
}

/** Отсеивает файлы сверх лимитов и формулирует для пользователя, что не так */
export function selectAcceptableFiles(
  files: readonly File[],
  alreadyAttachedCount: number,
): { accepted: File[]; error: string | null } {
  const sizeLimit = formatFileSize(MAX_FILE_SIZE_BYTES);
  const tooLarge = files.filter((file) => file.size > MAX_FILE_SIZE_BYTES);
  const fitting = files.filter((file) => file.size <= MAX_FILE_SIZE_BYTES);
  const accepted = fitting.slice(0, Math.max(0, MAX_ATTACHMENTS - alreadyAttachedCount));

  let error: string | null = null;
  if (tooLarge.length === 1) {
    error = `Файл «${tooLarge[0].name}» больше ${sizeLimit} и не прикреплён`;
  } else if (tooLarge.length > 1) {
    error = `Некоторые файлы больше ${sizeLimit} и не прикреплены`;
  } else if (accepted.length < fitting.length) {
    error = `К сообщению можно прикрепить не больше ${MAX_ATTACHMENTS} файлов`;
  }

  return { accepted, error };
}
