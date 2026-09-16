import type { Conversation, ConversationId, Message, MessageForward, MessageId, MessageReply } from "../model/types";
import { describeMessageContent } from "./preview";

/** В цитате видна одна строка — длиннее хранить незачем */
const REPLY_TEXT_MAX_LENGTH = 200;

/** Снимок сообщения для цитаты в ответе */
export function createMessageReply(message: Message): MessageReply {
  const media = message.attachments?.find(
    (attachment) => attachment.kind === "image" || (attachment.kind === "video" && attachment.previewUrl),
  );
  const thumbnailUrl = media ? (media.kind === "image" ? media.url : media.previewUrl) : message.videoNote?.posterUrl;

  return {
    messageId: message.id,
    conversationId: message.conversationId,
    authorName: message.forwardedFrom?.authorName ?? message.author.displayName,
    text: describeMessageContent(message).slice(0, REPLY_TEXT_MAX_LENGTH),
    thumbnailUrl,
  };
}

/** Адрес сообщения: страница чата прокрутит к нему и подсветит */
export function getMessageHref(conversationId: ConversationId, messageId: MessageId): string {
  return `/app/${conversationId}#message-${encodeURIComponent(messageId)}`;
}

/** Сообщение из адреса вида /app/<чат>#message-<id> */
export function parseMessageHash(hash: string): MessageId | null {
  const match = /^#message-(.+)$/.exec(hash);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Что можно сделать с цитатой в ленте */
export type ReplyQuoteTarget =
  /** Оригинал в этой же ленте — прокрутить к нему */
  | { type: "jump"; messageId: MessageId }
  /** Ответ из другого чата, который есть у пользователя, — перейти туда */
  | { type: "link"; href: string; chatTitle: string }
  /** Оригинал удалён или чат недоступен: цитата только для чтения */
  | { type: "none"; isDeleted: boolean };

interface ResolveReplyContext {
  conversationId: ConversationId;
  /** id сообщений текущей ленты, уже без удалённых */
  messageIds: ReadonlySet<MessageId>;
  conversations: readonly Conversation[];
}

export function resolveReplyQuote(reply: MessageReply, context: ResolveReplyContext): ReplyQuoteTarget {
  if (reply.conversationId === context.conversationId) {
    return context.messageIds.has(reply.messageId)
      ? { type: "jump", messageId: reply.messageId }
      : { type: "none", isDeleted: true };
  }

  const source = context.conversations.find((conversation) => conversation.id === reply.conversationId);
  return source
    ? { type: "link", href: getMessageHref(source.id, reply.messageId), chatTitle: source.title }
    : { type: "none", isDeleted: false };
}

/**
 * Подпись «автор · чат» для цитаты из другого чата. У поста канала автор и есть канал —
 * второй раз название не повторяем
 */
export function getReplySourceLabel(reply: MessageReply, chatTitle: string | null): string | null {
  return chatTitle && chatTitle !== reply.authorName ? chatTitle : null;
}

/** Ссылка на пост, из которого переслано сообщение, — если канал есть в списке чатов */
export function getForwardSourceHref(forward: MessageForward, conversations: readonly Conversation[]): string | null {
  const { source } = forward;
  if (!source || !conversations.some((conversation) => conversation.id === source.conversationId)) return null;
  return getMessageHref(source.conversationId, source.messageId);
}
