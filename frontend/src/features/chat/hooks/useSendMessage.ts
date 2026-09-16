import { useCurrentUser } from "@/entities/user";
import { createLocalId } from "@/shared/lib/id";
import { sendMessage } from "../api/chat-api";
import { toMessageContent } from "../lib/outgoing-message";
import { useChatStore } from "../model/chat-store";
import type { ConversationId, Message, OutgoingMessageContent } from "../model/types";

/**
 * Оптимистичная отправка: сообщение сразу появляется в ленте, статус обновляется по ответу сервера.
 * Цитата из черновика ответа уходит вместе с сообщением — текстом, файлами или записью — и снимается с поля ввода
 */
export function useSendMessage(conversationId: ConversationId) {
  const { upsertMessage, replyDrafts, setReplyDraft } = useChatStore();
  const { user: currentUser } = useCurrentUser();

  return async function send(content: OutgoingMessageContent) {
    const replyTo = replyDrafts[conversationId];
    const draft: Message = {
      id: createLocalId("draft"),
      conversationId,
      author: { id: currentUser.id, displayName: currentUser.displayName },
      ...toMessageContent(content),
      replyTo,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    upsertMessage(draft);
    if (replyTo) setReplyDraft(conversationId, null);

    try {
      const savedMessage = await sendMessage(conversationId, content, { replyTo });
      upsertMessage(savedMessage, draft.id);
    } catch {
      upsertMessage({ ...draft, status: "failed" }, draft.id);
    }
  };
}
