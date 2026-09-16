import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon, IconLink } from "@/shared/ui";
import type { SettingsTab } from "../config/tabs";
import { SettingsSection } from "./SettingsSection";
import styles from "./SettingsScreen.module.css";

/** Раздел настроек как отдельная страница — так он открывается из вкладки «Аккаунт» */
export function SettingsScreen({ tab }: { tab: SettingsTab }) {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <IconLink href="/app/account" label="Назад к аккаунту" className={styles.back}>
          <Icon icon={ArrowLeft01Icon} size={22} />
        </IconLink>
        <div>
          <h1 className={styles.title}>{tab.label}</h1>
          <p className={styles.description}>{tab.description}</p>
        </div>
      </header>

      <div className={styles.body}>
        <SettingsSection tabId={tab.id} />
      </div>
    </div>
  );
}
