import { useState } from "react";
import { deleteMessage } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import type { Message } from "../model/types";

export interface MessageDeletion {
  message: Message;
  /** Только в личной переписке: удалить и у собеседника */
  forPeer: boolean;
}

/**
 * Удаление сообщения с подтверждением: request открывает диалог, confirm удаляет.
 * Оптимистично: сообщение пропадает из ленты сразу, а если сервер откажет — возвращается на место
 */
export function useDeleteMessage(messages: Message[]) {
  const { removeMessage, restoreMessage, replyDrafts, setReplyDraft } = useChatStore();
  const [pending, setPending] = useState<MessageDeletion | null>(null);

  function confirm() {
    if (!pending) return;
    const { message, forPeer } = pending;

    setPending(null);
    // Отвечать больше не на что: цитата удалённого сообщения не должна уйти в чат
    if (replyDrafts[message.conversationId]?.messageId === message.id) {
      setReplyDraft(message.conversationId, null);
    }
    removeMessage(message, messages.filter((item) => item.id !== message.id).at(-1) ?? null);
    deleteMessage(message.conversationId, message.id, { forPeer }).catch(() => restoreMessage(message));
  }

  return {
    pending,
    request: (message: Message, forPeer: boolean) => setPending({ message, forPeer }),
    cancel: () => setPending(null),
    confirm,
  };
}
