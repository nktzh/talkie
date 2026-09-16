import type {
  Message,
  MessageAttachment,
  OutgoingAttachment,
  OutgoingMessageContent,
  RecordedVideoNote,
  RecordedVoice,
  VideoNote,
  VoiceNote,
} from "../model/types";

function toMessageAttachment(attachment: OutgoingAttachment): MessageAttachment {
  return {
    id: attachment.id,
    kind: attachment.kind,
    name: attachment.name,
    size: attachment.size,
    mimeType: attachment.mimeType,
    url: attachment.url,
    width: attachment.width,
    height: attachment.height,
    durationMs: attachment.durationMs,
  };
}

function toVoiceNote(voice: RecordedVoice): VoiceNote {
  return {
    url: voice.url,
    mimeType: voice.mimeType,
    durationMs: voice.durationMs,
    waveform: voice.waveform,
  };
}

function toVideoNote(videoNote: RecordedVideoNote): VideoNote {
  return {
    url: videoNote.url,
    mimeType: videoNote.mimeType,
    durationMs: videoNote.durationMs,
  };
}

/**
 * Содержимое сообщения без исходных File/Blob.
 * Пока бэкенда нет, в сообщении остаются локальные object URL — они живут до перезагрузки вкладки.
 */
export function toMessageContent(
  content: OutgoingMessageContent,
): Pick<Message, "text" | "format" | "attachments" | "voice" | "videoNote"> {
  return {
    text: content.text,
    // Пустое поле экономит место: отсутствие значения и так означает plain
    format: content.format === "markdown" ? "markdown" : undefined,
    attachments: content.attachments.length > 0 ? content.attachments.map(toMessageAttachment) : undefined,
    voice: content.voice ? toVoiceNote(content.voice) : undefined,
    videoNote: content.videoNote ? toVideoNote(content.videoNote) : undefined,
  };
}

/** Суммарный объём отправляемых данных в байтах */
export function getUploadSize(content: OutgoingMessageContent): number {
  const attachmentsSize = content.attachments.reduce((total, attachment) => total + attachment.size, 0);
  return attachmentsSize + (content.voice?.blob.size ?? 0) + (content.videoNote?.blob.size ?? 0);
}
