import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./ChatInfoSection.module.css";

interface ChatInfoSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

/** Блок правой панели: разделы отбиты друг от друга линией. Без заголовка — например, лента вкладок */
export function ChatInfoSection({ title, className, children }: ChatInfoSectionProps) {
  return (
    <section className={cn(styles.section, className)}>
      {title && <h4 className={styles.title}>{title}</h4>}
      {children}
    </section>
  );
}
