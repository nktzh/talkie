"use client";

import { ArrowRight01Icon, Logout03Icon, Ticket01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useCurrentUser } from "@/entities/user";
import { InviteModal } from "@/features/invite";
import { StatusEmoji } from "@/shared/emoji";
import { cn } from "@/shared/lib/cn";
import { Avatar, Icon, type IconSvgElement } from "@/shared/ui";
import { SETTINGS_TABS } from "../config/tabs";
import styles from "./AccountPanel.module.css";

/**
 * Вкладка «Аккаунт» на мобильных: пункты настроек — список кнопок,
 * содержимое каждого пункта открывается отдельной страницей.
 */
export function AccountPanel() {
  const { user } = useCurrentUser();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <Avatar id={user.id} name={user.displayName} src={user.avatarUrl} size={72} />
        <h1 className={styles.name}>
          {user.displayName}
          {user.status && <StatusEmoji status={user.status} size={18} className={styles.nameStatus} />}
        </h1>
        <p className={styles.username}>@{user.username}</p>
      </header>

      <ul role="list" className={styles.group}>
        {SETTINGS_TABS.map((tab) => (
          <li key={tab.id}>
            {/* Разделы настроек не ходят за данными — загружаем целиком заранее, чтобы открывались без скелета */}
            <Link href={`/app/account/${tab.id}`} prefetch className={styles.row}>
              <RowContent icon={tab.icon} label={tab.label} description={tab.description} />
              <Icon icon={ArrowRight01Icon} size={18} className={styles.chevron} />
            </Link>
          </li>
        ))}
      </ul>

      <ul role="list" className={styles.group}>
        <li>
          <button
            type="button"
            className={styles.row}
            aria-haspopup="dialog"
            onClick={() => setIsInviteOpen(true)}
          >
            <RowContent icon={Ticket01Icon} label="Пригласительный код" />
            <Icon icon={ArrowRight01Icon} size={18} className={styles.chevron} />
          </button>
        </li>
      </ul>

      <ul role="list" className={styles.group}>
        <li>
          <Link href="/app/auth" className={cn(styles.row, styles.danger)}>
            <RowContent icon={Logout03Icon} label="Выйти" />
          </Link>
        </li>
      </ul>

      <InviteModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}

interface RowContentProps {
  icon: IconSvgElement;
  label: string;
  description?: string;
}

function RowContent({ icon, label, description }: RowContentProps): ReactNode {
  return (
    <>
      <span className={styles.rowIcon}>
        <Icon icon={icon} size={20} />
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        {description && <span className={styles.rowDescription}>{description}</span>}
      </span>
    </>
  );
}
