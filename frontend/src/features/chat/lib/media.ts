import type { Message, MessageAttachment, VideoNote, VoiceNote } from "../model/types";

/** Разделы панели «Информация»: медиа чата сгруппированы по типу вложения */
export type ChatMediaKind = "media" | "file" | "audio" | "voice";

interface ChatMediaItemBase {
  /** Уникален в пределах чата: у одного сообщения может быть несколько вложений */
  id: string;
  /** Сообщение, из которого пришло вложение */
  messageId: string;
  authorName: string;
  /** ISO 8601 */
  createdAt: string;
}

export interface ChatMediaAttachment extends ChatMediaItemBase {
  kind: MessageAttachment["kind"];
  attachment: MessageAttachment;
}

export interface ChatMediaVoice extends ChatMediaItemBase {
  kind: "voice";
  voice: VoiceNote;
}

export interface ChatMediaVideoNote extends ChatMediaItemBase {
  kind: "video-note";
  videoNote: VideoNote;
}

export type ChatMediaItem = ChatMediaAttachment | ChatMediaVoice | ChatMediaVideoNote;

export interface ChatMedia {
  /** Фото и видео — одной сеткой, как в галерее телефона */
  media: ChatMediaAttachment[];
  files: ChatMediaAttachment[];
  audio: ChatMediaAttachment[];
  /** Голосовые и кружки — в одном разделе, как в Telegram */
  voice: (ChatMediaVoice | ChatMediaVideoNote)[];
}

/** Метка на элементе медиа в пузыре: по ней контекстное меню понимает, по какому вложению кликнули */
export const MEDIA_ID_ATTRIBUTE = "data-media-id";
export const VOICE_MEDIA_ID = "voice";
export const VIDEO_NOTE_MEDIA_ID = "video-note";

/**
 * Адрес, по которому <video> без превью показывает первый кадр. Safari без фрагмента #t
 * оставляет вместо кадра пустоту; data-ссылки фрагменты не поддерживают
 */
export function getVideoFrameUrl(url: string): string {
  return url.startsWith("data:") || url.includes("#") ? url : `${url}#t=0.001`;
}

/** Медиа, которое можно сохранить на устройство */
export interface SavableMedia {
  url: string;
  fileName: string;
}

/** У голосовых и кружков нет имени файла — расширение берём из MIME-типа */
const EXTENSIONS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

function getExtension(mimeType: string): string {
  const baseType = mimeType.split(";")[0].trim().toLowerCase();
  return EXTENSIONS[baseType] ?? baseType.split("/")[1] ?? "bin";
}

/** Имя вида voice-2026-09-13-10-05 — по нему файлы из одного чата не перезаписывают друг друга */
function getRecordingFileName(prefix: string, message: Message, mimeType: string): string {
  // Время местное: createdAt хранится в UTC, и в имени файла было бы не то время, что в чате
  const date = new Date(message.createdAt);
  const stamp = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
  return `${prefix}-${stamp}.${getExtension(mimeType)}`;
}

/** Находит медиа сообщения по метке с элемента, на котором кликнули */
export function getSavableMedia(message: Message, mediaId: string): SavableMedia | null {
  if (mediaId === VOICE_MEDIA_ID && message.voice) {
    const { url, mimeType } = message.voice;
    return { url, fileName: getRecordingFileName("voice", message, mimeType) };
  }

  if (mediaId === VIDEO_NOTE_MEDIA_ID && message.videoNote) {
    const { url, mimeType } = message.videoNote;
    return { url, fileName: getRecordingFileName("video-note", message, mimeType) };
  }

  const attachment = message.attachments?.find((item) => item.id === mediaId);
  return attachment ? { url: attachment.url, fileName: attachment.name } : null;
}

/** Собирает вложения всей переписки, начиная с самых свежих */
export function collectChatMedia(messages: readonly Message[]): ChatMedia {
  const media: ChatMedia = { media: [], files: [], audio: [], voice: [] };

  for (const message of messages) {
    const base = {
      messageId: message.id,
      authorName: message.author.displayName,
      createdAt: message.createdAt,
    };

    for (const attachment of message.attachments ?? []) {
      const item: ChatMediaAttachment = { ...base, id: attachment.id, kind: attachment.kind, attachment };
      if (attachment.kind === "image" || attachment.kind === "video") media.media.push(item);
      else if (attachment.kind === "audio") media.audio.push(item);
      else media.files.push(item);
    }

    if (message.voice) {
      media.voice.push({ ...base, id: `${message.id}-voice`, kind: "voice", voice: message.voice });
    }

    if (message.videoNote) {
      media.voice.push({ ...base, id: `${message.id}-video`, kind: "video-note", videoNote: message.videoNote });
    }
  }

  for (const items of [media.media, media.files, media.audio, media.voice]) {
    items.reverse();
  }

  return media;
}
