"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, type MouseEvent, type PointerEvent, type ReactNode, type SyntheticEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id заголовка внутри модалки — для доступного имени диалога */
  labelledBy: string;
  /** sheet — на мобильных превращается в лист, выезжающий снизу */
  size?: "md" | "lg" | "sheet";
  className?: string;
  children: ReactNode;
}

/**
 * Модальное окно на нативном <dialog>: ловушку фокуса, Esc и верхний слой даёт браузер.
 * Содержимое монтируется только в открытом состоянии, поэтому формы внутри сбрасываются при закрытии.
 */
export function Modal({ open, onClose, labelledBy, size = "md", className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isPointerDownOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Нативное событие close не всплывает, а синтетическое в React — всплывает.
  // Без этой проверки закрытие вложенной модалки закрыло бы и внешнюю.
  function handleClose(event: SyntheticEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  // Закрываем по клику на подложку, но не когда выделение текста началось внутри окна
  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    isPointerDownOnBackdrop.current = event.target === event.currentTarget;
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (isPointerDownOnBackdrop.current && event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className={cn(styles.dialog, styles[size], className)}
      onClose={handleClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {open && children}
    </dialog>
  );
}

export function ModalCloseButton({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <IconButton label="Закрыть" onClick={onClose} className={className}>
      <Icon icon={Cancel01Icon} size={20} />
    </IconButton>
  );
}
