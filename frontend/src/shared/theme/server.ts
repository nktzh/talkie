import { cookies } from "next/headers";
import { THEME_COOKIE_NAME, isTheme, type Theme } from "./constants";

/** Тема, явно выбранная пользователем. null — следуем системной настройке */
export async function getPreferredTheme(): Promise<Theme | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;
  return isTheme(value) ? value : null;
}
