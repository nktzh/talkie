import { Pin02Icon, VolumeMute01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { useLongPress, type LongPress } from "@/shared/lib/useLongPress";
import { usePrefetchOnIntent } from "@/shared/lib/usePrefetchOnIntent";
import { Avatar, Icon } from "@/shared/ui";
import { CONVERSATION_KIND_ICONS } from "../config/conversation-kinds";
import { formatChatListDate } from "../lib/format";
import { getLastMessagePreview } from "../lib/preview";
import type { Conversation, UserId } from "../model/types";
import { MessageStatusIcon } from "./MessageStatusIcon";
import styles from "./ChatListItem.module.css";

const MAX_BADGE_COUNT = 999;

interface ChatListItemProps {
  conversation: Conversation;
  currentUserId: UserId;
  isActive: boolean;
  /** Строка, для которой открыто контекстное меню, подсвечивается как при наведении — атрибутом от ContextMenu */
  onContextMenu?: (event: MouseEvent<HTMLAnchorElement>, conversation: Conversation) => void;
  /** Долгое касание на телефоне или планшете: правого клика там нет, а действия с чатом нужны */
  onLongPress?: (press: LongPress<HTMLAnchorElement>, conversation: Conversation) => void;
}

export function ChatListItem({
  conversation,
  currentUserId,
  isActive,
  onContextMenu,
  onLongPress,
}: ChatListItemProps) {
  const { lastMessage, unreadCount } = conversation;
  const preview = getLastMessagePreview(conversation, currentUserId);
  const kindIcon = CONVERSATION_KIND_ICONS[conversation.kind];
  const isOwnLastMessage = conversation.kind !== "channel" && lastMessage?.author.id === currentUserId;
  // Клик после долгого касания гасится хуком — чат под пальцем не откроется вместе с меню
  const longPress = useLongPress<HTMLAnchorElement>((press) => onLongPress?.(press, conversation));
  // Переписка загружается, как только к ней потянулись, и по клику открывается без скелета
  const { prefetch, intentHandlers } = usePrefetchOnIntent();

  return (
    <Link
      href={`/app/${conversation.id}`}
      prefetch={prefetch}
      className={cn(styles.item, isActive && styles.active)}
      aria-current={isActive ? "page" : undefined}
      {...intentHandlers}
      {...(onLongPress && longPress.handlers)}
      onContextMenu={(event) => {
        // Долгое касание открывает меню само — системное и десктопное здесь не нужны
        if (onLongPress && longPress.handleContextMenu(event)) return;
        onContextMenu?.(event, conversation);
      }}
    >
      <Avatar
        id={conversation.id}
        name={conversation.title}
        size={50}
        isOnline={conversation.kind === "direct" && conversation.isOnline}
      />

      <div className={styles.body}>
        <div className={styles.row}>
          {kindIcon && <Icon icon={kindIcon} size={16} className={styles.kindIcon} />}
          <span className={styles.title}>{conversation.title}</span>
          {conversation.isMuted && <Icon icon={VolumeMute01Icon} size={14} className={styles.mutedIcon} />}

          {lastMessage && (
            <span className={styles.meta}>
              {isOwnLastMessage && (
                <MessageStatusIcon status={lastMessage.status} size={16} className={styles.status} />
              )}
              <time dateTime={lastMessage.createdAt} suppressHydrationWarning>
                {formatChatListDate(lastMessage.createdAt)}
              </time>
            </span>
          )}
        </div>

        <div className={styles.row}>
          <span className={styles.preview}>
            {preview ? (
              <>
                {preview.author && <span className={styles.previewAuthor}>{preview.author}: </span>}
                {preview.text}
              </>
            ) : (
              "Сообщений пока нет"
            )}
          </span>

          {unreadCount > 0 ? (
            <span className={cn(styles.badge, conversation.isMuted && styles.badgeMuted)}>
              {unreadCount > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unreadCount}
              <span className="sr-only"> непрочитанных</span>
            </span>
          ) : (
            conversation.isPinned && <Icon icon={Pin02Icon} size={16} className={styles.pinIcon} />
          )}
        </div>
      </div>
    </Link>
  );
}
