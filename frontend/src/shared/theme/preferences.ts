"use client";

import {
  ACCENT_COOKIE_NAME,
  DEFAULT_ACCENT,
  THEME_BACKGROUNDS,
  THEME_COOKIE_NAME,
  isAccent,
  isTheme,
  type Accent,
  type Theme,
} from "./constants";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/*
 * Выбор живёт в data-атрибутах на <html>, а не в React: так его видит CSS и не мигает
 * при загрузке. Чтобы интерфейс выбора всё же перерисовывался, атрибуты работают как
 * внешнее хранилище — подписка для useSyncExternalStore, менять их можно только отсюда
 */
const listeners = new Set<() => void>();

export function subscribeToPreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener();
}

/** Тема и цвет живут в куке: сервер отрисует выбранное сразу, без мигания при загрузке */
function writeCookie(name: string, value: string | null) {
  const maxAge = value === null ? 0 : ONE_YEAR_IN_SECONDS;
  document.cookie = `${name}=${value ?? ""}; path=/; max-age=${maxAge}; samesite=lax`;
}

/** «Системная» — это отсутствие выбора: атрибута нет, тему решает prefers-color-scheme */
export type ThemeMode = Theme | "system";

export function getThemeMode(): ThemeMode {
  const { theme } = document.documentElement.dataset;
  return isTheme(theme) ? theme : "system";
}

/** Тема, которая сейчас на экране: при «системной» её подсказывает медиазапрос */
export function getActiveTheme(): Theme {
  const mode = getThemeMode();
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
  if (mode === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = mode;
  }

  syncStatusBarColor(mode);
  writeCookie(THEME_COOKIE_NAME, mode === "system" ? null : mode);
  notify();
}

export function getAccent(): Accent {
  const { accent } = document.documentElement.dataset;
  return isAccent(accent) ? accent : DEFAULT_ACCENT;
}

export function setAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
  writeCookie(ACCENT_COOKIE_NAME, accent);
  notify();
}

function addStatusBarMeta(background: string, media?: string) {
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.dataset.themeColor = "";
  meta.content = background;
  if (media) meta.media = media;
  // Браузер берёт первый подходящий theme-color и дальше не смотрит — свои теги идут раньше серверных
  document.head.prepend(meta);
}

/*
 * Строка состояния на мобильных красится в meta[name="theme-color"], а его на странице проставил
 * сервер под тему из куки. При переключении без перезагрузки теги нужно проставить самим:
 * серверные остались от прошлого запроса и переписать их нельзя, поэтому свои кладутся перед ними.
 * «Системная» — это пара тегов с медиазапросами: строка состояния пойдёт за настройкой системы
 */
function syncStatusBarColor(mode: ThemeMode) {
  for (const meta of document.head.querySelectorAll("meta[data-theme-color]")) meta.remove();

  if (mode === "system") {
    addStatusBarMeta(THEME_BACKGROUNDS.dark, "(prefers-color-scheme: dark)");
    addStatusBarMeta(THEME_BACKGROUNDS.light, "(prefers-color-scheme: light)");
    return;
  }

  addStatusBarMeta(THEME_BACKGROUNDS[mode]);
}
