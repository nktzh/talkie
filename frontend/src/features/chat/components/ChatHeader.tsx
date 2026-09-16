import { ArrowLeft01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/lib/cn";
import { Avatar, Icon, IconButton, IconLink } from "@/shared/ui";
import { CONVERSATION_KIND_ICONS } from "../config/conversation-kinds";
import { getConversationSubtitle } from "../lib/preview";
import type { Conversation } from "../model/types";
import styles from "./ChatHeader.module.css";

interface ChatHeaderProps {
  conversation: Conversation;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
}

/** Панель с информацией открывается только кнопкой «ещё»: название чата ничего не открывает */
export function ChatHeader({ conversation, isInfoOpen, onToggleInfo }: ChatHeaderProps) {
  const kindIcon = CONVERSATION_KIND_ICONS[conversation.kind];
  const isOnline = conversation.kind === "direct" && conversation.isOnline;

  return (
    <header className={styles.header}>
      {/* Список чатов — лёгкая страница: загружаем её целиком заранее, и «назад» срабатывает мгновенно */}
      <IconLink href="/app" prefetch label="Назад к списку чатов" className={styles.back}>
        <Icon icon={ArrowLeft01Icon} size={22} />
      </IconLink>

      <Avatar id={conversation.id} name={conversation.title} size={42} isOnline={isOnline} />

      <div className={styles.info}>
        <h2 className={styles.title}>
          {kindIcon && <Icon icon={kindIcon} size={16} className={styles.kindIcon} />}
          <span className={styles.titleText}>{conversation.title}</span>
        </h2>
        <p className={cn(styles.subtitle, isOnline && styles.online)} suppressHydrationWarning>
          {getConversationSubtitle(conversation)}
        </p>
      </div>

      <IconButton
        label="Информация о чате"
        aria-expanded={isInfoOpen}
        className={cn(isInfoOpen && styles.infoButtonActive)}
        onClick={onToggleInfo}
      >
        <Icon icon={MoreVerticalIcon} size={22} />
      </IconButton>
    </header>
  );
}
