import { Skeleton } from "@/shared/ui";
import { SETTINGS_TABS } from "../config/tabs";
import styles from "./AccountPanel.module.css";

/** Группы строк как у AccountPanel: разделы настроек, приглашение и тема, выход */
const GROUPS = [SETTINGS_TABS.length, 2, 1];

/** Вкладка «Аккаунт» на время загрузки (loading.tsx): та же сетка, что у AccountPanel */
export function AccountPanelSkeleton() {
  return (
    <section className={styles.panel} aria-label="Загрузка аккаунта" aria-busy="true">
      <div className={styles.header}>
        <Skeleton width={72} height={72} radius="50%" />
        <Skeleton width={160} height={20} className={styles.skeletonName} />
        <Skeleton width={100} height={14} />
      </div>

      {GROUPS.map((rows, groupIndex) => (
        <ul key={groupIndex} role="list" className={styles.group}>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <li key={rowIndex} className={styles.row}>
              <Skeleton width={34} height={34} radius="var(--radius-sm)" />
              <Skeleton width="40%" height={15} />
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
