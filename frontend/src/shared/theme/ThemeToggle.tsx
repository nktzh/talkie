"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Icon, IconButton } from "@/shared/ui";
import { THEME_COOKIE_NAME, isTheme, type Theme } from "./constants";
import styles from "./ThemeToggle.module.css";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

function getActiveTheme(): Theme {
  const { theme } = document.documentElement.dataset;
  if (isTheme(theme)) return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    const nextTheme: Theme = getActiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    // Кука нужна, чтобы сервер сразу отрисовал выбранную тему без мигания при загрузке
    document.cookie = `${THEME_COOKIE_NAME}=${nextTheme}; path=/; max-age=${ONE_YEAR_IN_SECONDS}; samesite=lax`;
  }

  return (
    <IconButton label="Сменить тему" onClick={toggleTheme} className={className}>
      {/* Нужная иконка выбирается в CSS, чтобы не было расхождений при гидратации */}
      <Icon icon={Moon02Icon} size={22} className={styles.moon} />
      <Icon icon={Sun03Icon} size={22} className={styles.sun} />
    </IconButton>
  );
}
