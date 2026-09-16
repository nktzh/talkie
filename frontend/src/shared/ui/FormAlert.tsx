import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon } from "./Icon";
import styles from "./FormAlert.module.css";

interface FormAlertProps {
  variant: "error" | "success";
  children: ReactNode;
  className?: string;
}

export function FormAlert({ variant, children, className }: FormAlertProps) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn(styles.alert, styles[variant], className)}>
      <Icon icon={variant === "error" ? Alert02Icon : CheckmarkCircle02Icon} size={18} />
      <span>{children}</span>
    </div>
  );
}
