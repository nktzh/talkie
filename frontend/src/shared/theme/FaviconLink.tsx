"use client";

import { useSyncExternalStore } from "react";
import { buildIconHref, type Accent, type Theme } from "./constants";
import { getAccent, getThemeMode, subscribeToPreferences } from "./preferences";

function getIconHref(): string {
  const mode = getThemeMode();
  return buildIconHref(mode === "system" ? null : mode, getAccent());
}

/**
 * Иконка вкладки: знак в акцентном цвете пользователя. Тег рисует React, а не метаданные Next, —
 * тогда при смене темы или цвета адрес меняется сразу, без перезагрузки. Подменить тег метаданных
 * своими руками нельзя: при переходах Next возвращает на место свой, с цветом на момент загрузки.
 *
 * Тему и цвет сервер берёт из куки, поэтому в разметке сразу нужная иконка, без мигания
 */
export function FaviconLink({ theme, accent }: { theme: Theme | null; accent: Accent }) {
  const href = useSyncExternalStore(subscribeToPreferences, getIconHref, () =>
    buildIconHref(theme, accent),
  );

  // Тег объявлен в вёрстке страницы, а в <head> его поднимает React
  return <link rel="icon" type="image/svg+xml" href={href} />;
}
