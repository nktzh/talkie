import { findPaletteEmoji, getEmojiKey, MAX_OWN_REACTIONS } from "../config/reactions";
import type { MessageReaction } from "../model/types";

/*
 * У пользователя на сообщении до MAX_OWN_REACTIONS реакций: нажатие на свою — снимает её,
 * на любую другую (новую или уже поставленную кем-то) — добавляет, а сверх лимита вытесняет самую старую.
 * Логика общая для оптимистичного обновления в браузере и для серверного действия,
 * поэтому их результаты не расходятся.
 */

export function isSameEmoji(a: string, b: string): boolean {
  return getEmojiKey(a) === getEmojiKey(b);
}

/** Реакции текущего пользователя, от самой старой к самой новой */
export function getOwnReactions(reactions: readonly MessageReaction[] = []): string[] {
  return reactions
    .filter((reaction) => reaction.isChosen)
    .map((reaction, position) => ({ reaction, position }))
    // Без времени — самые ранние; при равенстве сохраняем порядок на сообщении
    .sort((a, b) => (a.reaction.chosenAt ?? "").localeCompare(b.reaction.chosenAt ?? "") || a.position - b.position)
    .map(({ reaction }) => reaction.emoji);
}

/** Свои реакции после нажатия на эмодзи: своя — снимается, чужая или новая — добавляется в пределах лимита */
export function getNextOwnReactions(reactions: readonly MessageReaction[] | undefined, emoji: string): string[] {
  const own = getOwnReactions(reactions);
  if (own.some((item) => isSameEmoji(item, emoji))) return own.filter((item) => !isSameEmoji(item, emoji));

  return [...own, emoji].slice(-MAX_OWN_REACTIONS);
}

/**
 * Реакции после того, как набор своих реакций текущего пользователя стал ownEmojis.
 * Порядок сохраняется: пропадают только реакции без голосов, новые встают в конец.
 */
export function applyOwnReactions(
  reactions: readonly MessageReaction[] = [],
  ownEmojis: readonly string[],
  now = new Date().toISOString(),
): MessageReaction[] {
  const isOwn = (emoji: string) => ownEmojis.some((item) => isSameEmoji(item, emoji));

  const next = reactions.map((reaction): MessageReaction => {
    if (reaction.isChosen === isOwn(reaction.emoji)) return reaction;

    return reaction.isChosen
      ? { emoji: reaction.emoji, count: reaction.count - 1, isChosen: false }
      : { ...reaction, count: reaction.count + 1, isChosen: true, chosenAt: now };
  });

  const added = ownEmojis
    .filter((emoji) => !next.some((reaction) => isSameEmoji(reaction.emoji, emoji)))
    .map((emoji): MessageReaction => ({
      emoji: findPaletteEmoji(emoji)?.emoji ?? emoji,
      count: 1,
      isChosen: true,
      chosenAt: now,
    }));

  return [...next, ...added].filter((reaction) => reaction.count > 0);
}

/** Название для подсказки и экранных читалок: у убранного из палитры эмодзи его нет */
export function getReactionName(emoji: string): string {
  return findPaletteEmoji(emoji)?.name ?? emoji;
}
