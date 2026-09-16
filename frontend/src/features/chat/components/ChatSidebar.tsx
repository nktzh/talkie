"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useCurrentUser } from "@/entities/user";
import { Icon, Logo, useContextMenu } from "@/shared/ui";
import { getChatFolder } from "../config/folders";
import { useOverlayInset } from "../hooks/useOverlayInset";
import { useChatStore } from "../model/chat-store";
import { filterConversations } from "../model/selectors";
import type { Conversation } from "../model/types";
import { ChatFolderChips } from "./ChatFolderChips";
import { ChatListContextMenu } from "./ChatListContextMenu";
import { ChatListItem } from "./ChatListItem";
import { ChatSearch } from "./ChatSearch";
import { ConversationRemovalDialog, type ConversationRemovalRequest } from "./ConversationRemovalDialog";
import styles from "./ChatSidebar.module.css";

interface ChatSidebarProps {
  /** Кнопка у правого края заголовка — например, создание чата */
  action?: ReactNode;
}

export function ChatSidebar({ action }: ChatSidebarProps) {
  const { conversations, activeFolderId } = useChatStore();
  const { user: currentUser } = useCurrentUser();
  // Компонент рендерится из layout группы (chats), поэтому сегмент ниже — это [chatId]
  const activeConversationId = useSelectedLayoutSegment();
  const [query, setQuery] = useState("");
  const contextMenu = useContextMenu<Conversation>();
  const [removal, setRemoval] = useState<ConversationRemovalRequest | null>(null);
  // Шапка лежит поверх списка: чаты уходят под поиск и тонут в градиенте
  const { containerRef, overlayRef: headerRef } = useOverlayInset<HTMLElement, HTMLElement>(
    "--chat-list-header-height",
  );

  const folder = getChatFolder(activeFolderId);
  const visibleConversations = filterConversations(conversations, { folder, query });

  return (
    // data-chat-list — пользователь на экране списка (любая папка): на мобильных layout обязан
    // показать список и панель вкладок, даже если в DOM задержался маркер открытого чата
    <section
      ref={containerRef}
      className={styles.sidebar}
      aria-labelledby="chat-sidebar-title"
      data-chat-list={activeConversationId === null || undefined}
    >
      <header ref={headerRef} className={styles.header}>
        <div className={styles.titleRow}>
          <Logo size={28} className={styles.logo} />
          <h1 id="chat-sidebar-title" className={styles.title}>
            {folder.title}
          </h1>
          {action}
        </div>
        <ChatSearch value={query} onChange={setQuery} />
        <ChatFolderChips />
      </header>

      {folder.comingSoon ? (
        <div className={styles.comingSoon}>
          <span className={styles.comingSoonIcon}>
            <Icon icon={folder.icon} size={28} />
          </span>
          <h2 className={styles.comingSoonTitle}>{folder.comingSoon.title}</h2>
          <p className={styles.comingSoonDescription}>{folder.comingSoon.description}</p>
        </div>
      ) : visibleConversations.length > 0 ? (
        <ul role="list" className={styles.list}>
          {visibleConversations.map((conversation) => (
            <li key={conversation.id}>
              <ChatListItem
                conversation={conversation}
                currentUserId={currentUser.id}
                isActive={conversation.id === activeConversationId}
                onContextMenu={contextMenu.open}
                onLongPress={(press, target) =>
                  contextMenu.openByLongPress(target, press.element, press.x, press.y)
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{query.trim() ? "Ничего не найдено" : "В этой папке пока нет чатов"}</p>
      )}

      <ChatListContextMenu
        menu={contextMenu.menu}
        onClose={contextMenu.close}
        onRemove={(conversation, action) => setRemoval({ conversation, action })}
      />
      <ConversationRemovalDialog request={removal} onClose={() => setRemoval(null)} />
    </section>
  );
}
