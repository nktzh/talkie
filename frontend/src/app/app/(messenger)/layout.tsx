import type { Metadata } from "next";
import { CurrentUserProvider, getCurrentUser } from "@/entities/user";
import { ChatStoreProvider } from "@/features/chat";
import { getConversations } from "@/features/chat/api/chat-api";
import { ContactsStoreProvider, getContacts } from "@/features/contacts";
import { NavRail } from "@/widgets/nav-rail";
import { VisualViewportHeight } from "@/shared/viewport";
import { TabBar } from "@/widgets/tab-bar";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Чаты",
};

/**
 * Оболочка мессенджера: навигация + раздел. Разделы (чаты, контакты, аккаунт) — вложенные роуты.
 * Навигация на десктопе слева (NavRail), на мобильных — снизу (TabBar).
 */
export default async function MessengerLayout({ children }: LayoutProps<"/app">) {
  const [currentUser, conversations, contacts] = await Promise.all([
    getCurrentUser(),
    getConversations(),
    getContacts(),
  ]);

  return (
    <CurrentUserProvider initialUser={currentUser}>
      <ChatStoreProvider initialConversations={conversations}>
        <ContactsStoreProvider initialContacts={contacts}>
          <VisualViewportHeight />
          <div className={styles.shell}>
            <NavRail />
            <div className={styles.main}>{children}</div>
            <TabBar className={styles.tabBar} />
          </div>
        </ContactsStoreProvider>
      </ChatStoreProvider>
    </CurrentUserProvider>
  );
}
