import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, LiquidGlass, type IconSvgElement } from "@/shared/ui";
import styles from "./ChatFooterButton.module.css";

type ChatFooterButtonProps = ComponentProps<"button"> & {
  icon: IconSvgElement;
};

/** Действие на месте поля ввода: им заменяется композер, когда писать нельзя */
export function ChatFooterButton({ icon, className, children, ...props }: ChatFooterButtonProps) {
  return (
    <div className={styles.footer}>
      <LiquidGlass radius={24} className={styles.glass}>
        <button type="button" className={cn(styles.button, className)} {...props}>
          <Icon icon={icon} size={20} />
          {children}
        </button>
      </LiquidGlass>
    </div>
  );
}
