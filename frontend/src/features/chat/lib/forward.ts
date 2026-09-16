import type { Conversation, Message, MessageForward } from "../model/types";

/** Что уходит в другой чат при пересылке: содержимое и происхождение, но не реакции, просмотры и цитата */
export type ForwardedContent = Pick<Message, "text" | "format" | "attachments" | "voice" | "videoNote"> & {
  forwardedFrom: MessageForward;
};

export function createForwardedContent(
  message: Message,
  sourceConversation: Pick<Conversation, "id" | "kind">,
): ForwardedContent {
  return {
    text: message.text,
    format: message.format,
    attachments: message.attachments,
    voice: message.voice,
    videoNote: message.videoNote,
    // Пересланное повторно ведёт к первоисточнику, а не к тому, кто переслал, — как в Telegram
    forwardedFrom: message.forwardedFrom ?? {
      authorId: message.author.id,
      authorName: message.author.displayName,
      createdAt: message.createdAt,
      source:
        sourceConversation.kind === "channel"
          ? { conversationId: sourceConversation.id, messageId: message.id }
          : undefined,
    },
  };
}
