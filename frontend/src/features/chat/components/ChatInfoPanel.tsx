"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useCurrentUser } from "@/entities/user";
import { cn } from "@/shared/lib/cn";
import { PanelResizeHandle } from "@/shared/panel-sizes";
import { Avatar, Icon, IconButton } from "@/shared/ui";
import { getConversationSubtitle } from "../lib/preview";
import { getConversationUsername } from "../model/selectors";
import type { Conversation, Message, MessageId } from "../model/types";
import { ChatInfoActions } from "./ChatInfoActions";
import { ChatInfoSettings } from "./ChatInfoSettings";
import { ChatInfoTabs } from "./ChatInfoTabs";
import styles from "./ChatInfoPanel.module.css";

interface ChatInfoPanelProps {
  conversation: Conversation;
  messages: Message[];
  onClose: () => void;
  /** Клик по медиа: переход к сообщению, в котором оно пришло */
  onShowMessage: (messageId: MessageId) => void;
}

/**
 * Правая панель открытого чата: кто это, что с ним можно сделать и какие медиа в нём были.
 * Набор действий зависит от типа чата, поэтому разделы подключаются по kind.
 */
export function ChatInfoPanel({ conversation, messages, onClose, onShowMessage }: ChatInfoPanelProps) {
  const { user: currentUser } = useCurrentUser();
  const username = getConversationUsername(conversation);
  const isOnline = conversation.kind === "direct" && conversation.isOnline;

  return (
    <aside className={styles.panel} aria-label={`Информация о чате «${conversation.title}»`}>
      <PanelResizeHandle
        panel="infoPanel"
        edge="left"
        label="Ширина панели информации"
        className={styles.resizeHandle}
      />

      <header className={styles.header}>
        <h2 className={styles.headerTitle}>Информация</h2>
        <IconButton label="Закрыть панель" onClick={onClose}>
          <Icon icon={Cancel01Icon} size={20} />
        </IconButton>
      </header>

      <div className={styles.scroller}>
        <div className={styles.profile}>
          <Avatar
            id={conversation.id}
            name={conversation.title}
            size={112}
            isOnline={isOnline}
            className={styles.avatar}
          />
          <h3 className={styles.name}>{conversation.title}</h3>
          {username && <p className={styles.username}>@{username}</p>}
          <p className={cn(styles.status, isOnline && styles.online)} suppressHydrationWarning>
            {getConversationSubtitle(conversation)}
          </p>
          {conversation.kind === "channel" && conversation.description && (
            <p className={styles.description}>{conversation.description}</p>
          )}
        </div>

        <ChatInfoSettings conversation={conversation} />

        <ChatInfoActions conversation={conversation} />

        <ChatInfoTabs
          conversation={conversation}
          messages={messages}
          currentUserId={currentUser.id}
          onShowMessage={onShowMessage}
        />
      </div>
    </aside>
  );
}
