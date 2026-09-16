"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Button, FormAlert, Icon, ModalCloseButton, type IconSvgElement } from "@/shared/ui";
import styles from "./CreateChatPanel.module.css";

interface CreateChatPanelProps {
  titleId: string;
  icon: IconSvgElement;
  title: string;
  description: string;
  submitLabel: string;
  isPending: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Поля формы */
  children: ReactNode;
}

/** Общая оболочка форм создания: шапка с иконкой, поля и кнопка отправки */
export function CreateChatPanel({
  titleId,
  icon,
  title,
  description,
  submitLabel,
  isPending,
  formError,
  onClose,
  onSubmit,
  children,
}: CreateChatPanelProps) {
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.badge}>
          <Icon icon={icon} size={22} />
        </span>
        <div className={styles.heading}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p className={styles.description}>{description}</p>
        </div>
        <ModalCloseButton onClose={onClose} />
      </header>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.fields}>{children}</div>

        {formError && <FormAlert variant="error">{formError}</FormAlert>}

        <Button type="submit" isLoading={isPending} className={styles.submit}>
          {submitLabel}
        </Button>
      </form>
    </div>
  );
}
