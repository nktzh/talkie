import { validateUsername } from "@/entities/user";
import type { FieldErrors } from "@/shared/lib/form";
import type { ChannelFormValues, GroupFormValues } from "../types";

export const CHAT_TITLE_MIN_LENGTH = 2;
export const CHAT_TITLE_MAX_LENGTH = 64;
export const CHAT_DESCRIPTION_MAX_LENGTH = 240;

function validateChatTitle(value: string, requiredMessage: string): string | undefined {
  if (!value) return requiredMessage;
  if (value.length < CHAT_TITLE_MIN_LENGTH) return `Название не короче ${CHAT_TITLE_MIN_LENGTH} символов`;
  return undefined;
}

export function validateGroupForm(values: GroupFormValues): FieldErrors<GroupFormValues> {
  return {
    title: validateChatTitle(values.title, "Введите название группы"),
    // У группы по приглашениям ника нет — проверять нечего
    username:
      values.access === "public" ? validateUsername(values.username, "Введите никнейм группы") : undefined,
  };
}

export function validateChannelForm(values: ChannelFormValues): FieldErrors<ChannelFormValues> {
  return {
    title: validateChatTitle(values.title, "Введите название канала"),
    username: validateUsername(values.username, "Введите никнейм канала"),
  };
}
