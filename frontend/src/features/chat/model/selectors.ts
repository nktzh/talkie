import type { ChatFolder } from "../config/folders";
import type { Conversation, Message, UserId } from "./types";

const SEARCH_LOCALE = "ru-RU";

function getLastActivity(conversation: Conversation): string {
  return conversation.lastMessage?.createdAt ?? conversation.createdAt ?? "";
}

/** Закреплённые сверху, остальные — по времени последнего сообщения */
export function sortConversations(conversations: readonly Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return getLastActivity(b).localeCompare(getLastActivity(a));
  });
}

function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/^@/, "").toLocaleLowerCase(SEARCH_LOCALE);
}

/** Ник, по которому чат находят в поиске; у закрытых групп его нет */
export function getConversationUsername(conversation: Conversation): string | null {
  if (conversation.kind === "direct") return conversation.peer.username;
  if (conversation.kind === "bot") return conversation.bot.username;
  return conversation.username ?? null;
}

function matchesSearchQuery(conversation: Conversation, normalizedQuery: string): boolean {
  const username = getConversationUsername(conversation);
  const searchable = username ? [conversation.title, username] : [conversation.title];

  return searchable.some((value) => value.toLocaleLowerCase(SEARCH_LOCALE).includes(normalizedQuery));
}

/** Поиск по названию и нику без учёта папок — например, при выборе чата для пересылки */
export function searchConversations(conversations: readonly Conversation[], query: string): Conversation[] {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [...conversations];

  return conversations.filter((conversation) => matchesSearchQuery(conversation, normalizedQuery));
}

export function filterConversations(
  conversations: readonly Conversation[],
  { folder, query }: { folder: ChatFolder; query: string },
): Conversation[] {
  const normalizedQuery = normalizeSearchQuery(query);

  return conversations.filter(
    (conversation) =>
      folder.includes(conversation) && (!normalizedQuery || matchesSearchQuery(conversation, normalizedQuery)),
  );
}

/** Личная переписка с конкретным собеседником, если она уже заведена */
export function findDirectConversation(
  conversations: readonly Conversation[],
  peerId: UserId,
): Conversation | undefined {
  return conversations.find((conversation) => conversation.kind === "direct" && conversation.peer.id === peerId);
}

/**
 * Как в Telegram: считаем чаты с непрочитанными, заглушённые не учитываем.
 * Без папки — по всем чатам.
 */
export function countUnreadChats(conversations: readonly Conversation[], folder?: ChatFolder): number {
  return conversations.filter(
    (conversation) =>
      (!folder || folder.includes(conversation)) && !conversation.isMuted && conversation.unreadCount > 0,
  ).length;
}

/** В каналах публикуют только владелец и администраторы, а заблокированному собеседнику не пишут вовсе */
export function canPostMessages(conversation: Conversation): boolean {
  if (conversation.kind === "channel") return conversation.role !== "subscriber";
  if (conversation.kind === "direct") return !conversation.isBlocked;
  return true;
}

/** Группу и канал удаляет — сразу для всех — только владелец */
export function canDeleteForEveryone(conversation: Conversation): boolean {
  return (conversation.kind === "group" || conversation.kind === "channel") && conversation.role === "owner";
}

/** Владелец не выходит из группы или канала: они остались бы без хозяина. Его вариант — удаление */
export function canLeaveConversation(conversation: Conversation): boolean {
  return (conversation.kind === "group" || conversation.kind === "channel") && conversation.role !== "owner";
}

/** Реакции выключает владелец группы или канала; в личной переписке и с ботом они есть всегда */
export function areReactionsEnabled(conversation: Conversation): boolean {
  return conversation.kind === "group" || conversation.kind === "channel" ? conversation.reactionsEnabled : true;
}

/** Включать и выключать реакции может только владелец группы или канала */
export function canManageReactions(conversation: Conversation): boolean {
  return (conversation.kind === "group" || conversation.kind === "channel") && conversation.role === "owner";
}

/** Сообщение есть на сервере: неотправленное нельзя ни процитировать, ни переслать, ни отметить реакцией */
export function isMessageDelivered(message: Pick<Message, "status">): boolean {
  return message.status === "sent" || message.status === "read";
}

/** Ответить в той же переписке можно, только если в неё можно писать */
export function canReplyToMessage(conversation: Conversation, message: Pick<Message, "status">): boolean {
  return isMessageDelivered(message) && canPostMessages(conversation);
}

/** Переслать можно любое доставленное сообщение — даже из канала, где пользователь только читает */
export function canForwardMessage(message: Pick<Message, "status">): boolean {
  return isMessageDelivered(message);
}

/**
 * Реагировать можно, пока реакции включены. Сообщения, которое ещё не дошло до сервера, там нет,
 * а заблокированный собеседник не получает от нас ничего — в том числе реакций
 */
export function canReactToMessage(conversation: Conversation, message: Pick<Message, "status">): boolean {
  if (!isMessageDelivered(message)) return false;
  if (conversation.kind === "direct" && conversation.isBlocked) return false;
  return areReactionsEnabled(conversation);
}

/**
 * В личной переписке и с ботом удалить у себя можно любое сообщение, в группе — своё,
 * а чужое — только владельцу и администраторам. Посты канала удаляют те, кто их публикует.
 * Сообщение, которое ещё отправляется, удалять нечего.
 */
export function canDeleteMessage(conversation: Conversation, message: Message, currentUserId: UserId): boolean {
  if (message.status === "sending") return false;

  switch (conversation.kind) {
    case "direct":
    case "bot":
      return true;
    case "group":
      return message.author.id === currentUserId || conversation.role !== "member";
    case "channel":
      return conversation.role !== "subscriber";
  }
}
