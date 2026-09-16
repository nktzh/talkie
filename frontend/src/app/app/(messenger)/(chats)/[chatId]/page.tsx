import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatView } from "@/features/chat";
import { getConversation, getMessages } from "@/features/chat/api/chat-api";

export async function generateMetadata({ params }: PageProps<"/app/[chatId]">): Promise<Metadata> {
  const { chatId } = await params;
  const conversation = await getConversation(chatId);

  return { title: conversation?.title ?? "Чат не найден" };
}

export default async function ChatPage({ params }: PageProps<"/app/[chatId]">) {
  const { chatId } = await params;
  const [conversation, messages] = await Promise.all([getConversation(chatId), getMessages(chatId)]);

  if (!conversation) notFound();

  return <ChatView key={conversation.id} conversation={conversation} initialMessages={messages} />;
}
