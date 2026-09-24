"use client";

import { ComputerIcon, Moon02Icon, Sun03Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useSyncExternalStore } from "react";
import { ACCENTS, DEFAULT_ACCENT, type Accent } from "@/shared/theme";
import {
  getAccent,
  getThemeMode,
  setAccent,
  setThemeMode,
  subscribeToPreferences,
  type ThemeMode,
} from "@/shared/theme/preferences";
import { Icon, type IconSvgElement } from "@/shared/ui";
import styles from "./AppearanceSettings.module.css";

const THEME_MODES: readonly { id: ThemeMode; label: string; icon: IconSvgElement }[] = [
  { id: "light", label: "Светлая", icon: Sun03Icon },
  { id: "dark", label: "Тёмная", icon: Moon02Icon },
  { id: "system", label: "Системная", icon: ComputerIcon },
];

const getServerThemeMode = (): ThemeMode => "system";
const getServerAccent = (): Accent => DEFAULT_ACCENT;

/**
 * Тема и цвет оформления. Выбранное подсвечивает CSS по data-theme и data-accent на <html> —
 * подсветка верна с первого кадра, ещё до гидратации. Те же атрибуты читаются здесь ради
 * aria-pressed: скринридер должен говорить то же, что показывает картинка.
 */
export function AppearanceSettings() {
  const mode = useSyncExternalStore(subscribeToPreferences, getThemeMode, getServerThemeMode);
  const accent = useSyncExternalStore(subscribeToPreferences, getAccent, getServerAccent);

  return (
    <div className={styles.stack}>
      <section className={styles.group}>
        <h3 className={styles.title}>Тема</h3>
        <div role="group" aria-label="Тема" className={styles.modes}>
          {THEME_MODES.map((themeMode) => (
            <button
              key={themeMode.id}
              type="button"
              aria-pressed={themeMode.id === mode}
              data-mode={themeMode.id}
              className={styles.mode}
              onClick={() => setThemeMode(themeMode.id)}
            >
              <Icon icon={themeMode.icon} size={22} />
              {themeMode.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Цвет оформления</h3>
        <p className={styles.hint}>Красит акценты, аватары и исходящие сообщения</p>
        <div role="group" aria-label="Цвет оформления" className={styles.accents}>
          {ACCENTS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === accent}
              // Тот же атрибут, что и на <html>: образец красится своей палитрой, а не текущей
              data-accent={option.id}
              className={styles.accent}
              onClick={() => setAccent(option.id)}
            >
              <span className={styles.swatch}>
                <Icon icon={Tick02Icon} size={20} className={styles.swatchCheck} />
              </span>
              <span className={styles.accentLabel}>{option.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Предпросмотр</h3>
        <div className={styles.preview} aria-hidden="true">
          <p className={styles.bubbleIn}>Поменял оформление, посмотри</p>
          <p className={styles.bubbleOut}>Вижу! Градиент сверху вниз — красиво</p>
        </div>
      </section>
    </div>
  );
}
