import { useRef } from "react";
import { setConversationBlocked } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import type { ConversationId } from "../model/types";

/**
 * Оптимистичная блокировка собеседника: чат переключается сразу, а если сервер откажет — возвращается как было.
 * Откатывается только последний запрос: ошибка по устаревшему клику не перетрёт более свежий
 */
export function useConversationBlock(conversationId: ConversationId) {
  const { setBlocked } = useChatStore();
  const latestRequest = useRef(0);

  return function changeBlocked(isBlocked: boolean) {
    const requestId = ++latestRequest.current;
    setBlocked(conversationId, isBlocked);

    setConversationBlocked(conversationId, isBlocked).catch(() => {
      if (latestRequest.current === requestId) setBlocked(conversationId, !isBlocked);
    });
  };
}
