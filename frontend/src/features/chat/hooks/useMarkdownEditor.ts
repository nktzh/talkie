import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { applyMarkdownCommand, type MarkdownCommand } from "../lib/markdown";

/** Горячие клавиши совпадают с привычными по текстовым редакторам */
const SHORTCUTS: Record<string, MarkdownCommand> = {
  b: { kind: "wrap", marker: "**", placeholder: "жирный текст" },
  i: { kind: "wrap", marker: "*", placeholder: "курсив" },
  e: { kind: "wrap", marker: "`", placeholder: "код" },
  k: { kind: "link" },
};

interface UseMarkdownEditorOptions {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export interface MarkdownEditor {
  /** Применяет команду панели форматирования к текущему выделению */
  run: (command: MarkdownCommand) => void;
  /** Ctrl/Cmd + B, I, E, K. Возвращает true, если событие обработано */
  handleShortcut: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

/**
 * Команды форматирования поверх обычного textarea.
 * Выделение восстанавливаем после того, как React отрисует новый текст,
 * иначе каретка уезжает в конец строки.
 */
export function useMarkdownEditor({ value, onChange, textareaRef }: UseMarkdownEditorOptions): MarkdownEditor {
  const pendingSelection = useRef<[number, number] | null>(null);

  useEffect(() => {
    const selection = pendingSelection.current;
    if (!selection) return;

    pendingSelection.current = null;
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(selection[0], selection[1]);
  }, [value, textareaRef]);

  function run(command: MarkdownCommand) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const edit = applyMarkdownCommand(command, {
      text: value,
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    });

    pendingSelection.current = [edit.selectionStart, edit.selectionEnd];
    onChange(edit.text);
  }

  function handleShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.ctrlKey && !event.metaKey) return false;

    const command = SHORTCUTS[event.key.toLowerCase()];
    if (!command) return false;

    event.preventDefault();
    run(command);
    return true;
  }

  return { run, handleShortcut };
}
