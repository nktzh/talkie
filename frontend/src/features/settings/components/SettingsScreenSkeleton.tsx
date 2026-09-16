import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon, IconLink, Skeleton } from "@/shared/ui";
import styles from "./SettingsScreen.module.css";

const FIELDS = 3;

/** Раздел настроек на время загрузки (loading.tsx): шапка с «назад» уже работает */
export function SettingsScreenSkeleton() {
  return (
    <section className={styles.screen} aria-label="Загрузка настроек" aria-busy="true">
      <header className={styles.header}>
        <IconLink href="/app/account" label="Назад к аккаунту" className={styles.back}>
          <Icon icon={ArrowLeft01Icon} size={22} />
        </IconLink>
        <div className={styles.skeletonTitle}>
          <Skeleton width={140} height={18} />
          <Skeleton width={220} height={13} />
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.skeletonFields}>
          {Array.from({ length: FIELDS }, (_, index) => (
            <div key={index} className={styles.skeletonField}>
              <Skeleton width={110} height={13} />
              <Skeleton width="100%" height={48} radius="var(--radius-md)" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
