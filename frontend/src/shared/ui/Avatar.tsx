import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Avatar.module.css";

/** Градиенты строятся только из акцентной палитры — аватары подхватывают выбранный цвет оформления */
const GRADIENTS = [
  ["var(--accent-400)", "var(--accent-600)"],
  ["var(--accent-500)", "var(--accent-800)"],
  ["var(--accent-300)", "var(--accent-700)"],
  ["var(--accent-600)", "var(--accent-900)"],
  ["var(--accent-700)", "var(--accent-950)"],
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash);
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  /** Стабильный идентификатор — от него зависит цвет */
  id: string;
  name: string;
  /** Загруженное фото; без него показываются инициалы */
  src?: string;
  size?: number;
  isOnline?: boolean;
  className?: string;
}

/** Декоративный элемент: имя всегда выводится текстом рядом */
export function Avatar({ id, name, src, size = 48, isOnline = false, className }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(id) % GRADIENTS.length];
  const style = {
    "--avatar-size": `${size}px`,
    "--avatar-from": from,
    "--avatar-to": to,
  } as CSSProperties;

  return (
    <span className={cn(styles.avatar, className)} style={style} aria-hidden="true">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- фото из data- или object URL, оптимизатору нечего делать
        <img src={src} alt="" draggable={false} className={styles.photo} />
      ) : (
        getInitials(name)
      )}
      {isOnline && <span className={styles.online} />}
    </span>
  );
}
