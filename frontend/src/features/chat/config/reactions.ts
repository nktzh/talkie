/*
 * Палитра реакций — единственный источник правды: из неё строится меню сообщения,
 * и по ней же серверное действие проверяет, можно ли поставить эмодзи.
 *
 * Как добавить эмодзи в палитру:
 *   1. Допишите { emoji, name } в REACTION_PALETTE. Порядок в списке — порядок в палитре,
 *      первые QUICK_REACTIONS_COUNT попадают в быструю строку контекстного меню.
 *   2. Больше ничего менять не нужно: сетка добавит строку, а сервер начнёт принимать новое эмодзи.
 *
 * Ошибка в записи — дубликат, не эмодзи, несколько символов, пустое название — роняет модуль
 * при загрузке, поэтому видна сразу в dev, а не у пользователей.
 *
 * Убрать эмодзи тоже безопасно: уже поставленные реакции останутся на сообщениях.
 * Снять такую реакцию можно, поставить заново — нет.
 */

export interface ReactionEmoji {
  /** Ровно один символ-эмодзи; вариант с U+FE0F и без него считается одним и тем же */
  emoji: string;
  /** Название для экранных читалок и всплывающей подсказки */
  name: string;
}

/** Сколько реакций показывать в строке над пунктами меню; остальные — по кнопке «Все реакции» */
export const QUICK_REACTIONS_COUNT = 7;

/**
 * Сколько реакций один пользователь ставит на одно сообщение. Считаются все его реакции —
 * и новые эмодзи, и присоединение к уже поставленным другими. Сверх лимита снимается самая старая
 */
export const MAX_OWN_REACTIONS = 3;

const graphemeSegmenter = new Intl.Segmenter("ru", { granularity: "grapheme" });
const PICTOGRAPHIC = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

/** Ключ для сравнения: ❤️ и ❤ отличаются только селектором варианта U+FE0F */
export function getEmojiKey(emoji: string): string {
  return emoji.replaceAll("\uFE0F", "");
}

function defineReactionPalette(entries: readonly ReactionEmoji[]): readonly ReactionEmoji[] {
  const keys = new Set<string>();

  for (const { emoji, name } of entries) {
    const graphemes = [...graphemeSegmenter.segment(emoji)].length;
    if (graphemes !== 1 || !PICTOGRAPHIC.test(emoji)) {
      throw new Error(`Палитра реакций: «${emoji}» должно быть одним эмодзи`);
    }
    if (!name.trim()) {
      throw new Error(`Палитра реакций: у «${emoji}» нет названия`);
    }

    const key = getEmojiKey(emoji);
    if (keys.has(key)) {
      throw new Error(`Палитра реакций: «${emoji}» встречается дважды`);
    }
    keys.add(key);
  }

  if (entries.length < QUICK_REACTIONS_COUNT) {
    throw new Error(`Палитра реакций: нужно хотя бы ${QUICK_REACTIONS_COUNT} эмодзи для быстрой строки`);
  }

  return Object.freeze([...entries]);
}

export const REACTION_PALETTE = defineReactionPalette([
  // Быстрая строка
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

export const QUICK_REACTIONS = REACTION_PALETTE.slice(0, QUICK_REACTIONS_COUNT);

const paletteByKey = new Map(REACTION_PALETTE.map((item) => [getEmojiKey(item.emoji), item]));

/** Запись палитры для эмодзи; undefined — эмодзи в палитре нет (например, его оттуда убрали) */
export function findPaletteEmoji(emoji: string): ReactionEmoji | undefined {
  return paletteByKey.get(getEmojiKey(emoji));
}
