"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import type { LongPress } from "@/shared/lib/useLongPress";
import { ConfirmDialog, useContextMenu } from "@/shared/ui";
import { useDeleteMessage, type MessageDeletion } from "../hooks/useDeleteMessage";
import { useJumpToMessage } from "../hooks/useJumpToMessage";
import { useMessageReactions } from "../hooks/useMessageReactions";
import { formatDaySeparator } from "../lib/format";
import { buildMessageListDays, type MessageListDay } from "../lib/message-list";
import { createMessageReply, getForwardSourceHref, resolveReplyQuote } from "../lib/reply";
import { warmEmojiFont } from "../lib/warm-emoji";
import { useChatStore } from "../model/chat-store";
import { areReactionsEnabled } from "../model/selectors";
import type { Conversation, ConversationId, Message, MessageId, MessageReaction, UserId } from "../model/types";
import { MessageBubble } from "./MessageBubble";
import { MessageContextMenu, hasMessageActions, type MessageMenuTarget } from "./MessageContextMenu";
import styles from "./MessageList.module.css";

interface MessageListProps {
  messages: Message[];
  conversation: Conversation;
  currentUserId: UserId;
  /** Выбор чатов для пересылки и ответа в другом чате — диалогами управляет окно чата */
  onForward: (message: Message) => void;
  onReplyElsewhere: (message: Message) => void;
}

