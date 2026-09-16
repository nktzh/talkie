"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { getContextMenuItems, Icon, useCloseContextMenu } from "@/shared/ui";
import { QUICK_REACTIONS, QUICK_REACTIONS_COUNT, REACTION_PALETTE } from "../config/reactions";
import { isSameEmoji } from "../lib/reactions";
import styles from "./ReactionPicker.module.css";

/** Столько же колонок задано в CSS: по ним стрелки вверх и вниз прыгают через строку */
const COLUMNS = 8;

interface ReactionPickerProps {
  /** Эмодзи, которые уже поставил текущий пользователь, — подсвечиваются */
  ownReactions: readonly string[];
  onSelect: (emoji: string) => void;
}

/**
 * Палитра реакций вверху контекстного меню: быстрая строка и кнопка, раскрывающая все эмодзи.
 * Живёт внутри ContextMenu и ведёт себя как его пункты: стрелки, Escape, закрытие после выбора
 */
export function ReactionPicker({ ownReactions, onSelect }: ReactionPickerProps) {
  const close = useCloseContextMenu();
  const gridRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const items = isExpanded ? REACTION_PALETTE : QUICK_REACTIONS;
  /** Фокус был на кнопке «Все реакции». После касания на телефоне его там нет — и переводить не нужно */
  const hadFocusRef = useRef(false);

  // Кнопка «Все реакции» исчезает вместе с фокусом — передаём его эмодзи, вставшему на её место
  useEffect(() => {
    if (isExpanded && hadFocusRef.current) {
      getButtons(gridRef.current)[QUICK_REACTIONS_COUNT]?.focus({ preventScroll: true });
    }
  }, [isExpanded]);

  function select(event: MouseEvent<HTMLButtonElement>, emoji: string) {
    // Как у обычных пунктов: фокус возвращаем, только если выбрали с клавиатуры
    close(event.detail === 0);
    onSelect(emoji);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const grid = gridRef.current;
    const buttons = getButtons(grid);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (!grid || index === -1) return;

    const lastIndex = buttons.length - 1;
    const isFirstRow = index < COLUMNS;
    const isLastRow = Math.floor(index / COLUMNS) === Math.floor(lastIndex / COLUMNS);
    let target: HTMLElement | undefined;

    switch (event.key) {
      case "ArrowRight":
        target = buttons[Math.min(index + 1, lastIndex)];
        break;
      case "ArrowLeft":
        target = buttons[Math.max(index - 1, 0)];
        break;
      case "ArrowDown":
        // С последней строки — к пунктам меню под палитрой
        target = isLastRow ? getMenuItemsOutside(grid)[0] : buttons[Math.min(index + COLUMNS, lastIndex)];
        break;
      case "ArrowUp":
        // С первой строки — по кругу к последнему пункту меню
        target = isFirstRow ? getMenuItemsOutside(grid).at(-1) : buttons[index - COLUMNS];
        break;
      default:
        return;
    }

    event.preventDefault();
    target?.focus();
  }

  return (
    <div
      ref={gridRef}
      role="group"
      aria-label="Реакции"
      className={cn(styles.grid, isExpanded && styles.expanded)}
      onKeyDown={handleKeyDown}
    >
      {items.map(({ emoji, name }) => {
        const isOwn = ownReactions.some((item) => isSameEmoji(item, emoji));

        return (
          <button
            key={emoji}
            type="button"
            role="menuitemcheckbox"
            aria-checked={isOwn}
            aria-label={name}
            title={name}
            tabIndex={-1}
            className={cn(styles.emoji, isOwn && styles.own)}
            onClick={(event) => select(event, emoji)}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        );
      })}

      {!isExpanded && (
        <button
          type="button"
          role="menuitem"
          aria-expanded={false}
          aria-label="Все реакции"
          title="Все реакции"
          tabIndex={-1}
          className={cn(styles.emoji, styles.expand)}
          onClick={(event) => {
            hadFocusRef.current = document.activeElement === event.currentTarget;
            setIsExpanded(true);
          }}
        >
          <Icon icon={ArrowDown01Icon} size={18} />
        </button>
      )}
    </div>
  );
}

function getButtons(grid: HTMLElement | null): HTMLButtonElement[] {
  return grid ? Array.from(grid.querySelectorAll("button")) : [];
}

/** Пункты меню за пределами палитры: на них уходит фокус со стрелок у её краёв */
function getMenuItemsOutside(grid: HTMLElement): HTMLButtonElement[] {
  return getContextMenuItems(grid.closest('[role="menu"]')).filter((item) => !grid.contains(item));
}
