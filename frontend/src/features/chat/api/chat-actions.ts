"use server";

import { getMockCurrentUser } from "@/entities/user/api/mock-user";
import { parseStatus } from "@/shared/emoji";
import { delay } from "@/shared/lib/delay";
import { createLocalId } from "@/shared/lib/id";
import { findPaletteEmoji, getEmojiKey, MAX_OWN_REACTIONS } from "../config/reactions";
import { applyOwnReactions, getOwnReactions, isSameEmoji } from "../lib/reactions";
import {
  canDeleteForEveryone,
  canDeleteMessage,
  canLeaveConversation,
  canManageReactions,
  canManageStatus,
  canReactToMessage,
  findDirectConversation,
} from "../model/selectors";
import type {
  ChannelDraft,
  Conversation,
  ConversationId,
  GroupDraft,
  MessageId,
  MessageReaction,
  User,
} from "../model/types";
import {
  addMockConversation,
  getMockDatabase,
  removeMockConversation,
  removeMockMessage,
  setMockConversationPinned,
  setMockConversationStatus,
  setMockDirectBlocked,
  setMockMessageReactions,
  setMockReactionsEnabled,
} from "./mock-db";

/*
 * Серверное действие: чат должен появиться именно на сервере, иначе страница
 * /app/<id> отрисуется как «чат не найден».
 */

/** Открывает личную переписку с собеседником: находит существующую или заводит пустую */
export async function startDirectConversation(peer: User): Promise<Conversation> {
  const existing = findDirectConversation(getMockDatabase().conversations, peer.id);
  if (existing) return existing;

  const conversation: Conversation = {
    kind: "direct",
    id: createLocalId("chat"),
    title: peer.displayName,
    peer,
    isOnline: false,
    lastSeenAt: null,
    isBlocked: false,
    lastMessage: null,
    createdAt: new Date().toISOString(),
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  };

  addMockConversation(conversation);
  return conversation;
}

/** Общая часть любого только что созданного чата */
function createConversationBase(title: string) {
  return {
    id: createLocalId("chat"),
    title,
    lastMessage: null,
    createdAt: new Date().toISOString(),
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
  };
}

/** Ник виден в поиске и в ссылке на чат, поэтому двух одинаковых быть не может */
function assertUsernameIsFree(username: string): void {
  const isTaken = getMockDatabase().conversations.some(
    (conversation) =>
      (conversation.kind === "group" || conversation.kind === "channel") && conversation.username === username,
  );

  if (isTaken) throw new Error("Этот никнейм уже занят");
}

/** Создаёт группу: автор пока единственный участник */
export async function createGroupConversation({ title, username }: GroupDraft): Promise<Conversation> {
  await delay(500);
  if (username) assertUsernameIsFree(username);

  const { id, displayName, username: authorUsername, avatarUrl } = getMockCurrentUser();
  const author: User = { id, displayName, username: authorUsername, avatarUrl };

  const conversation: Conversation = {
    kind: "group",
    ...createConversationBase(title),
    role: "owner",
    membersCount: 1,
    members: [author],
    username: username ?? undefined,
    reactionsEnabled: true,
  };

  addMockConversation(conversation);
  return conversation;
}

/** Создаёт канал: автор становится владельцем и может публиковать посты */
export async function createChannelConversation({ title, username, description }: ChannelDraft): Promise<Conversation> {
  await delay(500);
  assertUsernameIsFree(username);

  const conversation: Conversation = {
    kind: "channel",
    ...createConversationBase(title),
    subscribersCount: 1,
    role: "owner",
    username,
    description: description || undefined,
    reactionsEnabled: true,
  };

  addMockConversation(conversation);
  return conversation;
}

function findConversation(conversationId: ConversationId): Conversation | undefined {
  return getMockDatabase().conversations.find((conversation) => conversation.id === conversationId);
}

interface DeleteConversationOptions {
  /** Только для личной переписки: удалить её и у собеседника */
  forPeer?: boolean;
}

/**
 * Удаляет чат. Личная переписка и чат с ботом пропадают у текущего пользователя,
 * а группа и канал — у всех, поэтому их удаляет только владелец.
 */
export async function deleteConversation(
  conversationId: ConversationId,
  { forPeer = false }: DeleteConversationOptions = {},
): Promise<void> {
  await delay(400);
  const conversation = findConversation(conversationId);
  if (!conversation) return;

  if ((conversation.kind === "group" || conversation.kind === "channel") && !canDeleteForEveryone(conversation)) {
    throw new Error("Удалить может только владелец");
  }

  if (forPeer && conversation.kind === "direct") {
    // Настоящий бэкенд удалит переписку и у собеседника
    console.info(`Чат ${conversationId} удалён у обоих собеседников`);
  }

  removeMockConversation(conversationId);
}

