"use client";

import { Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { useRef, type KeyboardEvent } from "react";
import { Icon, LiquidGlass } from "@/shared/ui";
import styles from "./ChatSearch.module.css";

interface ChatSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChatSearch({ value, onChange }: ChatSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && value) {
      event.preventDefault();
      onChange("");
    }
  }

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    // Настройки стекла — общие по умолчанию, как у поля ввода сообщения
    <LiquidGlass className={styles.glass}>
      <div className={styles.search}>
        <Icon icon={Search01Icon} size={18} className={styles.icon} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск"
          aria-label="Поиск по чатам"
          autoComplete="off"
          spellCheck={false}
          className={styles.input}
        />
        {value && (
          <button type="button" className={styles.clear} onClick={clear} aria-label="Очистить поиск">
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        )}
      </div>
    </LiquidGlass>
  );
}