export function MessageList({ messages, conversation, currentUserId, onForward, onReplyElsewhere }: MessageListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { conversations, setReplyDraft } = useChatStore();
  const jumpToMessage = useJumpToMessage();
  const days = buildMessageListDays(messages, { conversationKind: conversation.kind, currentUserId });
  // Функции открытия берутся по отдельности: они не меняются, когда меню открывается и закрывается
  const { menu, open, openByLongPress, close } = useContextMenu<MessageMenuTarget>();
  const deletion = useDeleteMessage(messages);
  const reactions = useMessageReactions(conversation);
  const showReactions = areReactionsEnabled(conversation);

  const lastMessage = messages.at(-1);
  const lastOwnMessageId = lastMessage?.author.id === currentUserId ? lastMessage.id : null;

  // Палитру реакций открывают из меню сообщения — к этому времени шрифт эмодзи уже должен быть разложен,
  // иначе первое открытие ждёт его на месте (см. warm-emoji)
  useEffect(() => {
    if (showReactions) return warmEmojiFont();
  }, [showReactions]);

  // Лента развёрнута через column-reverse: scrollTop = 0 — это самый низ,
  // поэтому чат открывается на последних сообщениях без JS.
  // После отправки своего сообщения возвращаем пользователя вниз.
  useEffect(() => {
    if (lastOwnMessageId) {
      scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lastOwnMessageId]);

  if (messages.length === 0) {
    return <div className={styles.empty}>Сообщений пока нет</div>;
  }

  function handleContextMenu(event: MouseEvent<HTMLDivElement>, target: MessageMenuTarget) {
    // Действий нет — оставляем браузерное меню вместо пустого своего
    if (hasMessageActions(target, conversation, currentUserId)) open(event, target);
  }

  function handleLongPress(press: LongPress<HTMLDivElement>, target: MessageMenuTarget) {
    if (hasMessageActions(target, conversation, currentUserId)) {
      openByLongPress(target, press.element, press.x, press.y);
    }
  }

  return (
    <>
      <div ref={scrollerRef} className={styles.scroller} role="log" aria-label="Сообщения" tabIndex={0}>
        <MessageDays
          days={days}
          onContextMenu={handleContextMenu}
          onLongPress={handleLongPress}
          showReactions={showReactions}
          canToggleReaction={reactions.canToggle}
          onToggleReaction={reactions.toggle}
          conversationId={conversation.id}
          conversations={conversations}
          onJumpToMessage={jumpToMessage}
        />
      </div>

      <MessageContextMenu
        menu={menu}
        onClose={close}
        conversation={conversation}
        currentUserId={currentUserId}
        onDelete={deletion.request}
        onReact={reactions.toggle}
        onReply={(message) => setReplyDraft(conversation.id, createMessageReply(message))}
        onReplyElsewhere={onReplyElsewhere}
        onForward={onForward}
      />

      <ConfirmDialog
        open={deletion.pending !== null}
        onClose={deletion.cancel}
        title={conversation.kind === "channel" ? "Удалить пост?" : "Удалить сообщение?"}
        description={getDeletionDescription(conversation, deletion.pending)}
        confirmLabel="Удалить"
        isDanger
        onConfirm={deletion.confirm}
      />
    </>
  );
}

interface MessageDaysProps {
  days: MessageListDay[];
  onContextMenu: (event: MouseEvent<HTMLDivElement>, target: MessageMenuTarget) => void;
  onLongPress: (press: LongPress<HTMLDivElement>, target: MessageMenuTarget) => void;
  showReactions: boolean;
  canToggleReaction: (message: Message, reaction: MessageReaction) => boolean;
  onToggleReaction: (message: Message, emoji: string) => void;
  conversationId: ConversationId;
  /** Чаты пользователя: цитата из другого чата и пересланный пост ведут туда, только если чат есть в списке */
  conversations: Conversation[];
  onJumpToMessage: (messageId: MessageId) => void;
}

/**
 * Сами пузыри — отдельным компонентом, без состояния меню в пропсах: открытие меню их не перерисовывает.
 * Иначе на длинной ленте телефон пересобирал бы все сообщения, и меню появлялось бы с заметной задержкой
 */
function MessageDays({
  days,
  onContextMenu,
  onLongPress,
  showReactions,
  canToggleReaction,
  onToggleReaction,
  conversationId,
  conversations,
  onJumpToMessage,
}: MessageDaysProps) {
  // Лента уже без удалённых: цитата удалённого сообщения покажет, что отвечать больше не на что
  const messageIds = new Set(days.flatMap((day) => day.items.map((item) => item.message.id)));
  const replyContext = { conversationId, messageIds, conversations };

  return (
    <ol role="list" className={styles.list}>
      {/*
       * Каждый день — отдельная секция: sticky-разделитель ограничен ею,
       * поэтому следующий день выталкивает предыдущий, а не ложится поверх.
       */}
      {days.map((day) => (
        <li key={day.key} className={styles.daySection}>
          <div className={styles.day}>
            <time dateTime={day.date} className={styles.dayLabel} suppressHydrationWarning>
              {formatDaySeparator(day.date)}
            </time>
          </div>

          <ol role="list">
            {day.items.map((item) => (
              <MessageBubble
                key={item.key}
                message={item.message}
                variant={item.variant}
                showAuthor={item.showAuthor}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
                onContextMenu={onContextMenu}
                onLongPress={onLongPress}
                showReactions={showReactions}
                canToggleReaction={(reaction) => canToggleReaction(item.message, reaction)}
                onToggleReaction={(emoji) => onToggleReaction(item.message, emoji)}
                replyTarget={item.message.replyTo && resolveReplyQuote(item.message.replyTo, replyContext)}
                forwardHref={item.message.forwardedFrom && getForwardSourceHref(item.message.forwardedFrom, conversations)}
                onJumpToMessage={onJumpToMessage}
              />
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function getDeletionDescription(conversation: Conversation, deletion: MessageDeletion | null): string {
  switch (conversation.kind) {
    case "direct":
      return deletion?.forPeer
        ? "Сообщение будет удалено у вас и у собеседника. Отменить это действие нельзя."
        : "Сообщение будет удалено только у вас, у собеседника оно останется. Отменить это действие нельзя.";
    case "bot":
      return "Сообщение будет удалено у вас. Отменить это действие нельзя.";
    case "group":
      return "Сообщение будет удалено у всех участников группы. Отменить это действие нельзя.";
    case "channel":
      return "Пост будет удалён у всех подписчиков канала. Отменить это действие нельзя.";
  }
}
