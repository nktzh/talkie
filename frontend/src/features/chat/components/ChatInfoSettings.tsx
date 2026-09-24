"use client";

import { SmileIcon, SmilePlusIcon } from "@hugeicons/core-free-icons";
import { useId, useRef, useState } from "react";
import { getStatusName, StatusEmoji, StatusPicker } from "@/shared/emoji";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import { setConversationReactionsEnabled, setConversationStatus } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import { canManageReactions, canManageStatus } from "../model/selectors";
import type { ChannelConversation, Conversation, GroupConversation } from "../model/types";
import { ChatInfoSection } from "./ChatInfoSection";
import styles from "./ChatInfoSettings.module.css";

type ManagedConversation = GroupConversation | ChannelConversation;

/** Настройки чата, доступные владельцу. Остальным раздел не показывается */
export function ChatInfoSettings({ conversation }: { conversation: Conversation }) {
  if (conversation.kind !== "group" && conversation.kind !== "channel") return null;

  const canEditStatus = canManageStatus(conversation);
  const canEditReactions = canManageReactions(conversation);
  if (!canEditStatus && !canEditReactions) return null;

  return (
    <ChatInfoSection title="Настройки">
      {canEditStatus && <StatusRow conversation={conversation} />}
      {canEditReactions && <ReactionsSwitch conversation={conversation} />}
    </ChatInfoSection>
  );
}

/** Эмодзи-статус рядом с названием: его видят все, кому виден сам чат */
function StatusRow({ conversation }: { conversation: ManagedConversation }) {
  const { setStatus } = useChatStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Номер последнего выбора: ошибка по устаревшему не откатит свежий
  const latestRequest = useRef(0);
  const hintId = useId();
  const { status } = conversation;
  const isChannel = conversation.kind === "channel";
  const subject = isChannel ? "канала" : "группы";

  // Статус меняется сразу, как и переключатель реакций; если сервер откажет — возвращается прежний
  function choose(next: string | null) {
    setIsPickerOpen(false);
    const previous = status;
    const requestId = ++latestRequest.current;
    setError(null);
    setStatus(conversation.id, next ?? undefined);

    setConversationStatus(conversation.id, next).catch(() => {
      if (latestRequest.current !== requestId) return;
      setStatus(conversation.id, previous);
      setError("Не удалось сохранить статус. Попробуйте ещё раз");
    });
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-describedby={hintId}
        className={styles.row}
        onClick={() => setIsPickerOpen(true)}
      >
        <Icon icon={SmilePlusIcon} size={20} className={styles.icon} />
        <span className={styles.body}>
          <span className={styles.label}>Статус</span>
          <span id={hintId} className={cn(styles.hint, error && styles.error)}>
            {error ?? (status ? getStatusName(status) : `Эмодзи рядом с названием ${subject}`)}
          </span>
        </span>
        {status && <StatusEmoji status={status} size={22} />}
      </button>

      <StatusPicker
        open={isPickerOpen}
        title={`Статус ${subject}`}
        description={`Эмодзи рядом с названием увидят все ${isChannel ? "подписчики" : "участники"}`}
        value={status}
        onSelect={choose}
        onClose={() => setIsPickerOpen(false)}
      />
    </>
  );
}

function ReactionsSwitch({ conversation }: { conversation: ManagedConversation }) {
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
