import { ChatSidebar } from "@/features/chat";
import { NewChatButton } from "@/features/new-chat";
import { PanelResizeHandle } from "@/shared/panel-sizes";
import styles from "./layout.module.css";

export default function ChatsLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <ChatSidebar action={<NewChatButton />} />
        <PanelResizeHandle
          panel="sidebar"
          edge="right"
          label="Ширина списка чатов"
          className={styles.resizeHandle}
        />
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
