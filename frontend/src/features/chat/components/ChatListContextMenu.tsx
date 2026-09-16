"use client";

import { Delete02Icon, Logout01Icon, Pin02Icon, PinOffIcon } from "@hugeicons/core-free-icons";
import { ContextMenu, ContextMenuItem, ContextMenuSeparator, type ContextMenuState } from "@/shared/ui";
import { setConversationPinned } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import { canDeleteForEveryone, canLeaveConversation } from "../model/selectors";
import type { Conversation } from "../model/types";
import type { ConversationRemovalAction } from "./ConversationRemovalDialog";

interface ChatListContextMenuProps {
  menu: ContextMenuState<Conversation> | null;
  onClose: () => void;
  /** Удаление и выход требуют подтверждения — диалог живёт дольше меню, поэтому им управляет список */
  onRemove: (conversation: Conversation, action: ConversationRemovalAction) => void;
}

/** Меню по правому клику на чате в списке */
export function ChatListContextMenu({ menu, onClose, onRemove }: ChatListContextMenuProps) {
  const { setPinned } = useChatStore();
  const conversation = menu?.target;

  async function togglePinned({ id, isPinned }: Conversation) {
    setPinned(id, !isPinned);
    try {
      await setConversationPinned(id, !isPinned);
    } catch {
      setPinned(id, isPinned);
    }
  }

  return (
    <ContextMenu menu={menu} onClose={onClose} label={conversation ? `Действия с чатом ${conversation.title}` : ""}>
      {conversation && (
        <>
          <ContextMenuItem
            icon={conversation.isPinned ? PinOffIcon : Pin02Icon}
            label={conversation.isPinned ? "Открепить" : "Закрепить"}
            onSelect={() => togglePinned(conversation)}
          />

          <ContextMenuSeparator />

          {(conversation.kind === "direct" || conversation.kind === "bot") && (
            <ContextMenuItem
              icon={Delete02Icon}
              label="Удалить чат"
              isDanger
              opensDialog
              onSelect={() => onRemove(conversation, "delete")}
            />
          )}

          {canLeaveConversation(conversation) && (
            <ContextMenuItem
              icon={Logout01Icon}
              label={conversation.kind === "channel" ? "Выйти из канала" : "Выйти из группы"}
              isDanger
              opensDialog
              onSelect={() => onRemove(conversation, "leave")}
            />
          )}

          {canDeleteForEveryone(conversation) && (
            <ContextMenuItem
              icon={Delete02Icon}
              label={conversation.kind === "channel" ? "Удалить канал" : "Удалить группу"}
              isDanger
              opensDialog
              onSelect={() => onRemove(conversation, "delete")}
            />
          )}
        </>
      )}
    </ContextMenu>
  );
}