/** Выход из группы или отписка от канала: чат исчезает из списка */
export async function leaveConversation(conversationId: ConversationId): Promise<void> {
  await delay(400);
  const conversation = findConversation(conversationId);
  if (!conversation) return;

  if (!canLeaveConversation(conversation)) {
    throw new Error("Владелец не может выйти — только удалить");
  }

  removeMockConversation(conversationId);
}

export async function setConversationPinned(conversationId: ConversationId, isPinned: boolean): Promise<void> {
  await delay(250);
  setMockConversationPinned(conversationId, isPinned);
}

interface DeleteMessageOptions {
  /** Только для личной переписки: удалить сообщение и у собеседника */
  forPeer?: boolean;
}

export async function deleteMessage(
  conversationId: ConversationId,
  messageId: MessageId,
  { forPeer = false }: DeleteMessageOptions = {},
): Promise<void> {
  await delay(300);
  const conversation = findConversation(conversationId);
  const message = getMockDatabase().messages[conversationId]?.find((item) => item.id === messageId);
  // Сообщения, отправленные за сессию, моки не сохраняют — на сервере удалять нечего
  if (!conversation || !message) return;

  if (!canDeleteMessage(conversation, message, getMockCurrentUser().id)) {
    throw new Error("Недостаточно прав, чтобы удалить сообщение");
  }

  if (forPeer) {
    if (conversation.kind !== "direct") throw new Error("Удалить у собеседника можно только в личной переписке");
    // Настоящий бэкенд удалит сообщение и у собеседника
    console.info(`Сообщение ${messageId} удалено у обоих собеседников`);
  }

  removeMockMessage(conversationId, messageId);
}

/**
 * Задаёт полный набор реакций текущего пользователя на сообщении (пустой — снять все).
 * Набор, а не «переключить эмодзи»: повторный или запоздавший запрос не превратит реакцию в противоположную.
 * Возвращает итоговые реакции сообщения; null — сообщения на сервере нет (моки не хранят отправленные за сессию)
 */
export async function setOwnReactions(
  conversationId: ConversationId,
  messageId: MessageId,
  emojis: string[],
): Promise<MessageReaction[] | null> {
  await delay(250);
  const conversation = findConversation(conversationId);
  if (!conversation) throw new Error("Чат не найден");

  const message = getMockDatabase().messages[conversationId]?.find((item) => item.id === messageId);
  const permissionTarget = message ?? { status: "sent" as const };
  if (!canReactToMessage(conversation, permissionTarget)) {
    throw new Error("Реакции в этом чате недоступны");
  }

  // Лимит проверяет сервер: клиент мог его обойти или прислать дубликаты
  if (new Set(emojis.map(getEmojiKey)).size !== emojis.length || emojis.length > MAX_OWN_REACTIONS) {
    throw new Error(`На сообщение можно поставить не больше ${MAX_OWN_REACTIONS} реакций`);
  }

  // Проверка по палитре — тоже на сервере: клиент со старой палитрой не поставит то, чего в ней уже нет.
  // Уже стоящую реакцию с убранным эмодзи оставить можно
  const alreadyOwn = getOwnReactions(message?.reactions);
  const isAllowed = (emoji: string) =>
    Boolean(findPaletteEmoji(emoji)) || alreadyOwn.some((item) => isSameEmoji(item, emoji));
  if (!emojis.every(isAllowed)) {
    throw new Error("Такой реакции нет в палитре");
  }

  if (!message) return null;

  const reactions = applyOwnReactions(message.reactions, emojis);
  setMockMessageReactions(conversationId, messageId, reactions);
  return reactions;
}

/** Задаёт эмодзи-статус группы или канала; null — убирает его. Это может только владелец */
export async function setConversationStatus(conversationId: ConversationId, status: string | null): Promise<void> {
  const parsed = parseStatus(status);
  await delay(300);

  const conversation = findConversation(conversationId);
  if (!conversation) return;

  if (!canManageStatus(conversation)) {
    throw new Error("Статус задаёт только владелец");
  }

  setMockConversationStatus(conversationId, parsed);
}

/** Включает или выключает реакции в группе или канале — это может только владелец */
export async function setConversationReactionsEnabled(
  conversationId: ConversationId,
  isEnabled: boolean,
): Promise<void> {
  await delay(300);
  const conversation = findConversation(conversationId);
  if (!conversation) return;

  if (!canManageReactions(conversation)) {
    throw new Error("Реакции настраивает только владелец");
  }

  setMockReactionsEnabled(conversationId, isEnabled);
}

/** Блокирует или разблокирует собеседника в личной переписке */
export async function setConversationBlocked(
  conversationId: ConversationId,
  isBlocked: boolean,
): Promise<void> {
  await delay(400);
  setMockDirectBlocked(conversationId, isBlocked);
}

/** Жалоба на чат: настоящий бэкенд отправит её модераторам */
export async function reportConversation(conversationId: ConversationId, reason: string): Promise<void> {
  await delay(600);
  console.info(`Жалоба на чат ${conversationId}: ${reason}`);
}
