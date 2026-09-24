import type { Conversation, ConversationId, MessageId, MessageReaction } from "../model/types";
import { createMockDatabase, type MockDatabase } from "./mock-data";

/*
 * Одна копия моков на процесс. База собирается при первом обращении: если
 * пересобирать её на каждый запрос, чат, начатый из контактов, пропадал бы сразу.
 */
let database: MockDatabase | null = null;

export function getMockDatabase(): MockDatabase {
  database ??= createMockDatabase();
  return database;
}

export function addMockConversation(conversation: Conversation): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = [...mockDatabase.conversations, conversation];
  mockDatabase.messages[conversation.id] = [];
}

export function removeMockConversation(conversationId: ConversationId): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = mockDatabase.conversations.filter(
    (conversation) => conversation.id !== conversationId,
  );
  delete mockDatabase.messages[conversationId];
}

export function setMockConversationPinned(conversationId: ConversationId, isPinned: boolean): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = mockDatabase.conversations.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, isPinned } : conversation,
  );
}

/** Удаляет сообщение и, если оно было последним, показывает в списке чатов предыдущее */
export function removeMockMessage(conversationId: ConversationId, messageId: MessageId): void {
  const mockDatabase = getMockDatabase();
  const messages = (mockDatabase.messages[conversationId] ?? []).filter((message) => message.id !== messageId);

  mockDatabase.messages[conversationId] = messages;
  mockDatabase.conversations = mockDatabase.conversations.map((conversation) =>
    conversation.id === conversationId && conversation.lastMessage?.id === messageId
      ? { ...conversation, lastMessage: messages.at(-1) ?? null }
      : conversation,
  );
}

/**
 * Моки хранят реакции уже «с точки зрения» текущего пользователя — другого в них нет.
 * Настоящий бэкенд хранит, кто что поставил, и вычисляет isChosen для каждого запроса
 */
export function setMockMessageReactions(
  conversationId: ConversationId,
  messageId: MessageId,
  reactions: MessageReaction[],
): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.messages[conversationId] = (mockDatabase.messages[conversationId] ?? []).map((message) =>
    message.id === messageId ? { ...message, reactions } : message,
  );
}

/** Статус группы или канала; undefined — статуса нет */
export function setMockConversationStatus(conversationId: ConversationId, status: string | undefined): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = mockDatabase.conversations.map((conversation) =>
    conversation.id === conversationId && (conversation.kind === "group" || conversation.kind === "channel")
      ? { ...conversation, status }
      : conversation,
  );
}

export function setMockReactionsEnabled(conversationId: ConversationId, reactionsEnabled: boolean): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = mockDatabase.conversations.map((conversation) =>
    conversation.id === conversationId && (conversation.kind === "group" || conversation.kind === "channel")
      ? { ...conversation, reactionsEnabled }
      : conversation,
  );
}

/** Блокировка собеседника должна пережить переход между страницами */
export function setMockDirectBlocked(conversationId: ConversationId, isBlocked: boolean): void {
  const mockDatabase = getMockDatabase();
  mockDatabase.conversations = mockDatabase.conversations.map((conversation) =>
    conversation.id === conversationId && conversation.kind === "direct"
      ? { ...conversation, isBlocked }
      : conversation,
  );
}
