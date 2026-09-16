import { ChatViewSkeleton } from "@/features/chat";

/**
 * Без loading.tsx динамический маршрут не предзагружается: после нажатия на чат ничего не менялось,
 * пока сервер не отрисует страницу целиком. Оболочка отсюда приходит заранее вместе со ссылкой
 */
export default function ChatLoading() {
  return <ChatViewSkeleton />;
}
