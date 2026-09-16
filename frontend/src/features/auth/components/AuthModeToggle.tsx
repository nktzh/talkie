"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import type { AuthMode } from "../types";
import styles from "./AuthModeToggle.module.css";

const MODES: ReadonlyArray<{ value: AuthMode; label: string }> = [
  { value: "login", label: "Вход" },
  { value: "register", label: "Регистрация" },
];

export function getAuthTabId(mode: AuthMode): string {
  return `auth-tab-${mode}`;
}

interface AuthModeToggleProps {
  value: AuthMode;
  onChange: (mode: AuthMode) => void;
  panelId: string;
}

export function AuthModeToggle({ value, onChange, panelId }: AuthModeToggleProps) {
  // Стрелки переключают вкладки — стандартное поведение tablist для клавиатуры
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const nextMode: AuthMode = value === "login" ? "register" : "login";
    onChange(nextMode);
    document.getElementById(getAuthTabId(nextMode))?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Вход или регистрация"
      className={styles.toggle}
      data-mode={value}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {MODES.map((mode) => {
        const isSelected = mode.value === value;

        return (
          <button
            key={mode.value}
            id={getAuthTabId(mode.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={panelId}
            tabIndex={isSelected ? 0 : -1}
            className={cn(styles.tab, isSelected && styles.selected)}
            onClick={() => onChange(mode.value)}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
