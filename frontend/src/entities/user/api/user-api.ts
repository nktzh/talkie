import { delay } from "@/shared/lib/delay";
import { getDisplayName } from "../lib/display-name";
import type { CurrentUser, PasswordChange, ProfileUpdate } from "../model/types";
import { getMockCurrentUser, setMockCurrentUser } from "./mock-user";

/*
 * Аккаунт текущего пользователя. Пока бэкенд не готов — заглушки.
 * Контракт: при неуспехе функции бросают Error с понятным пользователю сообщением.
 */

export async function getCurrentUser(): Promise<CurrentUser> {
  return getMockCurrentUser();
}

export async function updateProfile(update: ProfileUpdate): Promise<CurrentUser> {
  await delay(500);

  const user: CurrentUser = {
    ...getMockCurrentUser(),
    ...update,
    displayName: getDisplayName(update),
  };
  setMockCurrentUser(user);
  return user;
}

export async function changePassword(payload: PasswordChange): Promise<void> {
  void payload;
  await delay(600);
}
