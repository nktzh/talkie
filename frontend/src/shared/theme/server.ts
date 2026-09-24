import { cookies } from "next/headers";
import {
  ACCENT_COOKIE_NAME,
  DEFAULT_ACCENT,
  THEME_COOKIE_NAME,
  isAccent,
  isTheme,
  type Accent,
  type Theme,
} from "./constants";

/** Тема, явно выбранная пользователем. null — следуем системной настройке */
export async function getPreferredTheme(): Promise<Theme | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;
  return isTheme(value) ? value : null;
}

/** Цвет оформления. Системной настройки для него нет, поэтому без выбора — цвет бренда */
export async function getPreferredAccent(): Promise<Accent> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACCENT_COOKIE_NAME)?.value;
  return isAccent(value) ? value : DEFAULT_ACCENT;
}
