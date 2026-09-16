import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Avatar.module.css";

/** Градиенты строятся только из палитры бренда */
const GRADIENTS = [
  ["var(--malibu-400)", "var(--malibu-600)"],
  ["var(--malibu-500)", "var(--malibu-800)"],
  ["var(--malibu-300)", "var(--malibu-700)"],
  ["var(--malibu-600)", "var(--malibu-900)"],
  ["var(--malibu-700)", "var(--malibu-950)"],
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
  size?: number;
  isOnline?: boolean;
  className?: string;
}

/** Декоративный элемент: имя всегда выводится текстом рядом */
export function Avatar({ id, name, size = 48, isOnline = false, className }: AvatarProps) {
  const [from, to] = GRADIENTS[hashString(id) % GRADIENTS.length];
  const style = {
    "--avatar-size": `${size}px`,
    "--avatar-from": from,
    "--avatar-to": to,
  } as CSSProperties;

  return (
    <span className={cn(styles.avatar, className)} style={style} aria-hidden="true">
      {getInitials(name)}
      {isOnline && <span className={styles.online} />}
    </span>
  );
}
