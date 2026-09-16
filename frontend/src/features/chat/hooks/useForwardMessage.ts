import { useCurrentUser } from "@/entities/user";
import { createLocalId } from "@/shared/lib/id";
import { forwardMessage, sendMessage } from "../api/chat-api";
import { createForwardedContent } from "../lib/forward";
import { useChatStore } from "../model/chat-store";
import type { Conversation, ConversationId, Message } from "../model/types";

type DraftContent = Omit<Message, "id" | "conversationId" | "author" | "createdAt" | "status">;

/**
 * Оптимистичная пересылка в несколько чатов: копии сразу появляются в их лентах и в списке чатов,
 * статус каждой обновляется по ответу сервера независимо от остальных
 */
export function useForwardMessage(sourceConversation: Conversation) {
  const { upsertMessage } = useChatStore();
  const { user: currentUser } = useCurrentUser();

  function addDraft(conversationId: ConversationId, content: DraftContent): Message {
    const draft: Message = {
      id: createLocalId("draft"),
      conversationId,
      author: { id: currentUser.id, displayName: currentUser.displayName },
      ...content,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    upsertMessage(draft);
    return draft;
  }

  async function deliver(draft: Message, request: () => Promise<Message>) {
    try {
      upsertMessage(await request(), draft.id);
    } catch {
      upsertMessage({ ...draft, status: "failed" }, draft.id);
    }
  }

  return function forward(message: Message, targetIds: readonly ConversationId[], comment: string) {
    const content = createForwardedContent(message, sourceConversation);
    const text = comment.trim();

    return Promise.all(
      targetIds.map(async (conversationId) => {
        // Комментарий — отдельное сообщение перед пересланным, как в Telegram.
        // Отправляются по очереди, чтобы на сервере встать в том же порядке, что и в ленте
        const commentDraft = text ? addDraft(conversationId, { text }) : null;
        const forwardDraft = addDraft(conversationId, content);

        if (commentDraft) {
          await deliver(commentDraft, () =>
            sendMessage(conversationId, { text, format: "plain", attachments: [], voice: null, videoNote: null }),
          );
        }
        await deliver(forwardDraft, () => forwardMessage(conversationId, content));
      }),
    );
  };
}
