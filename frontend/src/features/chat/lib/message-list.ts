import type { ConversationKind, Message, UserId } from "../model/types";
import { isSameDay } from "./format";

/** Сообщения одного автора с интервалом меньше этого значения визуально объединяются */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageVariant = "outgoing" | "incoming" | "post";

export interface MessageListItem {
  key: string;
  message: Message;
  variant: MessageVariant;
  showAuthor: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

/** Сообщения одного календарного дня: разделитель прилипает только в пределах своей секции */
export interface MessageListDay {
  key: string;
  date: string;
  items: MessageListItem[];
}

function isSameGroup(previous: Message, current: Message): boolean {
  return (
    previous.author.id === current.author.id &&
    isSameDay(previous.createdAt, current.createdAt) &&
    Date.parse(current.createdAt) - Date.parse(previous.createdAt) < GROUP_WINDOW_MS
  );
}

function getVariant(message: Message, conversationKind: ConversationKind, currentUserId: UserId): MessageVariant {
  // Посты в канале всегда выводятся лентой, даже если их опубликовал текущий пользователь
  if (conversationKind === "channel") return "post";
  return message.author.id === currentUserId ? "outgoing" : "incoming";
}

/** Превращает плоский список сообщений в секции по дням с признаками группы у каждого сообщения */
export function buildMessageListDays(
  messages: readonly Message[],
  { conversationKind, currentUserId }: { conversationKind: ConversationKind; currentUserId: UserId },
): MessageListDay[] {
  const days: MessageListDay[] = [];
  let day: MessageListDay | undefined;

  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];

    if (!day || !previous || !isSameDay(previous.createdAt, message.createdAt)) {
      day = { key: `day-${message.id}`, date: message.createdAt, items: [] };
      days.push(day);
    }

    const variant = getVariant(message, conversationKind, currentUserId);

    day.items.push({
      key: message.id,
      message,
      variant,
      showAuthor: conversationKind === "group" && variant === "incoming",
      isFirstInGroup: !previous || !isSameGroup(previous, message),
      isLastInGroup: !next || !isSameGroup(message, next),
    });
  });

  return days;
}
