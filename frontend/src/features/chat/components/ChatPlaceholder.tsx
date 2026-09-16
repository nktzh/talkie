import { Alert02Icon, BubbleChatIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconSvgElement } from "@/shared/ui";
import styles from "./ChatPlaceholder.module.css";

interface ChatPlaceholderProps {
  icon: IconSvgElement;
  title: string;
  description: string;
  action?: ReactNode;
  /** true — экран относится к конкретному чату, и на мобильных вместо него не нужно показывать список */
  isChatRoute?: boolean;
}

function ChatPlaceholder({ icon, title, description, action, isChatRoute = false }: ChatPlaceholderProps) {
  return (
    <div className={styles.placeholder} data-chat-open={isChatRoute || undefined}>
      <span className={styles.icon}>
        <Icon icon={icon} size={30} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {action}
    </div>
  );
}

export function ChatEmptyState() {
  return (
    <ChatPlaceholder
      icon={BubbleChatIcon}
      title="Выберите чат"
      description="Откройте диалог из списка, чтобы продолжить общение"
    />
  );
}

export function ChatNotFound() {
  return (
    <ChatPlaceholder
      icon={Alert02Icon}
      title="Чат не найден"
      description="Возможно, он был удалён или ссылка устарела"
      isChatRoute
      action={
        <Link href="/app" className={styles.action}>
          Вернуться к чатам
        </Link>
      }
    />
  );
}
