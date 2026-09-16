import { AlertCircleIcon, Clock01Icon, Tick02Icon, TickDouble02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/lib/cn";
import { Icon, type IconSvgElement } from "@/shared/ui";
import type { MessageStatus } from "../model/types";
import styles from "./MessageStatusIcon.module.css";

const STATUS_META: Record<MessageStatus, { icon: IconSvgElement; label: string }> = {
  sending: { icon: Clock01Icon, label: "Отправляется" },
  sent: { icon: Tick02Icon, label: "Отправлено" },
  read: { icon: TickDouble02Icon, label: "Прочитано" },
  failed: { icon: AlertCircleIcon, label: "Не удалось отправить" },
};

interface MessageStatusIconProps {
  status: MessageStatus;
  size?: number;
  className?: string;
}

export function MessageStatusIcon({ status, size = 16, className }: MessageStatusIconProps) {
  const { icon, label } = STATUS_META[status];

  return (
    <Icon
      icon={icon}
      size={size}
      role="img"
      aria-hidden={false}
      aria-label={label}
      className={cn(className, status === "failed" && styles.failed)}
    />
  );
}
