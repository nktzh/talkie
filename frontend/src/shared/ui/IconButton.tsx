import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./IconButton.module.css";

type IconButtonProps = ComponentProps<"button"> & {
  /** Обязательная подпись: у кнопки нет видимого текста */
  label: string;
};

export function IconButton({ label, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(styles.iconButton, className)}
      {...props}
    />
  );
}

type IconLinkProps = ComponentProps<typeof Link> & {
  label: string;
};

export function IconLink({ label, className, ...props }: IconLinkProps) {
  return <Link aria-label={label} title={label} className={cn(styles.iconButton, className)} {...props} />;
}
