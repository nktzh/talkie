export type UserId = string;

/** Публичные данные любого пользователя */
export interface User {
  id: UserId;
  displayName: string;
  username: string;
  /** Загруженное фото; без него аватар рисуется из инициалов */
  avatarUrl?: string;
  /** Эмодзи-статус из общей палитры (shared/emoji); без него рядом с именем ничего не показывается */
  status?: string;
}

/** Текущий пользователь: помимо публичных данных видит свои приватные поля */
export interface CurrentUser extends User {
  firstName: string;
  lastName: string;
  /** В международном формате, например +79001234567 */
  phone: string | null;
}

export interface ProfileUpdate {
  firstName: string;
  lastName: string;
  username: string;
  phone: string | null;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}
