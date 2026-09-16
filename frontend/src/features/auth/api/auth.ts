import { delay } from "@/shared/lib/delay";
import type { LoginPayload, RegisterPayload } from "../types";

/*
 * Заглушки до появления эндпоинтов авторизации на бэкенде.
 * Контракт: при неуспехе функция бросает Error с понятным пользователю сообщением —
 * форма покажет его над кнопкой отправки.
 */

export async function login(payload: LoginPayload): Promise<void> {
  void payload;
  await delay(600);
}

export async function register(payload: RegisterPayload): Promise<void> {
  void payload;
  await delay(800);
}
