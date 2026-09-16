import { getMockCurrentUser } from "@/entities/user/api/mock-user";
import { delay } from "@/shared/lib/delay";
import { createLocalId } from "@/shared/lib/id";
import type { ForwardedContent } from "../lib/forward";
import { getUploadSize, toMessageContent } from "../lib/outgoing-message";
import type { Conversation, ConversationId, Message, MessageReply, OutgoingMessageContent } from "../model/types";
import { getMockDatabase } from "./mock-db";

/*
 * Слой доступа к данным мессенджера. Пока бэкенд не готов, отдаёт моки.
 * UI работает только через эти функции, поэтому переход на реальный API
 * не потребует изменений в компонентах.
 */

const BYTES_IN_MEGABYTE = 1024 * 1024;

export async function getConversations(): Promise<Conversation[]> {
  return getMockDatabase().conversations;
}

export async function getConversation(conversationId: ConversationId): Promise<Conversation | null> {
  return getMockDatabase().conversations.find((conversation) => conversation.id === conversationId) ?? null;
}

export async function getMessages(conversationId: ConversationId): Promise<Message[]> {
  return getMockDatabase().messages[conversationId] ?? [];
}

interface SendMessageOptions {
  /** Цитата: сообщение из этого или другого чата, на которое отвечают */
  replyTo?: MessageReply;
}

/** Реальный API будет загружать файлы и возвращать их постоянные адреса */
export async function sendMessage(
  conversationId: ConversationId,
  content: OutgoingMessageContent,
  { replyTo }: SendMessageOptions = {},
): Promise<Message> {
  // Имитируем загрузку: чем больше вложения, тем дольше отправка
  const uploadSizeMb = getUploadSize(content) / BYTES_IN_MEGABYTE;
  await delay(400 + Math.min(uploadSizeMb * 150, 2000));

  return createSavedMessage(conversationId, { ...toMessageContent(content), replyTo });
}

/**
 * Пересылает сообщение в чат. Реальный API получит id оригинала и скопирует вложения у себя —
 * заново их не загружают, поэтому пересылка быстрая при любом размере файлов
 */
export async function forwardMessage(conversationId: ConversationId, content: ForwardedContent): Promise<Message> {
  await delay(350);
  return createSavedMessage(conversationId, content);
}

function createSavedMessage(
  conversationId: ConversationId,
  content: Omit<Message, "id" | "conversationId" | "author" | "createdAt" | "status">,
): Message {
  const author = getMockCurrentUser();

  return {
    id: createLocalId("message"),
    conversationId,
    author: { id: author.id, displayName: author.displayName },
    ...content,
    createdAt: new Date().toISOString(),
    status: "sent",
  };
}
