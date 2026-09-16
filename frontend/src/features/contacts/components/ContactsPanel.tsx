"use client";

import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useDirectChat } from "@/features/chat";
import { cn } from "@/shared/lib/cn";
import { usePrefetchOnIntent } from "@/shared/lib/usePrefetchOnIntent";
import { Avatar, Button, Icon, Logo } from "@/shared/ui";
import { useContactsStore } from "../model/contacts-store";
import type { Contact } from "../types";
import { AddContactModal } from "./AddContactModal";
import styles from "./ContactsPanel.module.css";

interface ContactsPanelProps {
  titleId: string;
  action?: ReactNode;
  /** Вызывается при переходе в чат — десктопной модалке пора закрыться */
  onOpenChat?: () => void;
}

/** Содержимое раздела «Контакты»: на десктопе живёт в модалке, на мобильных — во вкладке */
export function ContactsPanel({ titleId, action, onOpenChat }: ContactsPanelProps) {
  const { contacts } = useContactsStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Logo size={28} className={styles.logo} />
          <h2 id={titleId} className={styles.title}>
            Контакты
          </h2>
        </div>
        {action}
      </header>

      <Button className={styles.add} aria-haspopup="dialog" onClick={() => setIsAddOpen(true)}>
        <Icon icon={UserAdd01Icon} size={20} />
        Новый контакт
      </Button>

      {contacts.length > 0 ? (
        <ul role="list" className={styles.list}>
          {contacts.map((contact) => (
            <li key={contact.id}>
              <ContactRow contact={contact} onOpenChat={onOpenChat} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>Пока никого нет — добавьте первого собеседника</p>
      )}

      <AddContactModal open={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </section>
  );
}

/**
 * Контакт ведёт прямо в переписку с ним. Если чат уже заведён — это обычная ссылка,
 * которую можно открыть в новой вкладке; если нет — чат создаётся по клику.
 */
function ContactRow({ contact, onOpenChat }: { contact: Contact; onOpenChat?: () => void }) {
  const { id, displayName, username } = contact;
  const { href, open, isPending } = useDirectChat({ id, displayName, username }, onOpenChat);
  const { prefetch, intentHandlers } = usePrefetchOnIntent();

  const body = (
    <>
      <Avatar id={contact.id} name={contact.displayName} size={44} />
      <div className={styles.info}>
        <p className={styles.name}>{contact.displayName}</p>
        <p className={styles.meta}>@{contact.username}</p>
      </div>
      <p className={styles.phone}>{contact.phone}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} prefetch={prefetch} className={styles.item} onClick={onOpenChat} {...intentHandlers}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={cn(styles.item, isPending && styles.pending)}
      aria-busy={isPending || undefined}
      onClick={open}
    >
      {body}
    </button>
  );
}
