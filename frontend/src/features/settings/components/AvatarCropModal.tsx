"use client";

import { ZoomInAreaIcon } from "@hugeicons/core-free-icons";
import { useId, useRef, useState, type ChangeEvent, type PointerEvent, type WheelEvent } from "react";
import { Button, FormAlert, Icon, Modal } from "@/shared/ui";
import {
  clampAvatarOffset,
  cropToAvatar,
  getAvatarScale,
  type AvatarOffset,
  type AvatarView,
  type PickedImage,
} from "../lib/avatar";
import styles from "./AvatarCropModal.module.css";

/** Сторона окна кадрирования; та же величина задана в CSS */
const VIEWPORT_SIZE = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.01;
/** Колесо мыши отдаёт десятки пикселей за щелчок — переводим их в доли увеличения */
const WHEEL_ZOOM_RATIO = 0.0015;

interface AvatarCropModalProps {
  /** Выбранный файл; null — окно закрыто */
  image: PickedImage | null;
  isPending: boolean;
  onCancel: () => void;
  onSave: (avatar: Blob) => void;
}

/** Кадрирование фото профиля: картинку двигают мышью или пальцем, масштаб — колесом или ползунком */
export function AvatarCropModal({ image, isPending, onCancel, onSave }: AvatarCropModalProps) {
  const titleId = useId();

  return (
    <Modal open={image !== null} onClose={() => !isPending && onCancel()} labelledBy={titleId}>
      {image && (
        <CropEditor image={image} titleId={titleId} isPending={isPending} onCancel={onCancel} onSave={onSave} />
      )}
    </Modal>
  );
}

interface CropEditorProps extends Omit<AvatarCropModalProps, "image"> {
  image: PickedImage;
  titleId: string;
}

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  /** Сдвиг на момент нажатия: к нему прибавляется пройденное указателем расстояние */
  origin: AvatarOffset;
}

function CropEditor({ image, titleId, isPending, onCancel, onSave }: CropEditorProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<AvatarOffset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  const view: AvatarView = { viewportSize: VIEWPORT_SIZE, zoom, offset };
  const scale = getAvatarScale(image, view);

  function changeZoom(next: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(clamped);
    // После уменьшения картинка может не доставать до края — подтягиваем её обратно
    setOffset((current) => clampAvatarOffset(current, image, { ...view, zoom: clamped }));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: offset };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;

    const moved = { x: drag.origin.x + event.clientX - drag.startX, y: drag.origin.y + event.clientY - drag.startY };
    setOffset(clampAvatarOffset(moved, image, view));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    changeZoom(zoom - event.deltaY * WHEEL_ZOOM_RATIO);
  }

  function handleZoomChange(event: ChangeEvent<HTMLInputElement>) {
    changeZoom(Number(event.target.value));
  }

  async function handleSave() {
    const element = imageRef.current;
    if (!element) return;

    setError(null);
    try {
      onSave(await cropToAvatar(element, view));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось обработать изображение");
    }
  }

  return (
    <div className={styles.body}>
      <h2 id={titleId} className={styles.title}>
        Фото профиля
      </h2>

      <div
        className={styles.viewport}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- картинка из object URL, оптимизатору нечего делать */}
        <img
          ref={imageRef}
          src={image.url}
          alt=""
          draggable={false}
          className={styles.image}
          style={{
            width: image.width * scale,
            height: image.height * scale,
            transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          }}
        />
        <span className={styles.mask} aria-hidden="true" />
      </div>

      <p className={styles.hint}>Перетащите фото, чтобы выбрать видимую часть</p>

      <label className={styles.zoom}>
        <Icon icon={ZoomInAreaIcon} size={18} className={styles.zoomIcon} />
        <span className={styles.zoomLabel}>Масштаб</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          value={zoom}
          disabled={isPending}
          onChange={handleZoomChange}
          className={styles.slider}
        />
      </label>

      {error && <FormAlert variant="error">{error}</FormAlert>}

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.action} disabled={isPending} onClick={onCancel}>
          Отмена
        </Button>
        <Button className={styles.action} isLoading={isPending} onClick={handleSave}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}
