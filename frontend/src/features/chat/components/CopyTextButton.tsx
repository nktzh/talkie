import { Alert02Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "@/shared/ui";
import styles from "./CopyTextButton.module.css";

const FEEDBACK_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = {
  idle: "Скопировать текст",
  copied: "Скопировано",
  failed: "Не удалось скопировать",
};

const ICONS = {
  idle: Copy01Icon,
  copied: Tick02Icon,
  failed: Alert02Icon,
};

interface CopyTextButtonProps {
  text: string;
  className?: string;
}

/**
 * Копирует текст в буфер обмена. Итог видно по самой кнопке — иконка на пару секунд
 * сменяется галочкой, а при отказе браузера предупреждением; экранный диктор слышит то же самое.
 */
export function CopyTextButton({ text, className }: CopyTextButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;

    const timeoutId = setTimeout(() => setState("idle"), FEEDBACK_MS);
    return () => clearTimeout(timeoutId);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard API недоступен вне защищённого контекста или запрещён браузером
      setState("failed");
    }
  }

  return (
    <button
      type="button"
      className={cn(styles.button, state !== "idle" && styles.done, className)}
      aria-label={LABELS.idle}
      title={LABELS.idle}
      onClick={copy}
    >
      <Icon icon={ICONS[state]} size={17} />
      <span aria-live="polite" className="sr-only">
        {state === "idle" ? "" : LABELS[state]}
      </span>
    </button>
  );
}
