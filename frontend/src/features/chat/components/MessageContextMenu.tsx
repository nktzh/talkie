"use client";

import {
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  MailReply01Icon,
} from "@hugeicons/core-free-icons";
import { downloadFile } from "@/shared/lib/download";
import { ContextMenu, ContextMenuItem, type ContextMenuState } from "@/shared/ui";
import type { SavableMedia } from "../lib/media";
import { getOwnReactions } from "../lib/reactions";
import {
  canDeleteMessage,
  canForwardMessage,
  canReactToMessage,
  canReplyToMessage,
  isMessageDelivered,
} from "../model/selectors";
import type { Conversation, Message, UserId } from "../model/types";
import { ReactionPicker } from "./ReactionPicker";

export interface MessageMenuTarget {
  message: Message;
  /** Медиа, по которому кликнули; null — клик по тексту или пустому месту пузыря */
  media: SavableMedia | null;
}

interface MessageContextMenuProps {
  menu: ContextMenuState<MessageMenuTarget> | null;
  onClose: () => void;
  /** Права на удаление зависят от вида чата, роли в нём и автора сообщения */
  conversation: Conversation;
  currentUserId: UserId;
  /** Удаление требует подтверждения — диалог живёт дольше меню, поэтому им управляет лента */
  onDelete: (message: Message, forPeer: boolean) => void;
  onReact: (message: Message, emoji: string) => void;
  onReply: (message: Message) => void;
  /** Там, где писать нельзя (канал, заблокированный собеседник), ответить можно только в другом чате */
  onReplyElsewhere: (message: Message) => void;
  onForward: (message: Message) => void;
}

/**
 * Есть ли у сообщения хоть одно действие. Без них меню открылось бы пустым — например,
 * на неотправленном голосовом при клике мимо плеера
 */
export function hasMessageActions(target: MessageMenuTarget, conversation: Conversation, currentUserId: UserId) {
  return (
    target.media !== null ||
    target.message.text.length > 0 ||
    canForwardMessage(target.message) ||
    canDeleteMessage(conversation, target.message, currentUserId) ||
    canReactToMessage(conversation, target.message)
  );
}

/** Меню по правому клику на сообщении */
export function MessageContextMenu({
  menu,
  onClose,
  conversation,
  currentUserId,
  onDelete,
  onReact,
  onReply,
  onReplyElsewhere,
  onForward,
}: MessageContextMenuProps) {
  const message = menu?.target.message;
  const media = menu?.target.media;
  const canDelete = message !== undefined && canDeleteMessage(conversation, message, currentUserId);
  const canReact = message !== undefined && canReactToMessage(conversation, message);
  const canReply = message !== undefined && canReplyToMessage(conversation, message);
  const canReplyElsewhere = message !== undefined && !canReply && isMessageDelivered(message);
  const canForward = message !== undefined && canForwardMessage(message);

  return (
    <ContextMenu menu={menu} onClose={onClose} label="Действия с сообщением">
      {canReact && (
        <ReactionPicker
          ownReactions={getOwnReactions(message.reactions)}
          onSelect={(emoji) => onReact(message, emoji)}
        />
      )}

      {canReply && <ContextMenuItem icon={ArrowTurnBackwardIcon} label="Ответить" onSelect={() => onReply(message)} />}

      {canReplyElsewhere && (
        <ContextMenuItem
          icon={MailReply01Icon}
          label="Ответить в другом чате"
          opensDialog
          onSelect={() => onReplyElsewhere(message)}
        />
      )}

      {canForward && (
        <ContextMenuItem icon={ArrowTurnForwardIcon} label="Переслать" opensDialog onSelect={() => onForward(message)} />
      )}

      {media && (
        <ContextMenuItem
          icon={Download04Icon}
          label="Сохранить"
          onSelect={() => downloadFile(media.url, media.fileName)}
        />
      )}

      {/* У голосовых и картинок без подписи копировать нечего */}
      {message?.text && (
        <ContextMenuItem
          icon={Copy01Icon}
          label="Скопировать сообщение"
          onSelect={() => navigator.clipboard.writeText(message.text).catch(() => {})}
        />
      )}

      {canDelete &&
        (conversation.kind === "direct" ? (
          <>
            <ContextMenuItem
              icon={Delete02Icon}
              label="Удалить у себя"
              isDanger
              opensDialog
              onSelect={() => onDelete(message, false)}
            />
            <ContextMenuItem
              icon={Delete02Icon}
              label="Удалить для всех"
              isDanger
              opensDialog
              onSelect={() => onDelete(message, true)}
            />
          </>
        ) : (
          <ContextMenuItem
            icon={Delete02Icon}
            label="Удалить сообщение"
            isDanger
            opensDialog
            onSelect={() => onDelete(message, false)}
          />
        ))}
    </ContextMenu>
  );
}
