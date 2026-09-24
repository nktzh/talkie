"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, Modal, ModalCloseButton } from "@/shared/ui";
import { EMOJI_PALETTE, isSameEmoji } from "./palette";
import styles from "./StatusPicker.module.css";

/** Столько же колонок задано в CSS: по ним стрелки вверх и вниз прыгают через строку */
const COLUMNS = 8;

interface StatusPickerProps {
  open: boolean;
  /** Заголовок окна: чему выбирают статус — профилю, группе или каналу */
  title: string;
  description?: string;
  /** Текущий статус; undefined — статуса нет */
  value?: string;
  /** Выбранное эмодзи или null, если статус убрали. Окно закрывает вызывающая сторона */
  onSelect: (status: string | null) => void;
  onClose: () => void;
}

/**
 * Выбор статуса: вся палитра эмодзи в одном окне. Сохранение — на вызывающей стороне,
 * поэтому окно ничего не ждёт и закрывается сразу после выбора.
 */
export function StatusPicker({ open, title, description, value, onSelect, onClose }: StatusPickerProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="sheet">
      <div className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <ModalCloseButton onClose={onClose} />
        </header>

        <StatusGrid label={title} value={value} onSelect={onSelect} />

        {value && (
          <Button variant="secondary" className={styles.clear} onClick={() => onSelect(null)}>
            Убрать статус
          </Button>
        )}
      </div>
    </Modal>
  );
}

/** Сетка палитры ведёт себя как группа радиокнопок: Tab входит в неё один раз, дальше — стрелки */
function StatusGrid({
  label,
  value,
  onSelect,
}: {
  label: string;
  value?: string;
  onSelect: (status: string | null) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const selectedIndex = value ? EMOJI_PALETTE.findIndex((item) => isSameEmoji(item.emoji, value)) : -1;
  // Tab приводит к текущему статусу, а если его нет — к началу палитры
  const [activeIndex, setActiveIndex] = useState(Math.max(selectedIndex, 0));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = gridRef.current ? Array.from(gridRef.current.querySelectorAll("button")) : [];
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;

    const lastIndex = buttons.length - 1;
    let target: number;

    switch (event.key) {
      case "ArrowRight":
        target = Math.min(index + 1, lastIndex);
        break;
      case "ArrowLeft":
        target = Math.max(index - 1, 0);
        break;
      case "ArrowDown":
        target = Math.min(index + COLUMNS, lastIndex);
        break;
      case "ArrowUp":
        target = Math.max(index - COLUMNS, 0);
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = lastIndex;
        break;
      default:
        return;
    }

    event.preventDefault();
    buttons[target].focus();
  }

  return (
    <div ref={gridRef} role="radiogroup" aria-label={label} className={styles.grid} onKeyDown={handleKeyDown}>
      {EMOJI_PALETTE.map(({ emoji, name }, index) => {
        const isSelected = index === selectedIndex;

        return (
          <button
            key={emoji}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={name}
            title={name}
            tabIndex={index === activeIndex ? 0 : -1}
            className={cn(styles.emoji, isSelected && styles.selected)}
            onFocus={() => setActiveIndex(index)}
            // Повторный выбор того же эмодзи убирает статус — как снятие своей реакции
            onClick={() => onSelect(isSelected ? null : emoji)}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
