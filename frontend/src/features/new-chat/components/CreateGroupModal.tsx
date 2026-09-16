"use client";

import { AtIcon, GlobalIcon, Ticket01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/entities/user";
import { createGroupConversation, useChatStore } from "@/features/chat";
import { cn } from "@/shared/lib/cn";
import { readString, useFormSubmit } from "@/shared/lib/form";
import { Icon, Modal, TextField, type IconSvgElement } from "@/shared/ui";
import { CHAT_TITLE_MAX_LENGTH, validateGroupForm } from "../lib/validation";
import type { GroupAccess, GroupFormValues } from "../types";
import { CreateChatPanel } from "./CreateChatPanel";
import styles from "./CreateGroupModal.module.css";

const TITLE_ID = "create-group-title";

function readGroupValues(formData: FormData): GroupFormValues {
  return {
    title: readString(formData, "title").trim(),
    access: readString(formData, "access") === "public" ? "public" : "invite",
    username: readString(formData, "username").trim().replace(/^@/, ""),
  };
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ open, onClose }: CreateGroupModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} size="sheet">
      <CreateGroupForm onClose={onClose} />
    </Modal>
  );
}

/** Монтируется при каждом открытии модалки, поэтому поля всегда чистые */
function CreateGroupForm({ onClose }: { onClose: () => void }) {
  const { addConversation } = useChatStore();
  const router = useRouter();
  // Тип группы нужен и в разметке: у групп по приглашениям поля ника нет
  const [access, setAccess] = useState<GroupAccess>("invite");

  const { errors, formError, isPending, handleSubmit, clearFieldError } = useFormSubmit({
    readValues: readGroupValues,
    validate: validateGroupForm,
    submit: async (values) => {
      const created = await createGroupConversation({
        title: values.title,
        username: values.access === "public" ? values.username : null,
      });

      addConversation(created);
      router.push(`/app/${created.id}`);
    },
    onSuccess: onClose,
  });

  return (
    <CreateChatPanel
      titleId={TITLE_ID}
      icon={UserGroupIcon}
      title="Новая группа"
      description="Общий чат, в котором пишут все участники"
      submitLabel="Создать группу"
      isPending={isPending}
      formError={formError}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        label="Название"
        name="title"
        placeholder="Например, Команда Talkie"
        autoComplete="off"
        maxLength={CHAT_TITLE_MAX_LENGTH}
        error={errors.title}
        onChange={() => clearFieldError("title")}
      />

      <fieldset className={styles.access}>
        <legend className={styles.legend}>Кто может войти</legend>
        <div className={styles.options}>
          <AccessOption
            value="invite"
            icon={Ticket01Icon}
            title="По приглашениям"
            description="Только по ссылке от участника"
            checked={access === "invite"}
            onSelect={setAccess}
          />
          <AccessOption
            value="public"
            icon={GlobalIcon}
            title="Публичная"
            description="Любой найдёт группу по никнейму"
            checked={access === "public"}
            onSelect={setAccess}
          />
        </div>
      </fieldset>

      {access === "public" && (
        <TextField
          label="Никнейм группы"
          name="username"
          icon={AtIcon}
          placeholder="talkie_team"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX_LENGTH + 1}
          hint={USERNAME_HINT}
          error={errors.username}
          onChange={() => clearFieldError("username")}
        />
      )}
    </CreateChatPanel>
  );
}

interface AccessOptionProps {
  value: GroupAccess;
  icon: IconSvgElement;
  title: string;
  description: string;
  checked: boolean;
  onSelect: (value: GroupAccess) => void;
}

function AccessOption({ value, icon, title, description, checked, onSelect }: AccessOptionProps) {
  return (
    <label className={cn(styles.option, checked && styles.selected)}>
      <input
        type="radio"
        name="access"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <Icon icon={icon} size={20} className={styles.optionIcon} />
      <span className={styles.optionTitle}>{title}</span>
      <span className={styles.optionDescription}>{description}</span>
    </label>
  );
}
