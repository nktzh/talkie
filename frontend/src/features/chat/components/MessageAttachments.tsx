"use client";

import { File01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { formatDuration, formatFileSize } from "../lib/format";
import { MEDIA_ID_ATTRIBUTE, getVideoFrameUrl } from "../lib/media";
import type { MessageAttachment } from "../model/types";
import { AudioAttachmentPlayer } from "./AudioAttachmentPlayer";
import { MediaViewer } from "./MediaViewer";
import styles from "./MessageAttachments.module.css";

const DEFAULT_MEDIA_RATIO = 4 / 3;

function getMediaRatio(media: MessageAttachment): number {
  return media.width && media.height ? media.width / media.height : DEFAULT_MEDIA_RATIO;
}

/**
 * Фото и видео: одно — в своих пропорциях, несколько — сеткой в две колонки.
 * По клику открывается просмотрщик, в котором можно листать всё медиа сообщения.
 */
export function MessageMedia({ items }: { items: MessageAttachment[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const isSingle = items.length === 1;
  const hasOddCount = items.length % 2 === 1;

  return (
    <>
      <div
        className={cn(styles.gallery, isSingle ? styles.single : styles.grid)}
        style={isSingle ? ({ "--media-ratio": getMediaRatio(items[0]) } as CSSProperties) : undefined}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            title={item.name}
            aria-label={item.kind === "video" ? `Смотреть видео «${item.name}»` : `Открыть фото «${item.name}»`}
            {...{ [MEDIA_ID_ATTRIBUTE]: item.id }}
            className={cn(styles.cell, !isSingle && hasOddCount && index === items.length - 1 && styles.wide)}
            onClick={() => setViewerIndex(index)}
          >
            {item.kind === "video" ? (
              <VideoThumbnail video={item} />
            ) : (
              <Image
                src={item.url}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 767px) 80vw, (pointer: coarse) and (max-height: 500px) 80vw, 420px"
                className={styles.image}
              />
            )}
          </button>
        ))}
      </div>

      <MediaViewer
        items={items}
        index={viewerIndex}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}

function VideoThumbnail({ video }: { video: MessageAttachment }) {
  return (
    <>
      {video.previewUrl ? (
        <Image
          src={video.previewUrl}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 767px) 80vw, (pointer: coarse) and (max-height: 500px) 80vw, 420px"
          className={styles.image}
        />
      ) : (
        <video
          className={cn(styles.image, styles.videoFrame)}
          src={getVideoFrameUrl(video.url)}
          preload="metadata"
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      <span className={styles.play} aria-hidden="true">
        <Icon icon={PlayIcon} size={26} />
      </span>

      {video.durationMs !== undefined && (
        <span className={styles.duration} aria-hidden="true">
          {formatDuration(video.durationMs)}
        </span>
      )}
    </>
  );
}

export function MessageAudios({ items }: { items: MessageAttachment[] }) {
  return (
    <ul role="list" className={styles.files}>
      {items.map((audio) => (
        <li key={audio.id}>
          <AudioAttachmentPlayer audio={audio} />
        </li>
      ))}
    </ul>
  );
}

export function MessageFiles({ files }: { files: MessageAttachment[] }) {
  return (
    <ul role="list" className={styles.files}>
      {files.map((file) => (
        <li key={file.id}>
          <a href={file.url} download={file.name} className={styles.fileCard} {...{ [MEDIA_ID_ATTRIBUTE]: file.id }}>
            <span className={styles.fileIcon}>
              <Icon icon={File01Icon} size={22} />
            </span>
            <span className={styles.fileInfo}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
