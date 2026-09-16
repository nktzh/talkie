import type { Conversation, Message, MessageAttachment, UserId } from "../model/types";
import { formatCount, formatDuration, formatLastSeen, pluralize } from "./format";
import { stripMarkdown } from "./markdown";

export interface MessagePreview {
  author: string | null;
  text: string;
}

/** Текст для превью: подпись, а если её нет — описание вложений */
export function describeMessageContent(message: Message): string {
  // В превью разметка не нужна: показываем то, что пользователь увидел бы глазами
  const text =
    message.format === "markdown" ? stripMarkdown(message.text) : message.text.replace(/\s+/g, " ").trim();

  if (message.voice) return `Голосовое сообщение (${formatDuration(message.voice.durationMs)})`;
  if (message.videoNote) return `Видеосообщение (${formatDuration(message.videoNote.durationMs)})`;

  const attachments = message.attachments ?? [];
  if (attachments.length === 0) return text;

  const count = (kind: MessageAttachment["kind"]) => attachments.filter((attachment) => attachment.kind === kind).length;
  const imagesCount = count("image");
  const videosCount = count("video");
  const audiosCount = count("audio");
  const total = attachments.length;

  let label: string;
  if (imagesCount === total) {
    label = total === 1 ? "Фото" : `${total} фото`;
  } else if (videosCount === total) {
    label = total === 1 ? "Видео" : `${total} видео`;
  } else if (imagesCount + videosCount === total) {
    label = `${total} фото и видео`;
  } else if (audiosCount === total) {
    // Название трека информативнее слова «Аудио»
    label = total === 1 ? attachments[0].name : `${total} аудио`;
  } else if (imagesCount + videosCount + audiosCount === 0) {
    label = total === 1 ? attachments[0].name : `${total} ${pluralize(total, { one: "файл", few: "файла", many: "файлов" })}`;
  } else {
    label = `${total} ${pluralize(total, { one: "вложение", few: "вложения", many: "вложений" })}`;
  }

  return text ? `${label}, ${text}` : label;
}

export function getLastMessagePreview(conversation: Conversation, currentUserId: UserId): MessagePreview | null {
  const message = conversation.lastMessage;
  if (!message) return null;

  const text = describeMessageContent(message);

  if (conversation.kind === "channel") return { author: null, text };
  if (message.author.id === currentUserId) return { author: "Вы", text };
  if (conversation.kind === "group") return { author: message.author.displayName.split(" ")[0], text };
  return { author: null, text };
}

export function getConversationSubtitle(conversation: Conversation): string {
  switch (conversation.kind) {
    case "direct":
      if (conversation.isOnline) return "в сети";
      return conversation.lastSeenAt ? formatLastSeen(conversation.lastSeenAt) : "был(а) давно";
    case "group":
      return formatCount(conversation.membersCount, { one: "участник", few: "участника", many: "участников" });
    case "channel":
      return formatCount(conversation.subscribersCount, {
        one: "подписчик",
        few: "подписчика",
        many: "подписчиков",
      });
    case "bot":
      return "бот";
  }
}
