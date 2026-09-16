"use client";

import { UserUnlock01Icon } from "@hugeicons/core-free-icons";
import { useConversationBlock } from "../hooks/useConversationBlock";
import type { DirectConversation } from "../model/types";
import { ChatFooterButton } from "./ChatFooterButton";

/** Заблокированному собеседнику не пишут: вместо поля ввода — снятие блокировки */
export function BlockedFooter({ conversation }: { conversation: DirectConversation }) {
  const setBlocked = useConversationBlock(conversation.id);

  return (
    <ChatFooterButton icon={UserUnlock01Icon} onClick={() => setBlocked(false)}>
      Пользователь заблокирован — разблокировать
    </ChatFooterButton>
  );
}
