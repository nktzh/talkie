"use client";

import { SmilePlusIcon } from "@hugeicons/core-free-icons";
import { useState, useTransition } from "react";
import { updateStatus, useCurrentUser } from "@/entities/user";
import { getStatusName, StatusEmoji, StatusPicker } from "@/shared/emoji";
import { FormAlert, Icon } from "@/shared/ui";
import styles from "./ProfileStatusButton.module.css";

const DEFAULT_ERROR_MESSAGE = "Не удалось сохранить статус. Попробуйте ещё раз.";

/**
 * Эмодзи-статус профиля в настройках: кнопка открывает палитру, повторный выбор того же
 * эмодзи или «Убрать статус» — очищает. Статус видят все, кому видно имя
 */
export function ProfileStatusButton() {
  const { user, setUser } = useCurrentUser();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { status } = user;

  function choose(next: string | null) {
    setIsPickerOpen(false);
    setError(null);

    startTransition(async () => {
      try {
        setUser(await updateStatus(next));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={status ? `Статус: ${getStatusName(status)}. Изменить` : "Добавить статус"}
        aria-busy={isPending || undefined}
        disabled={isPending}
        className={styles.button}
        onClick={() => setIsPickerOpen(true)}
      >
        {status ? (
          <>
            <StatusEmoji status={status} size={18} />
            <span aria-hidden="true">{getStatusName(status)}</span>
          </>
        ) : (
          <>
            <Icon icon={SmilePlusIcon} size={18} />
            <span aria-hidden="true">Добавить статус</span>
          </>
        )}
      </button>

      {error && (
        <FormAlert variant="error" className={styles.error}>
          {error}
        </FormAlert>
      )}

      <StatusPicker
        open={isPickerOpen}
        title="Статус профиля"
        description="Эмодзи рядом с вашим именем увидят все собеседники"
        value={status}
        onSelect={choose}
        onClose={() => setIsPickerOpen(false)}
      />
    </div>
  );
}
