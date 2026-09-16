/** Без похожих символов (0/O, 1/I/L), чтобы код было легко продиктовать */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const INVITE_CODE_LENGTH = 8;

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  const randomValues = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(randomValues, (value) => ALPHABET[value % ALPHABET.length]).join("");
}
