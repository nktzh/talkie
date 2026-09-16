import { Cancel01Icon, File01Icon, MusicNote01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { getFileExtension } from "../lib/attachments";
import { formatDuration, formatFileSize, pluralize } from "../lib/format";
import { getVideoFrameUrl } from "../lib/media";
import type { OutgoingAttachment } from "../model/types";
import styles from "./ComposerAttachments.module.css";

interface ComposerAttachmentsProps {
  items: OutgoingAttachment[];
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
}

/** Секция вложений в верхней части панели ввода */
export function ComposerAttachments({ items, onRemove, onRemoveAll }: ComposerAttachmentsProps) {
  const totalSize = items.reduce((total, item) => total + item.size, 0);
  const countLabel = pluralize(items.length, { one: "вложение", few: "вложения", many: "вложений" });

  return (
    <section className={styles.section} aria-label="Вложения">
      <header className={styles.header}>
        <span className={styles.summary}>
          {items.length} {countLabel} · {formatFileSize(totalSize)}
        </span>
        <button type="button" className={styles.removeAll} onClick={onRemoveAll}>
          Убрать все
        </button>
      </header>

      <ul role="list" className={styles.list}>
        {items.map((item) => {
          const isVisual = item.kind === "image" || item.kind === "video";

          return (
            <li key={item.id} className={cn(styles.tile, isVisual ? styles.imageTile : styles.fileTile)}>
              {isVisual ? <VisualPreview item={item} /> : <FilePreview item={item} />}

              <button
                type="button"
                className={styles.remove}
                onClick={() => onRemove(item.id)}
                aria-label={`Убрать «${item.name}»`}
              >
                <Icon icon={Cancel01Icon} size={12} strokeWidth={2.4} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Фото — миниатюрой, видео — первым кадром с длительностью */
function VisualPreview({ item }: { item: OutgoingAttachment }) {
  if (item.kind === "image") {
    return <Image src={item.url} alt={item.name} fill unoptimized sizes="64px" className={styles.thumbnail} />;
  }

  return (
    <>
      <video
        className={cn(styles.thumbnail, styles.videoThumbnail)}
        src={getVideoFrameUrl(item.url)}
        preload="metadata"
        muted
        playsInline
        aria-label={item.name}
      />
      {item.durationMs !== undefined && (
        <span className={styles.duration} aria-hidden="true">
          {formatDuration(item.durationMs)}
        </span>
      )}
    </>
  );
}

/** Аудио — с нотой и длительностью, остальные файлы — с расширением */
function FilePreview({ item }: { item: OutgoingAttachment }) {
  const isAudio = item.kind === "audio";
  const extension = getFileExtension(item.name);

  return (
    <>
      <span className={styles.badge} aria-hidden="true">
        {isAudio ? <Icon icon={MusicNote01Icon} size={20} /> : (extension ?? <Icon icon={File01Icon} size={18} />)}
      </span>
      <span className={styles.fileInfo}>
        <span className={styles.fileName} title={item.name}>
          {item.name}
        </span>
        <span className={styles.fileSize}>
          {isAudio && item.durationMs !== undefined && `${formatDuration(item.durationMs)} · `}
          {formatFileSize(item.size)}
        </span>
      </span>
    </>
  );
}
