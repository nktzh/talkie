import { useRef } from "react";
import { setOwnReactions } from "../api/chat-actions";
import { findPaletteEmoji } from "../config/reactions";
import { applyOwnReactions, getNextOwnReactions } from "../lib/reactions";
import { useChatStore } from "../model/chat-store";
import { canReactToMessage } from "../model/selectors";
import type { Conversation, Message, MessageId, MessageReaction } from "../model/types";

/** Оптимистичные реакции: лента обновляется сразу, а при ошибке сервера возвращается как было */
export function useMessageReactions(conversation: Conversation) {
  const { setMessageReactions } = useChatStore();
  // Номер последнего запроса по сообщению: ответ на устаревший клик не должен перетереть свежий
  const latestRequests = useRef(new Map<MessageId, number>());

  /** Можно ли нажать на реакцию: снять свою можно всегда, поставить — только эмодзи из палитры */
  function canToggle(message: Message, reaction: MessageReaction): boolean {
    return canReactToMessage(conversation, message) && (reaction.isChosen || Boolean(findPaletteEmoji(reaction.emoji)));
  }

  /** Своя реакция снимается, любая другая добавляется; сверх лимита снимается самая старая своя */
  async function toggle(message: Message, emoji: string) {
    if (!canReactToMessage(conversation, message)) return;

    const previous = message.reactions ?? [];
    const own = getNextOwnReactions(previous, emoji);
    const isAdding = own.length > 0 && own.at(-1) === emoji;
    if (isAdding && !findPaletteEmoji(emoji)) return;

    const requestId = (latestRequests.current.get(message.id) ?? 0) + 1;
    latestRequests.current.set(message.id, requestId);
    setMessageReactions(message, applyOwnReactions(previous, own));

    try {
      const saved = await setOwnReactions(message.conversationId, message.id, own);
      if (saved && latestRequests.current.get(message.id) === requestId) setMessageReactions(message, saved);
    } catch {
      if (latestRequests.current.get(message.id) === requestId) setMessageReactions(message, previous);
    }
  }

  return { canToggle, toggle };
}
