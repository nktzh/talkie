"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useParams } from "next/navigation";
import { Icon, IconLink, Skeleton } from "@/shared/ui";
import { useChatStore } from "../model/chat-store";
import { ChatHeader } from "./ChatHeader";
import headerStyles from "./ChatHeader.module.css";
import viewStyles from "./ChatView.module.css";
import styles from "./ChatViewSkeleton.module.css";

/** Ширины и стороны пузырей: лента выглядит живой, а не рядом одинаковых полос */
const BUBBLES = [
  { side: "out", width: "42%" },
  { side: "out", width: "26%" },
  { side: "in", width: "55%" },
  { side: "in", width: "34%" },
  { side: "out", width: "48%" },
  { side: "in", width: "30%" },
  { side: "in", width: "62%" },
] as const;

/**
 * Оболочка чата на время загрузки (loading.tsx): шапка, лента и поле ввода на своих местах.
 * Next предзагружает её вместе со ссылкой, поэтому переход по нажатию начинается сразу, не дожидаясь сервера.
 * Сам чат уже есть в сторе списка — шапка сразу настоящая, скелетом ждёт только лента.
 * data-chat-open, как у ChatView, — на мобильных вместо списка сразу открывается экран чата
 */
export function ChatViewSkeleton() {
  const { chatId } = useParams<{ chatId?: string }>();
  const { conversations } = useChatStore();
  const conversation = conversations.find((item) => item.id === chatId);

  return (
    <section
      className={viewStyles.chat}
      aria-label={conversation?.title ?? "Загрузка чата"}
      aria-busy="true"
      data-chat-open
    >
      <div className={viewStyles.conversation}>
        {conversation ? (
          <ChatHeader conversation={conversation} isInfoOpen={false} onToggleInfo={() => {}} />
        ) : (
          <header className={headerStyles.header}>
            <IconLink href="/app" prefetch label="Назад к списку чатов" className={headerStyles.back}>
              <Icon icon={ArrowLeft01Icon} size={22} />
            </IconLink>
            <Skeleton width={42} height={42} radius="50%" />
            <div className={styles.headerText}>
              <Skeleton width={160} height={16} />
              <Skeleton width={90} height={12} />
            </div>
          </header>
        )}

        <div className={styles.feed}>
          <ol role="list" className={styles.list}>
            {BUBBLES.map((bubble, index) => (
              <li key={index} className={styles.row} data-side={bubble.side}>
                <Skeleton width={bubble.width} height={38} radius={18} className={styles.bubble} />
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.footer}>
          <Skeleton height={52} radius={26} className={styles.composer} />
        </div>
      </div>
    </section>
  );
}
