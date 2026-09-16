/*
 * Правила для ника и пароля едины для регистрации и настроек аккаунта.
 * Каждая функция возвращает текст ошибки или undefined, если значение корректно.
 */

export const NAME_MAX_LENGTH = 64;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const PASSWORD_MIN_LENGTH = 8;

export const USERNAME_HINT = `Латинские буквы, цифры и _, от ${USERNAME_MIN_LENGTH} до ${USERNAME_MAX_LENGTH} символов`;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export function validateUsername(value: string, requiredMessage: string): string | undefined {
  if (!value) return requiredMessage;
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return `Длина — от ${USERNAME_MIN_LENGTH} до ${USERNAME_MAX_LENGTH} символов`;
  }
  if (!USERNAME_PATTERN.test(value)) return "Допустимы только латинские буквы, цифры и _";
  return undefined;
}

export function validateNewPassword(value: string, requiredMessage = "Введите пароль"): string | undefined {
  if (!value) return requiredMessage;
  if (value.length < PASSWORD_MIN_LENGTH) return `Пароль должен быть не короче ${PASSWORD_MIN_LENGTH} символов`;
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return "Повторите пароль";
  if (confirmation !== password) return "Пароли не совпадают";
  return undefined;
}

const PHONE_ALLOWED_CHARS = /^\+?[\d\s()-]+$/;
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 15;

/** «+7 (900) 123-45-67» → «+79001234567» */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

/** requiredMessage не задан — поле необязательное, пустое значение считается корректным */
export function validatePhone(value: string, requiredMessage?: string): string | undefined {
  if (!value) return requiredMessage;

  const digitsCount = value.replace(/\D/g, "").length;
  if (!PHONE_ALLOWED_CHARS.test(value) || digitsCount < PHONE_MIN_DIGITS || digitsCount > PHONE_MAX_DIGITS) {
    return "Введите номер в международном формате, например +7 900 123-45-67";
  }
  return undefined;
}
