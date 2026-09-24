import type { SettingsTabId } from "../types";
import { AppearanceSettings } from "./AppearanceSettings";
import { ProfileSettings } from "./ProfileSettings";
import { SecuritySettings } from "./SecuritySettings";

/** Содержимое раздела настроек. Новые разделы добавляются сюда и в SETTINGS_TABS */
export function SettingsSection({ tabId }: { tabId: SettingsTabId }) {
  switch (tabId) {
    case "profile":
      return <ProfileSettings />;
    case "appearance":
      return <AppearanceSettings />;
    case "security":
      return <SecuritySettings />;
  }
}
