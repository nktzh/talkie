import { AudioWave01Icon, File01Icon, MusicNote01Icon, PlayIcon, Video01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { getFileExtension } from "../lib/attachments";
import { formatChatListDate, formatDuration, formatFileSize } from "../lib/format";
import { getVideoFrameUrl, type ChatMediaAttachment, type ChatMediaVideoNote, type ChatMediaVoice } from "../lib/media";
import type { MessageId } from "../model/types";
import styles from "./ChatMediaList.module.css";

/**
 * Клик по медиа ведёт к сообщению, в котором оно пришло. Открыть картинку или скачать файл
 * можно уже из самого сообщения — там видны подпись и контекст переписки.
 */
interface ChatMediaListProps<T> {
  items: T[];
  onSelect: (messageId: MessageId) => void;
}

/** Фото и видео чата — квадратной сеткой, как в галерее; на видео — длительность */
export function ChatMediaGrid({ items, onSelect }: ChatMediaListProps<ChatMediaAttachment>) {
  return (
    <ul role="list" className={styles.grid}>
      {items.map(({ id, messageId, attachment, authorName }) => {
        const isVideo = attachment.kind === "video";
        const imageUrl = isVideo ? attachment.previewUrl : attachment.url;

        return (
          <li key={id}>
            <button
              type="button"
              title={`${attachment.name} · ${authorName}`}
              aria-label={`Показать в чате: ${attachment.name}`}
              className={styles.thumb}
              onClick={() => onSelect(messageId)}
            >
              {imageUrl ? (
                <Image src={imageUrl} alt="" fill unoptimized sizes="120px" className={styles.thumbImage} />
              ) : (
                <video
                  className={cn(styles.thumbImage, styles.thumbVideo)}
                  src={getVideoFrameUrl(attachment.url)}
                  preload="metadata"
                  muted
                  playsInline
                  aria-hidden="true"
                  tabIndex={-1}
                />
              )}

              {isVideo && (
                <span className={styles.thumbDuration} aria-hidden="true">
                  {attachment.durationMs !== undefined ? (
                    formatDuration(attachment.durationMs)
                  ) : (
                    <Icon icon={PlayIcon} size={12} />
                  )}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ChatFileList({ items, onSelect }: ChatMediaListProps<ChatMediaAttachment>) {
  return (
    <ul role="list" className={styles.list}>
      {items.map(({ id, messageId, attachment, authorName, createdAt }) => (
        <li key={id}>
          <button type="button" className={styles.row} title={attachment.name} onClick={() => onSelect(messageId)}>
            <span className={styles.rowIcon}>
              {getFileExtension(attachment.name) ?? <Icon icon={File01Icon} size={18} />}
            </span>
            <span className={styles.rowBody}>
              <span className={styles.rowTitle}>{attachment.name}</span>
              <span className={styles.rowMeta} suppressHydrationWarning>
                {formatFileSize(attachment.size)} · {authorName} · {formatChatListDate(createdAt)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ChatAudioList({ items, onSelect }: ChatMediaListProps<ChatMediaAttachment>) {
  return (
    <ul role="list" className={styles.list}>
      {items.map(({ id, messageId, attachment, authorName, createdAt }) => (
        <li key={id}>
          <button type="button" className={styles.row} title={attachment.name} onClick={() => onSelect(messageId)}>
            <span className={cn(styles.rowIcon, styles.voiceIcon)}>
              <Icon icon={MusicNote01Icon} size={18} />
            </span>
            <span className={styles.rowBody}>
              <span className={styles.rowTitle}>{attachment.name}</span>
              <span className={styles.rowMeta} suppressHydrationWarning>
                {attachment.durationMs !== undefined
                  ? formatDuration(attachment.durationMs)
                  : formatFileSize(attachment.size)}{" "}
                · {authorName} · {formatChatListDate(createdAt)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ChatVoiceList({ items, onSelect }: ChatMediaListProps<ChatMediaVoice | ChatMediaVideoNote>) {
  return (
    <ul role="list" className={styles.list}>
      {items.map((item) => {
        const isVideo = item.kind === "video-note";
        const durationMs = isVideo ? item.videoNote.durationMs : item.voice.durationMs;

        return (
          <li key={item.id}>
            <button type="button" className={styles.row} onClick={() => onSelect(item.messageId)}>
              <span className={cn(styles.rowIcon, styles.voiceIcon)}>
                <Icon icon={isVideo ? Video01Icon : AudioWave01Icon} size={18} />
              </span>
              <span className={styles.rowBody}>
                <span className={styles.rowTitle}>
                  {isVideo ? "Видеосообщение" : "Голосовое сообщение"} · {formatDuration(durationMs)}
                </span>
                <span className={styles.rowMeta} suppressHydrationWarning>
                  {item.authorName} · {formatChatListDate(item.createdAt)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
