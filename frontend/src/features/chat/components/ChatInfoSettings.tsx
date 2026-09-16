"use client";

import { SmileIcon } from "@hugeicons/core-free-icons";
import { useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { setConversationReactionsEnabled } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import { canManageReactions } from "../model/selectors";
import type { ChannelConversation, Conversation, GroupConversation } from "../model/types";
import { ChatInfoSection } from "./ChatInfoSection";
import styles from "./ChatInfoSettings.module.css";

/** Настройки чата, доступные владельцу. Остальным раздел не показывается */
export function ChatInfoSettings({ conversation }: { conversation: Conversation }) {
  if (conversation.kind !== "group" && conversation.kind !== "channel") return null;
  if (!canManageReactions(conversation)) return null;

  return (
    <ChatInfoSection title="Настройки">
      <ReactionsSwitch conversation={conversation} />
    </ChatInfoSection>
  );
}

function ReactionsSwitch({ conversation }: { conversation: GroupConversation | ChannelConversation }) {
  const { setReactionsEnabled } = useChatStore();
  const [error, setError] = useState<string | null>(null);
  // Номер последнего переключения: ошибка по устаревшему не откатит свежее
  const latestRequest = useRef(0);
  const hintId = useId();
  const isEnabled = conversation.reactionsEnabled;
  const audience = conversation.kind === "channel" ? "подписчиков" : "участников";

  // Переключатель откликается сразу и не блокируется на время сохранения; если сервер откажет — возвращается обратно
  function toggle() {
    const next = !isEnabled;
    const requestId = ++latestRequest.current;
    setError(null);
    setReactionsEnabled(conversation.id, next);

    setConversationReactionsEnabled(conversation.id, next).catch(() => {
      if (latestRequest.current !== requestId) return;
      setReactionsEnabled(conversation.id, !next);
      setError("Не удалось сохранить настройку. Попробуйте ещё раз");
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isEnabled}
      aria-describedby={hintId}
      className={styles.row}
      onClick={toggle}
    >
      <Icon icon={SmileIcon} size={20} className={styles.icon} />
      <span className={styles.body}>
        <span className={styles.label}>Реакции</span>
        <span id={hintId} className={cn(styles.hint, error && styles.error)}>
          {error ??
            (isEnabled
              ? `Можно реагировать на ${conversation.kind === "channel" ? "посты" : "сообщения"}`
              : `Выключены и скрыты у всех ${audience}`)}
        </span>
      </span>
      <span className={cn(styles.switch, isEnabled && styles.on)} aria-hidden="true" />
    </button>
  );
}
