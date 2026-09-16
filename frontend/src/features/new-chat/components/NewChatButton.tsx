"use client";

import { Edit02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContactsModal } from "@/features/contacts";
import { isMobileViewport } from "@/shared/routing";
import { Icon, IconButton, LiquidGlass } from "@/shared/ui";
import { CreateChannelModal } from "./CreateChannelModal";
import { CreateGroupModal } from "./CreateGroupModal";
import styles from "./NewChatButton.module.css";
import { NewChatMenu } from "./NewChatMenu";

/** Открытая модалка; menu — выбор, что создать */
type View = "closed" | "menu" | "contacts" | "group" | "channel";

/** Кнопка «Новый чат» в шапке списка чатов */
export function NewChatButton() {
  const router = useRouter();
  const [view, setView] = useState<View>("closed");

  function close() {
    setView("closed");
  }

  /*
   * Нативное событие close приходит уже после того, как из меню открыли следующую модалку,
   * поэтому закрытие меню сбрасывает вид только если его никто не занял.
   */
  function closeMenu() {
    setView((current) => (current === "menu" ? "closed" : current));
  }

  // На мобильных контакты живут в отдельной вкладке, модалка с ними — только для десктопа
  function openContacts() {
    if (isMobileViewport()) {
      close();
      router.push("/app/contacts");
      return;
    }

    setView("contacts");
  }

  return (
    <>
      <LiquidGlass radius={999} displacementScale={24} className={styles.glass}>
        <IconButton
          label="Новый чат"
          aria-haspopup="dialog"
          className={styles.button}
          onClick={() => setView("menu")}
        >
          <Icon icon={Edit02Icon} size={22} />
        </IconButton>
      </LiquidGlass>

      <NewChatMenu
        open={view === "menu"}
        onClose={closeMenu}
        onWriteContact={openContacts}
        onCreateGroup={() => setView("group")}
        onCreateChannel={() => setView("channel")}
      />
      <ContactsModal open={view === "contacts"} onClose={close} />
      <CreateGroupModal open={view === "group"} onClose={close} />
      <CreateChannelModal open={view === "channel"} onClose={close} />
    </>
  );
}
