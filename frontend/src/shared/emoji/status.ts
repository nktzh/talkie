import { findPaletteEmoji } from "./palette";

/*
 * Статус — одно эмодзи из общей палитры рядом с именем пользователя или названием группы и канала.
 * Пользователь ставит его себе в настройках профиля, владелец — своей группе или каналу.
 * Статуса может не быть вовсе: тогда рядом с именем просто ничего не показывается.
 */

/** Приводит выбранное эмодзи к записи палитры. null и пустая строка — статуса нет */
export function parseStatus(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const item = findPaletteEmoji(value);
  // Клиент мог прислать что угодно, в том числе эмодзи, которое уже убрали из палитры
  if (!item) throw new Error("Такого статуса нет в палитре");

  return item.emoji;
}

/** Название статуса для подсказки и экранных читалок; у убранного из палитры эмодзи его нет */
export function getStatusName(emoji: string): string {
  return findPaletteEmoji(emoji)?.name ?? emoji;
}
