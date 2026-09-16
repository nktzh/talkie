"use client";

import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Download04Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type SyntheticEvent } from "react";
import { downloadFile } from "@/shared/lib/download";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import type { MessageAttachment } from "../model/types";
import { VideoPlayer } from "./VideoPlayer";
import styles from "./MediaViewer.module.css";

const DEFAULT_IMAGE_RATIO = 4 / 3;

interface MediaViewerProps {
  /** Фото и видео одного сообщения — между ними можно листать */
  items: MessageAttachment[];
  /** Открытый элемент; null — просмотрщик закрыт */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Полноэкранный просмотр фото и видео на нативном <dialog>: Esc, ловушку фокуса и верхний слой даёт браузер */
export function MediaViewer({ items, index, onIndexChange, onClose }: MediaViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null;
  const item = index !== null ? items[index] : undefined;
  const hasPrevious = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      // Фокус — на само окно, а не на первую кнопку: иначе пробел нажал бы «Сохранить», а не поставил видео на паузу
      dialog.focus();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function show(nextIndex: number) {
    if (nextIndex >= 0 && nextIndex < items.length) onIndexChange(nextIndex);
  }

  // Нативное событие close не всплывает, а синтетическое в React — всплывает
  function handleClose(event: SyntheticEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    // Стрелки на ползунке перематывают видео — он сам отменяет событие
    if (event.defaultPrevented || index === null) return;

    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  }

  /** Клик мимо фото или видео закрывает просмотр */
  function handleBackdropClick(event: SyntheticEvent) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-label="Просмотр медиа"
      className={styles.viewer}
      onClose={handleClose}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      // Окно лежит внутри пузыря: без этого правый клик открыл бы ещё и меню сообщения
      onContextMenu={(event) => event.stopPropagation()}
    >
      {item && index !== null && (
        <>
          <header className={styles.toolbar}>
            <div className={styles.caption}>
              <span className={styles.title} title={item.name}>
                {item.name}
              </span>
              {items.length > 1 && (
                <span className={styles.counter}>
                  {index + 1} из {items.length}
                </span>
              )}
            </div>

            <button
              type="button"
              className={styles.toolbarButton}
              onClick={() => downloadFile(item.url, item.name)}
              aria-label="Сохранить"
              title="Сохранить"
            >
              <Icon icon={Download04Icon} size={22} />
            </button>
            <button
              type="button"
              className={styles.toolbarButton}
              onClick={onClose}
              aria-label="Закрыть"
              title="Закрыть"
            >
              <Icon icon={Cancel01Icon} size={22} />
            </button>
          </header>

          <div className={styles.stage} onClick={handleBackdropClick}>
            {item.kind === "video" ? (
              <VideoPlayer key={item.id} video={item} />
            ) : (
              <div
                key={item.id}
                className={styles.imageFrame}
                style={
                  {
                    "--media-ratio": item.width && item.height ? item.width / item.height : DEFAULT_IMAGE_RATIO,
                    "--natural-width": item.width ? `${item.width}px` : "100cqw",
                  } as CSSProperties
                }
              >
                <Image src={item.url} alt={item.name} fill unoptimized sizes="100vw" className={styles.image} />
              </div>
            )}
          </div>

          {hasPrevious && (
            <button
              type="button"
              className={cn(styles.nav, styles.previous)}
              onClick={() => show(index - 1)}
              aria-label="Предыдущее"
            >
              <Icon icon={ArrowLeft01Icon} size={26} />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              className={cn(styles.nav, styles.next)}
              onClick={() => show(index + 1)}
              aria-label="Следующее"
            >
              <Icon icon={ArrowRight01Icon} size={26} />
            </button>
          )}
        </>
      )}
    </dialog>
  );
}
