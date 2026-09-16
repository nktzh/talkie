"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/shared/ui";
import { deleteConversation, leaveConversation } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import type { Conversation } from "../model/types";
import styles from "./ConversationRemovalDialog.module.css";

/** delete — удалить чат (группу и канал — для всех), leave — выйти из группы или канала */
export type ConversationRemovalAction = "delete" | "leave";

export interface ConversationRemovalRequest {
  conversation: Conversation;
  action: ConversationRemovalAction;
}

interface ConversationRemovalDialogProps {
  /** null — диалог закрыт */
  request: ConversationRemovalRequest | null;
  onClose: () => void;
}

/**
 * Подтверждение перед удалением чата или выходом из него. Если чат открыт — возвращает к списку.
 * Оптимистично: чат пропадает сразу, а если сервер откажет — возвращается в список
 */
export function ConversationRemovalDialog({ request, onClose }: ConversationRemovalDialogProps) {
  const { addConversation, removeConversation } = useChatStore();
  const router = useRouter();
  const { chatId } = useParams<{ chatId?: string }>();
  const [isForPeer, setIsForPeer] = useState(false);

  const copy = request ? getRemovalCopy(request) : null;

  function close() {
    setIsForPeer(false);
    onClose();
  }

  function confirm() {
    if (!request) return;
    const { conversation, action } = request;
    const forPeer = isForPeer;

    close();
    removeConversation(conversation.id);
    if (chatId === conversation.id) router.replace("/app");

    const removal =
      action === "leave" ? leaveConversation(conversation.id) : deleteConversation(conversation.id, { forPeer });
    removal.catch(() => addConversation(conversation));
  }

  return (
    <ConfirmDialog
      open={request !== null}
      onClose={close}
      title={copy?.title ?? ""}
      description={copy?.description ?? ""}
      confirmLabel={copy?.confirmLabel ?? ""}
      isDanger
      onConfirm={confirm}
    >
      {request?.action === "delete" && request.conversation.kind === "direct" && (
        <label className={styles.option}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={isForPeer}
            onChange={(event) => setIsForPeer(event.target.checked)}
          />
          Также удалить у собеседника
        </label>
      )}
    </ConfirmDialog>
  );
}

interface RemovalCopy {
  title: string;
  description: string;
  confirmLabel: string;
}

function getRemovalCopy({ conversation, action }: ConversationRemovalRequest): RemovalCopy {
  const irreversible = "Отменить это действие нельзя.";

  switch (conversation.kind) {
    case "direct":
      return {
        title: "Удалить чат?",
        description: `Переписка с ${conversation.peer.displayName} будет удалена у вас. ${irreversible}`,
        confirmLabel: "Удалить",
      };

    case "bot":
      return {
        title: "Удалить чат?",
        description: `Переписка с ботом ${conversation.title} будет удалена. ${irreversible}`,
        confirmLabel: "Удалить",
      };

    case "group":
      return action === "leave"
        ? {
            title: "Выйти из группы?",
            description: `Группа «${conversation.title}» пропадёт из списка чатов, а новые сообщения перестанут приходить.`,
            confirmLabel: "Выйти",
          }
        : {
            title: "Удалить группу?",
            description: `Группа «${conversation.title}» и вся переписка в ней будут удалены у всех участников. ${irreversible}`,
            confirmLabel: "Удалить",
          };

    case "channel":
      return action === "leave"
        ? {
            title: "Выйти из канала?",
            description: `Канал «${conversation.title}» пропадёт из списка чатов, а новые посты перестанут приходить.`,
            confirmLabel: "Выйти",
          }
        : {
            title: "Удалить канал?",
            description: `Канал «${conversation.title}» и все его посты будут удалены у всех подписчиков. ${irreversible}`,
            confirmLabel: "Удалить",
          };
  }
}
