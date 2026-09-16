import { Logo, Skeleton } from "@/shared/ui";
import styles from "./ContactsPanel.module.css";

const ROWS = 8;

/** Вкладка «Контакты» на время загрузки (loading.tsx): та же сетка, что у ContactsPanel */
export function ContactsPanelSkeleton() {
  return (
    <section className={styles.panel} aria-label="Загрузка контактов" aria-busy="true">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Logo size={28} className={styles.logo} />
          <h2 className={styles.title}>Контакты</h2>
        </div>
      </header>

      <Skeleton height={48} radius="var(--radius-md)" className={styles.add} />

      <ul role="list" className={styles.list}>
        {Array.from({ length: ROWS }, (_, index) => (
          <li key={index} className={styles.item}>
            <Skeleton width={44} height={44} radius="50%" />
            <div className={styles.info}>
              <Skeleton width="45%" height={15} />
              <Skeleton width="28%" height={12} className={styles.skeletonMeta} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
