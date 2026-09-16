"use client";

import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconSvgElement } from "./Icon";
import styles from "./TextField.module.css";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  icon?: IconSvgElement;
  hint?: string;
  error?: string;
};

export function TextField({ label, icon, hint, error, type = "text", className, ...inputProps }: TextFieldProps) {
  const id = useId();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = type === "password";
  const description = error ?? hint;
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div className={cn(styles.control, error && styles.invalid)}>
        {icon && <Icon icon={icon} size={18} className={styles.icon} />}
        <input
          id={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={descriptionId}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.reveal}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
            aria-pressed={isPasswordVisible}
          >
            <Icon icon={isPasswordVisible ? ViewOffSlashIcon : ViewIcon} size={18} />
          </button>
        )}
      </div>

      {description && (
        <p id={descriptionId} className={cn(styles.description, error && styles.error)}>
          {description}
        </p>
      )}
    </div>
  );
}
