import { parseStatus } from "@/shared/emoji";
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

/**
 * Сохраняет фото профиля. Пока бэкенда нет, обрезанная картинка живёт в памяти вкладки:
 * ссылка на неё действует до перезагрузки страницы, как и остальные заглушки.
 */
export async function updateAvatar(avatar: Blob): Promise<CurrentUser> {
  await delay(600);

  const previous = getMockCurrentUser();
  releaseAvatar(previous.avatarUrl);

  const user: CurrentUser = { ...previous, avatarUrl: URL.createObjectURL(avatar) };
  setMockCurrentUser(user);
  return user;
}

/**
 * Сохраняет эмодзи-статус профиля; null — убирает его.
 * Эмодзи проверяется по палитре: из неё его могли убрать уже после того, как страница загрузилась
 */
export async function updateStatus(status: string | null): Promise<CurrentUser> {
  const parsed = parseStatus(status);
  await delay(300);

  const user: CurrentUser = { ...getMockCurrentUser(), status: parsed };
  setMockCurrentUser(user);
  return user;
}

export async function removeAvatar(): Promise<CurrentUser> {
  await delay(400);

  const { avatarUrl, ...rest } = getMockCurrentUser();
  releaseAvatar(avatarUrl);

  setMockCurrentUser(rest);
  return rest;
}

/** Отпускаем прежнее фото: иначе картинка останется в памяти вкладки до её закрытия */
function releaseAvatar(url: string | undefined): void {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export async function changePassword(payload: PasswordChange): Promise<void> {
  void payload;
  await delay(600);
}
