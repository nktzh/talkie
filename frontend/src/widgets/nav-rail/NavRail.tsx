"use client";

import { ContactBookIcon, Logout03Icon, Ticket01Icon } from "@hugeicons/core-free-icons";
import { useState, type ComponentProps } from "react";
import { CHAT_FOLDERS, countUnreadChats, useChatStore } from "@/features/chat";
import { ContactsModal } from "@/features/contacts";
import { InviteModal } from "@/features/invite";
import { AccountButton } from "@/features/settings";
import { cn } from "@/shared/lib/cn";
import { ThemeToggle } from "@/shared/theme";
import { Icon, IconLink, Logo, type IconSvgElement } from "@/shared/ui";
import styles from "./NavRail.module.css";

/** Узкая навигационная панель у левого края (десктоп): контакты, приглашение, папки чатов, тема, выход, аккаунт */
export function NavRail() {
  const { conversations, activeFolderId, selectFolder } = useChatStore();
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <nav className={styles.rail} aria-label="Основная навигация">
      <Logo size={28} className={styles.logo} />

      <NavItem
        icon={ContactBookIcon}
        label="Контакты"
        aria-haspopup="dialog"
        onClick={() => setIsContactsOpen(true)}
      />
      <ContactsModal open={isContactsOpen} onClose={() => setIsContactsOpen(false)} />

      <NavItem
        icon={Ticket01Icon}
        label="Пригласить"
        title="Пригласительный код"
        aria-haspopup="dialog"
        onClick={() => setIsInviteOpen(true)}
      />
      <InviteModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

      <hr className={styles.divider} />

      <ul role="list" className={styles.folders} aria-label="Папки чатов">
        {CHAT_FOLDERS.map((folder) => {
          const isActive = folder.id === activeFolderId;
          const unreadChats = countUnreadChats(conversations, folder);

          return (
            <li key={folder.id}>
              <NavItem
                icon={folder.icon}
                label={folder.label}
                title={folder.title}
                isActive={isActive}
                aria-pressed={isActive}
                badge={unreadChats > 0 ? unreadChats : undefined}
                onClick={() => selectFolder(folder.id)}
              />
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <ThemeToggle />
        <IconLink href="/app/auth" label="Выйти">
          <Icon icon={Logout03Icon} size={22} />
        </IconLink>
        <div className={styles.account}>
          <AccountButton />
        </div>
      </div>
    </nav>
  );
}

type NavItemProps = ComponentProps<"button"> & {
  icon: IconSvgElement;
  label: string;
  isActive?: boolean;
  /** Количество непрочитанных чатов */
  badge?: number;
};

function NavItem({ icon, label, title = label, isActive = false, badge, ...props }: NavItemProps) {
  return (
    <button
      type="button"
      className={cn(styles.item, isActive && styles.active)}
      title={title}
      {...props}
    >
      <span className={styles.itemIcon}>
        <Icon icon={icon} size={22} />
        {badge !== undefined && (
          <span className={styles.badge}>
            {badge}
            <span className="sr-only"> непрочитанных чатов</span>
          </span>
        )}
      </span>
      <span className={styles.itemLabel}>{label}</span>
    </button>
  );
}
