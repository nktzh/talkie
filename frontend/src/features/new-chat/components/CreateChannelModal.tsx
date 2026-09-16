"use client";

import { AtIcon, Megaphone01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/entities/user";
import { createChannelConversation, useChatStore } from "@/features/chat";
import { readString, useFormSubmit } from "@/shared/lib/form";
import { Modal, TextArea, TextField } from "@/shared/ui";
import { CHAT_DESCRIPTION_MAX_LENGTH, CHAT_TITLE_MAX_LENGTH, validateChannelForm } from "../lib/validation";
import type { ChannelFormValues } from "../types";
import { CreateChatPanel } from "./CreateChatPanel";

const TITLE_ID = "create-channel-title";

function readChannelValues(formData: FormData): ChannelFormValues {
  return {
    title: readString(formData, "title").trim(),
    username: readString(formData, "username").trim().replace(/^@/, ""),
    description: readString(formData, "description").trim(),
  };
}

interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateChannelModal({ open, onClose }: CreateChannelModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID} size="sheet">
      <CreateChannelForm onClose={onClose} />
    </Modal>
  );
}

/** Монтируется при каждом открытии модалки, поэтому поля всегда чистые */
function CreateChannelForm({ onClose }: { onClose: () => void }) {
  const { addConversation } = useChatStore();
  const router = useRouter();

  const { errors, formError, isPending, handleSubmit, clearFieldError } = useFormSubmit({
    readValues: readChannelValues,
    validate: validateChannelForm,
    submit: async (values) => {
      const created = await createChannelConversation(values);

      addConversation(created);
      router.push(`/app/${created.id}`);
    },
    onSuccess: onClose,
  });

  return (
    <CreateChatPanel
      titleId={TITLE_ID}
      icon={Megaphone01Icon}
      title="Новый канал"
      description="Лента постов: публикуете вы, читают подписчики"
      submitLabel="Создать канал"
      isPending={isPending}
      formError={formError}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        label="Название"
        name="title"
        placeholder="Например, Talkie Digest"
        autoComplete="off"
        maxLength={CHAT_TITLE_MAX_LENGTH}
        error={errors.title}
        onChange={() => clearFieldError("title")}
      />

      <TextField
        label="Никнейм канала"
        name="username"
        icon={AtIcon}
        placeholder="talkie_digest"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={USERNAME_MAX_LENGTH + 1}
        hint={USERNAME_HINT}
        error={errors.username}
        onChange={() => clearFieldError("username")}
      />

      <TextArea
        label="Описание (необязательно)"
        name="description"
        placeholder="О чём канал и как часто выходят посты"
        maxLength={CHAT_DESCRIPTION_MAX_LENGTH}
        hint={`До ${CHAT_DESCRIPTION_MAX_LENGTH} символов — подписчики увидят это описание в профиле канала`}
      />
    </CreateChatPanel>
  );
}
