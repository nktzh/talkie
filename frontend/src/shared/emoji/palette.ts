/*
 * Общая палитра эмодзи — единственный источник правды сразу для двух вещей:
 * реакций на сообщения (features/chat/config/reactions) и статусов пользователей,
 * групп и каналов (shared/emoji/status). Палитра одна, поэтому статус — всегда то же эмодзи,
 * которым можно отреагировать на сообщение.
 *
 * Как добавить эмодзи в палитру:
 *   1. Допишите { emoji, name } в EMOJI_PALETTE. Порядок в списке — порядок в палитре,
 *      первые QUICK_REACTIONS_COUNT попадают в быструю строку контекстного меню сообщения.
 *   2. Больше ничего менять не нужно: сетки добавят строку, а сервер начнёт принимать новое эмодзи
 *      и как реакцию, и как статус.
 *
 * Ошибка в записи — дубликат, не эмодзи, несколько символов, пустое название — роняет модуль
 * при загрузке, поэтому видна сразу в dev, а не у пользователей.
 *
 * Убрать эмодзи тоже безопасно: уже поставленные реакции и уже выбранные статусы остаются на месте.
 * Снять такую реакцию или сменить такой статус можно, выбрать заново — нет.
 */

export interface PaletteEmoji {
  /** Ровно один символ-эмодзи; вариант с U+FE0F и без него считается одним и тем же */
  emoji: string;
  /** Название для экранных читалок и всплывающей подсказки */
  name: string;
}

const graphemeSegmenter = new Intl.Segmenter("ru", { granularity: "grapheme" });
const PICTOGRAPHIC = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Ключ для сравнения: ❤️ и ❤ отличаются только селектором варианта U+FE0F */
export function getEmojiKey(emoji: string): string {
  return emoji.replaceAll("️", "");
}

/** Одно и то же эмодзи, даже если записано по-разному */
export function isSameEmoji(a: string, b: string): boolean {
  return getEmojiKey(a) === getEmojiKey(b);
}

function definePalette(entries: readonly PaletteEmoji[]): readonly PaletteEmoji[] {
  const keys = new Set<string>();

  for (const { emoji, name } of entries) {
    const graphemes = [...graphemeSegmenter.segment(emoji)].length;
    if (graphemes !== 1 || !PICTOGRAPHIC.test(emoji)) {
      throw new Error(`Палитра эмодзи: «${emoji}» должно быть одним эмодзи`);
    }
    if (!name.trim()) {
      throw new Error(`Палитра эмодзи: у «${emoji}» нет названия`);
    }

    const key = getEmojiKey(emoji);
    if (keys.has(key)) {
      throw new Error(`Палитра эмодзи: «${emoji}» встречается дважды`);
    }
    keys.add(key);
  }

  return Object.freeze([...entries]);
}

export const EMOJI_PALETTE = definePalette([
  // Быстрая строка реакций
  { emoji: "👍", name: "Нравится" },
  { emoji: "❤️", name: "Сердце" },
  { emoji: "🔥", name: "Огонь" },
  { emoji: "😂", name: "Смешно" },
  { emoji: "😮", name: "Удивление" },
  { emoji: "😢", name: "Грустно" },
  { emoji: "🙏", name: "Спасибо" },

  { emoji: "👎", name: "Не нравится" },
  { emoji: "🎉", name: "Праздник" },
  { emoji: "👏", name: "Аплодисменты" },
  { emoji: "🤩", name: "Восторг" },
  { emoji: "🥰", name: "Обожаю" },
  { emoji: "😁", name: "Радость" },
  { emoji: "🤔", name: "Задумался" },
  { emoji: "🤯", name: "Взрыв мозга" },
  { emoji: "😱", name: "Ужас" },
  { emoji: "🤬", name: "Злость" },
  { emoji: "💔", name: "Разбитое сердце" },
  { emoji: "🤮", name: "Тошнит" },
  { emoji: "⚡", name: "Молния" },
  { emoji: "🏆", name: "Кубок" },
  { emoji: "🤝", name: "Договорились" },
  { emoji: "👌", name: "Отлично" },
  { emoji: "😎", name: "Круто" },
  { emoji: "👀", name: "Смотрю" },
  { emoji: "🫡", name: "Принято" },
  { emoji: "✍️", name: "Записал" },
  { emoji: "🤗", name: "Обнимаю" },
  { emoji: "😴", name: "Скучно" },
  { emoji: "🤡", name: "Клоун" },
  { emoji: "🙈", name: "Не смотрю" },
  { emoji: "🍾", name: "Отмечаем" },
]);

const paletteByKey = new Map(EMOJI_PALETTE.map((item) => [getEmojiKey(item.emoji), item]));

/** Запись палитры для эмодзи; undefined — эмодзи в палитре нет (например, его оттуда убрали) */
export function findPaletteEmoji(emoji: string): PaletteEmoji | undefined {
  return paletteByKey.get(getEmojiKey(emoji));
}
