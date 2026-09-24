import type { Metadata } from "next";
import { ChatEmptyState } from "@/features/chat";

/** Список чатов без выбранного — показывать в заголовке нечего, остаётся одно название приложения */
export const metadata: Metadata = {
  title: { absolute: "Talkie" },
};

export default function ChatsPage() {
  return <ChatEmptyState />;
}
