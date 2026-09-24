import type { UserId } from "@/entities/user";

/** Сохранённый собеседник: с него начинается личная переписка */
export interface Contact {
  id: UserId;
  firstName: string;
  lastName: string;
  displayName: string;
  username: string;
  /** В международном формате, например +79001234567 */
  phone: string;
  /** Фото контакта; без него рисуются инициалы */
  avatarUrl?: string;
  /** Эмодзи-статус из общей палитры (shared/emoji), который контакт поставил себе сам */
  status?: string;
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  username: string;
}
