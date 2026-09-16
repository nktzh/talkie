"use client";

import { Notification01Icon, NotificationOff01Icon } from "@hugeicons/core-free-icons";
import { useChatStore } from "../model/chat-store";
import type { ChannelConversation } from "../model/types";
import { ChatFooterButton } from "./ChatFooterButton";

/** Вместо поля ввода у подписчиков канала — управление уведомлениями */
export function ChannelFooter({ conversation }: { conversation: ChannelConversation }) {
  const { toggleMute } = useChatStore();

  return (
    <ChatFooterButton
      icon={conversation.isMuted ? Notification01Icon : NotificationOff01Icon}
      onClick={() => toggleMute(conversation.id)}
    >
      {conversation.isMuted ? "Включить уведомления" : "Выключить уведомления"}
    </ChatFooterButton>
  );
}
