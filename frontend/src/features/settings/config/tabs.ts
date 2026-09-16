import { SecurityLockIcon, UserIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@/shared/ui";
import type { SettingsTabId } from "../types";

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  description: string;
  icon: IconSvgElement;
}

/** Новые разделы настроек добавляются сюда и в SettingsSection */
export const SETTINGS_TABS: readonly SettingsTab[] = [
  {
    id: "profile",
    label: "Профиль",
    description: "Как вас видят другие пользователи",
    icon: UserIcon,
  },
  {
    id: "security",
    label: "Безопасность",
    description: "Пароль и защита аккаунта",
    icon: SecurityLockIcon,
  },
];

export function getSettingsTab(id: string): SettingsTab | undefined {
  return SETTINGS_TABS.find((tab) => tab.id === id);
}
