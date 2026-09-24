"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Icon, IconButton } from "@/shared/ui";
import { getActiveTheme, setThemeMode } from "./preferences";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle({ className }: { className?: string }) {
  function toggleTheme() {
    setThemeMode(getActiveTheme() === "dark" ? "light" : "dark");
  }

  return (
    <IconButton label="Сменить тему" onClick={toggleTheme} className={className}>
      {/* Нужная иконка выбирается в CSS, чтобы не было расхождений при гидратации */}
      <Icon icon={Moon02Icon} size={22} className={styles.moon} />
      <Icon icon={Sun03Icon} size={22} className={styles.sun} />
    </IconButton>
  );
}
