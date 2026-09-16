import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  /** По умолчанию — небольшое скругление; для аватаров — "50%" */
  radius?: CSSProperties["borderRadius"];
  className?: string;
}

/**
 * Заглушка на месте содержимого, пока страница грузится (loading.tsx).
 * Скрыта от скринридеров: о загрузке сообщает контейнер с aria-busy
 */
export function Skeleton({ width, height, radius, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
