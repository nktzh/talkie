export const THEME_COOKIE_NAME = "talkie-theme";
export const ACCENT_COOKIE_NAME = "talkie-accent";

export type Theme = "light" | "dark";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/**
 * Фон приложения в каждой теме: в него красится строка состояния на мобильных (meta theme-color).
 * Значения должны совпадать с --color-bg из tokens.css
 */
export const THEME_BACKGROUNDS: Record<Theme, string> = {
  light: "#f4f4f5",
  dark: "#070708",
};

/** Цвет оформления: акцентная палитра поверх любой из тем. Значения — блоки [data-accent] в tokens.css */
export type Accent = "blue" | "purple" | "orange" | "green" | "pink";

export const DEFAULT_ACCENT: Accent = "blue";

export interface AccentOption {
  id: Accent;
  label: string;
}

/** Порядок задаёт раскладку образцов цвета в настройках */
export const ACCENTS: readonly AccentOption[] = [
  { id: "blue", label: "Океан" },
  { id: "purple", label: "Аметист" },
  { id: "orange", label: "Янтарь" },
  { id: "green", label: "Мята" },
  { id: "pink", label: "Сакура" },
];

export function isAccent(value: unknown): value is Accent {
  return ACCENTS.some((accent) => accent.id === value);
}

/**
 * Цвет знака на иконке вкладки: акцент пользователя, в тёмной теме на тон светлее — иначе знак
 * теряется на тёмной панели вкладок. Значения — --accent-500 и --accent-400 из tokens.css
 */
export const ACCENT_ICON_COLORS: Record<Accent, Record<Theme, string>> = {
  blue: { light: "#3f8ff2", dark: "#64aff6" },
  purple: { light: "#8b5cf6", dark: "#a78bfa" },
  orange: { light: "#ef7317", dark: "#f7943c" },
  green: { light: "#1fa268", dark: "#3fbe83" },
  pink: { light: "#f43f6b", dark: "#fb7191" },
};

/**
 * Адрес иконки вкладки. Цвет едет в параметрах, а не берётся на сервере из куки: браузер держит
 * иконку в кеше по адресу, и при неизменном адресе он бы не заметил, что цвет сменился.
 * Без темы иконка подстраивается под системную настройку сама
 */
export function buildIconHref(theme: Theme | null, accent: Accent): string {
  const params = new URLSearchParams({ accent });
  if (theme) params.set("theme", theme);
  return `/icon?${params}`;
}
