"use client";

import { useId, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  /** Необратимое действие подсвечивается красным */
  isDanger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  /** Дополнительные параметры действия под описанием — например, флажок */
  children?: ReactNode;
}

/** Короткий диалог «точно?» перед действием, которое нельзя отменить */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  isDanger = false,
  isPending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
        {children}
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.action} disabled={isPending} onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            className={styles.action}
            isLoading={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
