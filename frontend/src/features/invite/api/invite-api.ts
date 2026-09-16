import { delay } from "@/shared/lib/delay";
import { generateInviteCode } from "../lib/invite-code";

/*
 * Заглушка: в будущем код выдаёт бэкенд — он же проверяет его при регистрации.
 * Контракт: при неуспехе функция бросает Error.
 */
export async function createInviteCode(): Promise<string> {
  await delay(400);
  return generateInviteCode();
}
