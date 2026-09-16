import { cn } from "@/shared/lib/cn";
import styles from "./ProgressRing.module.css";

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  className?: string;
}

/** Кольцо прогресса вокруг кружка: растёт по часовой стрелке от 12 часов. Цвет — currentColor */
export function ProgressRing({ progress, className }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <svg className={cn(styles.ring, className)} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle
        className={styles.track}
        cx="50"
        cy="50"
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
      />
    </svg>
  );
}
