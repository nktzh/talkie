import type { User, UserId } from "@/entities/user";

export type { User, UserId } from "@/entities/user";

export type ConversationId = string;
export type MessageId = string;

export type MessageStatus = "sending" | "sent" | "read" | "failed";

/** video и audio — файлы, которые браузер смог открыть; остальное прикладывается как file */
export type AttachmentKind = "image" | "video" | "audio" | "file";

/**
 * Разметка текста сообщения.
 * plain — текст показывается как есть; markdown — разбирается парсером (см. MarkdownText).
 * Поле необязательное: отсутствие значения равносильно "plain".
 */
export type MessageFormat = "plain" | "markdown";

export interface MessageAttachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  /** Размер в байтах */
  size: number;
  mimeType: string;
  url: string;
  /** Размеры в пикселях — у изображений и видео, чтобы заранее знать пропорции */
  width?: number;
  height?: number;
  /** Длительность видео и аудио. Может отсутствовать: у части файлов её нет в метаданных */
  durationMs?: number;
  /** Кадр-превью видео. Без него в ленте показывается первый кадр самого видео */
  previewUrl?: string;
}

/** Голосовое сообщение */
export interface VoiceNote {
  url: string;
  mimeType: string;
  durationMs: number;
  /** Уровни громкости 0..1 для отрисовки волны */
  waveform: number[];
}

/** Видеосообщение-«кружок»: до минуты с фронтальной камеры */
export interface VideoNote {
  url: string;
  mimeType: string;
  durationMs: number;
  /** Первый кадр: виден, пока кружок за экраном не загружен или браузер не дал запустить беззвучный повтор */
  posterUrl?: string;
}

/** Реакция на сообщение: одна запись на эмодзи, сколько бы людей его ни поставили */
export interface MessageReaction {
  /** Эмодзи из общей палитры (shared/emoji). Убранные из палитры продолжают показываться */
  emoji: string;
  count: number;
  /** Среди поставивших — текущий пользователь. Бэкенд вычисляет это для каждого запроса */
  isChosen: boolean;
  /**
   * ISO 8601: когда текущий пользователь поставил эту реакцию. Своих реакций ограниченное число,
   * и сверх лимита снимается самая старая. Без значения (старые данные) реакция считается самой ранней
   */
  chosenAt?: string;
}

/**
 * Цитата сообщения, на которое ответили. Это снимок, а не ссылка: ответ в другом чате
 * читают люди, у которых может не быть доступа к оригиналу, — цитата всё равно покажет, на что ответили
 */
export interface MessageReply {
  messageId: MessageId;
  /** Чат оригинала: отличается от чата ответа, если ответили в другом чате */
  conversationId: ConversationId;
  authorName: string;
  /** Текст без разметки или описание вложений */
  text: string;
  /** Миниатюра первого фото или видео */
  thumbnailUrl?: string;
}

/** Происхождение пересланного сообщения */
export interface MessageForward {
  /** Автор оригинала; у поста — сам канал */
  authorId: UserId;
  authorName: string;
  /** ISO 8601: когда был отправлен оригинал */
  createdAt: string;
  /**
   * Пост канала, к которому можно перейти. У сообщений из личных чатов и групп источника нет:
   * по пересланному нельзя узнать, из какой закрытой переписки оно пришло
   */
  source?: { conversationId: ConversationId; messageId: MessageId };
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  /** В каналах автор — сам канал */
  author: Pick<User, "id" | "displayName" | "avatarUrl">;
  /** Текст; при наличии вложений служит подписью и может быть пустым */
  text: string;
  /** Разметка текста; по умолчанию — plain */
  format?: MessageFormat;
  /** ISO 8601 */
  createdAt: string;
  /** Имеет смысл для исходящих сообщений */
  status: MessageStatus;
  /** Количество просмотров — только у постов в каналах */
  viewsCount?: number;
  attachments?: MessageAttachment[];
  voice?: VoiceNote;
  videoNote?: VideoNote;
  /** Порядок стабилен: новая реакция встаёт в конец, чтобы кнопки не прыгали под курсором */
  reactions?: MessageReaction[];
  replyTo?: MessageReply;
  /** Есть у пересланных: при повторной пересылке сохраняется первоисточник */
  forwardedFrom?: MessageForward;
}

/** Вложение, выбранное пользователем, но ещё не отправленное */
export interface OutgoingAttachment extends MessageAttachment {
  file: File;
}

/** Результат записи с микрофона */
export interface RecordedVoice extends VoiceNote {
  blob: Blob;
}

/** Результат записи с камеры */
export interface RecordedVideoNote extends VideoNote {
  blob: Blob;
}

/** То, что пользователь отправляет из поля ввода */
export interface OutgoingMessageContent {
  text: string;
  format: MessageFormat;
  attachments: OutgoingAttachment[];
  voice: RecordedVoice | null;
  videoNote: RecordedVideoNote | null;
}

interface ConversationBase {
  id: ConversationId;
  title: string;
  lastMessage: Message | null;
  /** ISO 8601. Нужен чатам без сообщений: иначе только что начатый чат уезжает в конец списка */
  createdAt?: string;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

/** Личная переписка один на один */
export interface DirectConversation extends ConversationBase {
  kind: "direct";
  peer: User;
  isOnline: boolean;
  /** ISO 8601; null, если собеседник в сети или скрыл время */
  lastSeenAt: string | null;
  /** Заблокированному собеседнику нельзя писать, пока блокировка не снята */
  isBlocked: boolean;
}

/** Роль в группе: удалить группу может только владелец, чужие сообщения — владелец и администраторы */
export type GroupRole = "owner" | "admin" | "member";

/** Группа: писать могут все участники */
export interface GroupConversation extends ConversationBase {
  kind: "group";
  /** Фото группы; без него рисуются инициалы названия */
  avatarUrl?: string;
  /** Эмодзи-статус группы из общей палитры (shared/emoji); его задаёт владелец */
  status?: string;
  role: GroupRole;
  /** Общее число участников: может быть больше, чем загружено в members */
  membersCount: number;
  /** Загруженные участники. Настоящий API будет отдавать их страницами */
  members: User[];
  /** Есть только у публичных групп: по нику их находят в поиске. Закрытые доступны по приглашению */
  username?: string;
  /** Реакции на сообщения; выключить их может владелец */
  reactionsEnabled: boolean;
}

/** Роль в канале: публикуют только владелец и администраторы */
export type ChannelRole = "owner" | "admin" | "subscriber";

/** Канал: односторонняя лента постов, как в Telegram */
export interface ChannelConversation extends ConversationBase {
  kind: "channel";
  /** Фото канала; без него рисуются инициалы названия */
  avatarUrl?: string;
  /** Эмодзи-статус канала из общей палитры (shared/emoji); его задаёт владелец */
  status?: string;
  subscribersCount: number;
  role: ChannelRole;
  /** Ник канала: по нему канал находят в поиске */
  username?: string;
  description?: string;
  /** Реакции на посты; выключить их может владелец */
  reactionsEnabled: boolean;
}

/** Чат с ботом: пользователь отправляет команды, бот отвечает */
export interface BotConversation extends ConversationBase {
  kind: "bot";
  bot: User;
}

export type Conversation = DirectConversation | GroupConversation | ChannelConversation | BotConversation;

export type ConversationKind = Conversation["kind"];

/** Что пользователь заполнил в форме создания группы */
export interface GroupDraft {
  title: string;
  /** null — группа по приглашениям: ника у неё нет */
  username: string | null;
}

/** Что пользователь заполнил в форме создания канала */
export interface ChannelDraft {
  title: string;
  username: string;
  description: string;
}
