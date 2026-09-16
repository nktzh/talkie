"use client";

import {
  CodeIcon,
  GridTableIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  QuoteDownIcon,
  SourceCodeIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconSvgElement } from "@/shared/ui";
import type { MarkdownEditor } from "../hooks/useMarkdownEditor";
import type { MarkdownCommand } from "../lib/markdown";
import { MarkdownTableGrid } from "./MarkdownTableGrid";
import styles from "./MarkdownToolbar.module.css";

interface ToolbarButton {
  icon: IconSvgElement;
  label: string;
  command: MarkdownCommand;
}

/** Кнопки, которые просто применяют команду; сгруппированы так же, как выглядят в панели */
const BUTTON_GROUPS: ToolbarButton[][] = [
  [
    { icon: TextBoldIcon, label: "Жирный (Ctrl+B)", command: { kind: "wrap", marker: "**", placeholder: "жирный текст" } },
    { icon: TextItalicIcon, label: "Курсив (Ctrl+I)", command: { kind: "wrap", marker: "*", placeholder: "курсив" } },
    {
      icon: TextStrikethroughIcon,
      label: "Зачёркнутый",
      command: { kind: "wrap", marker: "~~", placeholder: "зачёркнутый текст" },
    },
  ],
  [
    { icon: CodeIcon, label: "Код в строке (Ctrl+E)", command: { kind: "wrap", marker: "`", placeholder: "код" } },
    { icon: SourceCodeIcon, label: "Блок кода", command: { kind: "code-block" } },
    { icon: QuoteDownIcon, label: "Цитата", command: { kind: "quote" } },
  ],
  [
    { icon: LeftToRightListBulletIcon, label: "Маркированный список", command: { kind: "bullet-list" } },
    { icon: LeftToRightListNumberIcon, label: "Нумерованный список", command: { kind: "ordered-list" } },
    { icon: Link01Icon, label: "Ссылка (Ctrl+K)", command: { kind: "link" } },
  ],
];

const HEADING_LEVELS = [
  { level: 1, icon: Heading01Icon, label: "Заголовок 1" },
  { level: 2, icon: Heading02Icon, label: "Заголовок 2" },
  { level: 3, icon: Heading03Icon, label: "Заголовок 3" },
] as const;

interface MarkdownToolbarProps {
  editor: MarkdownEditor;
  isPreview: boolean;
  onTogglePreview: () => void;
}

export function MarkdownToolbar({ editor, isPreview, onTogglePreview }: MarkdownToolbarProps) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Форматирование">
      <div className={styles.tools}>
        <ToolbarMenu icon={Heading01Icon} label="Заголовок" disabled={isPreview}>
          {(close) => (
            <div className={styles.headingMenu}>
              {HEADING_LEVELS.map(({ level, icon, label }) => (
                <button
                  key={level}
                  type="button"
                  className={styles.headingItem}
                  onClick={() => {
                    editor.run({ kind: "heading", level });
                    close();
                  }}
                >
                  <Icon icon={icon} size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </ToolbarMenu>

        {BUTTON_GROUPS.map((group, index) => (
          <div key={index} className={styles.group}>
            {group.map(({ icon, label, command }) => (
              <button
                key={label}
                type="button"
                className={styles.tool}
                title={label}
                aria-label={label}
                disabled={isPreview}
                onClick={() => editor.run(command)}
              >
                <Icon icon={icon} size={18} />
              </button>
            ))}
          </div>
        ))}

        <ToolbarMenu icon={GridTableIcon} label="Таблица" disabled={isPreview}>
          {(close) => (
            <MarkdownTableGrid
              onPick={(rows, columns) => {
                editor.run({ kind: "table", rows, columns });
                close();
              }}
            />
          )}
        </ToolbarMenu>
      </div>

      <button
        type="button"
        className={cn(styles.preview, isPreview && styles.previewActive)}
        aria-pressed={isPreview}
        onClick={onTogglePreview}
      >
        <Icon icon={isPreview ? ViewOffIcon : ViewIcon} size={18} />
        <span className={styles.previewLabel}>{isPreview ? "Правка" : "Просмотр"}</span>
      </button>
    </div>
  );
}

interface ToolbarMenuProps {
  icon: IconSvgElement;
  label: string;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
}

/** Кнопка с всплывающей панелью: закрывается по Escape и по клику мимо */
function ToolbarMenu({ icon, label, disabled, children }: ToolbarMenuProps) {
  const [isRequested, setIsRequested] = useState(false);
  // Панель форматирования гаснет вместе с режимом предпросмотра — меню не должно «зависнуть» открытым
  const isOpen = isRequested && !disabled;
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsRequested(false);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsRequested(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={styles.menu}>
      <button
        type="button"
        className={cn(styles.tool, isOpen && styles.toolActive)}
        title={label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        disabled={disabled}
        onClick={() => setIsRequested((open) => !open)}
      >
        <Icon icon={icon} size={18} />
      </button>

      {isOpen && (
        <div id={popoverId} className={styles.popover} role="dialog" aria-label={label}>
          {children(() => setIsRequested(false))}
        </div>
      )}
    </div>
  );
}
