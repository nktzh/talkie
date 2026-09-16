import { useChatStore } from "../model/chat-store";
import type { ConversationId, Message } from "../model/types";

/** Сообщения с сервера плюс появившиеся за текущую сессию, без удалённых и с актуальными реакциями */
export function useConversationMessages(conversationId: ConversationId, initialMessages: Message[]): Message[] {
  const { sessionMessages, deletedMessageIds, messageReactions } = useChatStore();
  const localMessages = sessionMessages[conversationId] ?? [];
  const deletedIds = deletedMessageIds[conversationId] ?? [];
  const reactions = messageReactions[conversationId];

  if (localMessages.length === 0 && deletedIds.length === 0 && !reactions) return initialMessages;

  const knownIds = new Set(initialMessages.map((message) => message.id));
  const deleted = new Set(deletedIds);

  return [...initialMessages, ...localMessages.filter((message) => !knownIds.has(message.id))]
    .filter((message) => !deleted.has(message.id))
    .map((message) => (reactions?.[message.id] ? { ...message, reactions: reactions[message.id] } : message));
}
