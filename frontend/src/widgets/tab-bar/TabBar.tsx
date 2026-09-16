"use client";

import { BubbleChatIcon, ContactBookIcon } from "@hugeicons/core-free-icons";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCurrentUser } from "@/entities/user";
import { countUnreadChats, useChatStore } from "@/features/chat";
import { cn } from "@/shared/lib/cn";
import { Avatar, Icon, LiquidGlass, type IconSvgElement } from "@/shared/ui";
import styles from "./TabBar.module.css";

const CONTACTS_ROUTE = "/app/contacts" satisfies Route;
const ACCOUNT_ROUTE = "/app/account" satisfies Route;
const CHATS_ROUTE = "/app" satisfies Route;

/** Нижняя навигация для мобильных: контакты, чаты, аккаунт */
export function TabBar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { conversations } = useChatStore();
  const { user } = useCurrentUser();

  // Всё, что не контакты и не аккаунт, относится к чатам — включая открытый диалог /app/<id>
  const isContacts = pathname.startsWith(CONTACTS_ROUTE);
  const isAccount = pathname.startsWith(ACCOUNT_ROUTE);
  const unreadChats = countUnreadChats(conversations);

  return (
    <LiquidGlass radius={999} className={cn(styles.bar, className)}>
      <nav className={styles.tabs} aria-label="Основная навигация">
        <Tab href={CONTACTS_ROUTE} label="Контакты" icon={ContactBookIcon} isActive={isContacts} />
        <Tab
          href={CHATS_ROUTE}
          label="Чаты"
          icon={BubbleChatIcon}
          isActive={!isContacts && !isAccount}
          badge={unreadChats > 0 ? unreadChats : undefined}
        />
        <Tab
          href={ACCOUNT_ROUTE}
          label="Аккаунт"
          isActive={isAccount}
          glyph={<Avatar id={user.id} name={user.displayName} size={22} />}
        />
      </nav>
    </LiquidGlass>
  );
}

interface TabProps {
  href: Route;
  label: string;
  isActive: boolean;
  icon?: IconSvgElement;
  /** Вместо иконки — произвольный элемент, например аватар */
  glyph?: ReactNode;
  badge?: number;
}

function Tab({ href, label, isActive, icon, glyph, badge }: TabProps) {
  return (
    <Link
      href={href}
      // Страницы вкладок лёгкие и берут данные из сторов: загружаем их целиком заранее,
      // иначе переход ждал бы сервер за скелетом из loading.tsx
      prefetch
      className={cn(styles.tab, isActive && styles.active)}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={styles.glyph}>
        {glyph ?? (icon && <Icon icon={icon} size={22} />)}
        {badge !== undefined && (
          <span className={styles.badge}>
            {badge}
            <span className="sr-only"> непрочитанных чатов</span>
          </span>
        )}
      </span>
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
