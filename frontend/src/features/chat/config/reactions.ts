import { EMOJI_PALETTE, type PaletteEmoji } from "@/shared/emoji";

/*
 * Реакции на сообщения берутся из общей палитры эмодзи (shared/emoji/palette) — той же,
 * из которой выбираются статусы. Добавлять и убирать эмодзи нужно там: здесь только настройки
 * самих реакций — сколько их в быстрой строке меню и сколько своих помещается на одном сообщении.
 */

export type { PaletteEmoji as ReactionEmoji };
export { findPaletteEmoji, getEmojiKey } from "@/shared/emoji";

/** Сколько реакций показывать в строке над пунктами меню; остальные — по кнопке «Все реакции» */
export const QUICK_REACTIONS_COUNT = 7;

/**
 * Сколько реакций один пользователь ставит на одно сообщение. Считаются все его реакции —
 * и новые эмодзи, и присоединение к уже поставленным другими. Сверх лимита снимается самая старая
 */
export const MAX_OWN_REACTIONS = 3;

if (EMOJI_PALETTE.length < QUICK_REACTIONS_COUNT) {
  throw new Error(`Палитра реакций: нужно хотя бы ${QUICK_REACTIONS_COUNT} эмодзи для быстрой строки`);
}

/** Вся палитра: порядок в ней — порядок в сетке «Все реакции» */
export const REACTION_PALETTE = EMOJI_PALETTE;

export const QUICK_REACTIONS = REACTION_PALETTE.slice(0, QUICK_REACTIONS_COUNT);
