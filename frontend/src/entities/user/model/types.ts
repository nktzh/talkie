export type UserId = string;

/** Публичные данные любого пользователя */
export interface User {
  id: UserId;
  displayName: string;
  username: string;
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
