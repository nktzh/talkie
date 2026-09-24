"use client";

import { useState } from "react";
import { useCurrentUser } from "@/entities/user";
import { Avatar } from "@/shared/ui";
import { SettingsModal } from "./SettingsModal";
import styles from "./AccountButton.module.css";

/** Аватар текущего пользователя в навигации — открывает настройки */
export function AccountButton() {
  const { user } = useCurrentUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsSettingsOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Настройки аккаунта ${user.displayName}`}
        title="Настройки"
      >
        <Avatar id={user.id} name={user.displayName} src={user.avatarUrl} size={36} />
      </button>

      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
