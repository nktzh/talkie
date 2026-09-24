"use client";

import { Camera01Icon, Delete02Icon, ImageUpload01Icon } from "@hugeicons/core-free-icons";
import { useRef, useState, useTransition, type ChangeEvent, type MouseEvent } from "react";
import { removeAvatar, updateAvatar, useCurrentUser } from "@/entities/user";
import { Avatar, ContextMenu, ContextMenuItem, FormAlert, Icon, useContextMenu } from "@/shared/ui";
import { AVATAR_ACCEPT, readImageFile, type PickedImage } from "../lib/avatar";
import { AvatarCropModal } from "./AvatarCropModal";
import styles from "./AvatarPicker.module.css";

const AVATAR_SIZE = 88;
const DEFAULT_ERROR_MESSAGE = "Не удалось сохранить фото. Попробуйте ещё раз.";

/**
 * Фото профиля в настройках: клик по аватару открывает выбор файла,
 * а когда фото уже загружено — меню «заменить или удалить».
 */
export function AvatarPicker() {
  const { user, setUser } = useCurrentUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { menu, openAtTrigger, close } = useContextMenu<null>();

  const hasAvatar = Boolean(user.avatarUrl);

  function pickFile() {
    inputRef.current?.click();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (hasAvatar) openAtTrigger(event, null);
    else pickFile();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Тот же файл можно выбрать повторно: без сброса значения change второй раз не придёт
    event.target.value = "";
    if (!file) return;

    setError(null);
    try {
      setPicked(await readImageFile(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE);
    }
  }

  function closeEditor() {
    if (picked) URL.revokeObjectURL(picked.url);
    setPicked(null);
  }

  function handleSave(avatar: Blob) {
    startTransition(async () => {
      try {
        setUser(await updateAvatar(avatar));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE);
      }
      // Окно кадрирования закрываем в любом случае: ошибка видна под аватаром
      closeEditor();
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        setUser(await removeAvatar());
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : DEFAULT_ERROR_MESSAGE);
      }
    });
  }

  return (
    <div className={styles.picker}>
      <button
        type="button"
        className={styles.button}
        aria-label={hasAvatar ? "Изменить фото профиля" : "Загрузить фото профиля"}
        aria-haspopup={hasAvatar ? "menu" : undefined}
        aria-busy={isPending || undefined}
        disabled={isPending}
        onClick={handleClick}
      >
        <Avatar id={user.id} name={user.displayName} src={user.avatarUrl} size={AVATAR_SIZE} />
        <span className={styles.overlay} aria-hidden="true">
          {isPending ? <span className={styles.spinner} /> : <Icon icon={Camera01Icon} size={22} />}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className={styles.input}
        onChange={handleFileChange}
      />

      {error && (
        <FormAlert variant="error" className={styles.error}>
          {error}
        </FormAlert>
      )}

      <ContextMenu menu={menu} onClose={close} label="Фото профиля">
        <ContextMenuItem icon={ImageUpload01Icon} label="Заменить фото" onSelect={pickFile} />
        <ContextMenuItem icon={Delete02Icon} label="Удалить фото" isDanger onSelect={handleRemove} />
      </ContextMenu>

      <AvatarCropModal image={picked} isPending={isPending} onCancel={closeEditor} onSave={handleSave} />
    </div>
  );
}
