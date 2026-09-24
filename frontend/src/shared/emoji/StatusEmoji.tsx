import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import { getStatusName } from "./status";
import styles from "./StatusEmoji.module.css";

interface StatusEmojiProps {
  /** Эмодзи-статус из палитры */
  status: string;
  /** Размер в пикселях: статус подстраивается под текст, рядом с которым стоит */
  size?: number;
  className?: string;
}

/** Статус рядом с именем или названием чата. Читалкам называется словом, а не самим эмодзи */
export function StatusEmoji({ status, size = 15, className }: StatusEmojiProps) {
  const name = getStatusName(status);
  const style = { "--status-size": `${size}px` } as CSSProperties;

  return (
    <span role="img" aria-label={`Статус: ${name}`} title={name} style={style} className={cn(styles.status, className)}>
      {status}
    </span>
  );
}
