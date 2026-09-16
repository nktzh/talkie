"use client";

import { cn } from "@/shared/lib/cn";
import { CHAT_FOLDERS } from "../config/folders";
import { useChatStore } from "../model/chat-store";
import { countUnreadChats } from "../model/selectors";
import styles from "./ChatFolderChips.module.css";

/**
 * Разделение на личные, группы и остальное внутри вкладки «Чаты».
 * Нужно только на мобильных: на десктопе папки живут в навигационной панели.
 */
export function ChatFolderChips() {
  const { conversations, activeFolderId, selectFolder } = useChatStore();

  return (
    <div role="tablist" aria-label="Папки чатов" className={styles.chips}>
      {CHAT_FOLDERS.map((folder) => {
        const isActive = folder.id === activeFolderId;
        const unreadChats = countUnreadChats(conversations, folder);

        return (
          <button
            key={folder.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(styles.chip, isActive && styles.active)}
            onClick={() => selectFolder(folder.id)}
          >
            {folder.label}
            {unreadChats > 0 && <span className={styles.count}>{unreadChats}</span>}
          </button>
        );
      })}
    </div>
  );
}
