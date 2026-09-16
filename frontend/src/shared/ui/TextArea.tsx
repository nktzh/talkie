"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./TextArea.module.css";

type TextAreaProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Многострочное поле: та же рамка и подписи, что у TextField */
export function TextArea({ label, hint, error, rows = 3, className, ...textareaProps }: TextAreaProps) {
  const id = useId();

  const description = error ?? hint;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div className={cn(styles.control, error && styles.invalid)}>
        <textarea
          id={id}
          rows={rows}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          {...textareaProps}
        />
      </div>

      {description && (
        <p id={descriptionId} className={cn(styles.description, error && styles.error)}>
          {description}
        </p>
      )}
    </div>
  );
}
