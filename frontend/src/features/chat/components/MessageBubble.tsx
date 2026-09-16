import { ArrowTurnForwardIcon, ViewIcon } from "@hugeicons/core-free-icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, type MouseEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { useLongPress, type LongPress } from "@/shared/lib/useLongPress";
import { Avatar, Icon } from "@/shared/ui";
import { getMessageElementId } from "../hooks/useJumpToMessage";
import { formatTime, formatViews } from "../lib/format";
import { MEDIA_ID_ATTRIBUTE, VIDEO_NOTE_MEDIA_ID, VOICE_MEDIA_ID, getSavableMedia } from "../lib/media";
import type { MessageVariant } from "../lib/message-list";
import { getReplySourceLabel, type ReplyQuoteTarget } from "../lib/reply";
import type { Message, MessageForward, MessageId, MessageReaction, MessageReply } from "../model/types";
import type { MessageMenuTarget } from "./MessageContextMenu";
import { MessageAudios, MessageFiles, MessageMedia } from "./MessageAttachments";
import { MessageReactions } from "./MessageReactions";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { VideoNotePlayer } from "./VideoNotePlayer";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import styles from "./MessageBubble.module.css";

/*
 * Парсер markdown (react-markdown, micromark) — отдельный чанк: он грузится, только когда в ленте
 * есть markdown-сообщение, а не вместе со списком чатов. При серверной отрисовке чанк подключается
 * к странице сразу; при переходе на клиенте, пока он грузится, текст виден без оформления.
 */
const MarkdownText = dynamic(() => import("./MarkdownText").then((module) => module.MarkdownText));

interface MessageBubbleProps {
  message: Message;
  variant: MessageVariant;
  /** Имя и аватар автора — для входящих в группах */
  showAuthor: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** Пузырь, для которого открыто контекстное меню, подсвечивается атрибутом от ContextMenu */
  onContextMenu?: (event: MouseEvent<HTMLDivElement>, target: MessageMenuTarget) => void;
  /** Долгое касание на телефоне или планшете: bubble — пузырь, над которым встанет меню */
  onLongPress?: (press: LongPress<HTMLDivElement>, target: MessageMenuTarget) => void;
  /** false — владелец выключил реакции: уже поставленные тоже скрываются */
  showReactions?: boolean;
  canToggleReaction?: (reaction: MessageReaction) => boolean;
  onToggleReaction?: (emoji: string) => void;
  /** Куда ведёт цитата, если сообщение — ответ: лента знает, цел ли оригинал и доступен ли его чат */
  replyTarget?: ReplyQuoteTarget | null;
  /** Ссылка на пост канала, из которого переслано сообщение */
  forwardHref?: string | null;
  onJumpToMessage?: (messageId: MessageId) => void;
}

export function MessageBubble({
  message,
  variant,
  showAuthor,
  isFirstInGroup,
  isLastInGroup,
  onContextMenu,
  onLongPress,
  showReactions = false,
  canToggleReaction = () => false,
  onToggleReaction = () => {},
  replyTarget = null,
  forwardHref = null,
  onJumpToMessage = () => {},
}: MessageBubbleProps) {
  const attachments = message.attachments ?? [];
  const reactions = showReactions ? (message.reactions ?? []) : [];
  const longPress = useLongPress<HTMLDivElement>((press) =>
    onLongPress?.(press, { message, media: findMediaAt(press.target, message) }),
  );
  const media = attachments.filter((attachment) => attachment.kind === "image" || attachment.kind === "video");
  const audios = attachments.filter((attachment) => attachment.kind === "audio");
  const files = attachments.filter((attachment) => attachment.kind === "file");
  const hasText = message.text.length > 0;
  const isMarkdown = message.format === "markdown" && hasText;
  // Только фото и видео без подписи — время показываем поверх них
  const isMediaOnly = media.length === attachments.length && media.length > 0 && !hasText && !message.voice;
  // Кружок живёт без пузыря — время тоже поверх него
  const isVideoNote = Boolean(message.videoNote);
  // Голосовое без подписи: время в строке длительности, как текст с временем — без лишней строки снизу
  const isVoiceOnly = Boolean(message.voice) && !hasText && attachments.length === 0;

  const meta = (
    <span className={styles.meta}>
      {message.viewsCount !== undefined && (
        <span className={styles.views}>
          <Icon icon={ViewIcon} size={14} />
          {formatViews(message.viewsCount)}
          <span className="sr-only"> просмотров</span>
        </span>
      )}
      <time dateTime={message.createdAt} suppressHydrationWarning>
        {formatTime(message.createdAt)}
      </time>
      {variant === "outgoing" && <MessageStatusIcon status={message.status} size={15} />}
    </span>
  );

  return (
    <li
      id={getMessageElementId(message.id)}
      className={cn(
        styles.row,
        styles[variant],
        isFirstInGroup && styles.first,
        isLastInGroup && styles.last,
        isVideoNote && styles.videoNoteRow,
      )}
    >
      {showAuthor && (
        <div className={styles.avatarSlot}>
          {isLastInGroup && <Avatar id={message.author.id} name={message.author.displayName} size={34} />}
        </div>
      )}

      <div
        className={cn(
          styles.bubble,
          media.length > 0 && styles.withImages,
          isMarkdown && styles.withMarkdown,
          isVideoNote && styles.withVideoNote,
        )}
        {...longPress.handlers}
        onContextMenu={(event) => {
          // Долгое касание открывает меню само — системное и десктопное здесь не нужны
          if (longPress.handleContextMenu(event)) return;
          onContextMenu?.(event, { message, media: findMediaAt(event.target as Element, message) });
        }}
      >
        {showAuthor && isFirstInGroup && <span className={styles.author}>{message.author.displayName}</span>}

        {(message.forwardedFrom || (message.replyTo && replyTarget)) && (
          <div className={styles.header}>
            {message.forwardedFrom && <ForwardedHeader forward={message.forwardedFrom} href={forwardHref} />}
            {message.replyTo && replyTarget && (
              <ReplyQuote reply={message.replyTo} target={replyTarget} onJump={onJumpToMessage} />
            )}
          </div>
        )}

        {message.videoNote && (
          <div className={styles.videoNote} {...{ [MEDIA_ID_ATTRIBUTE]: VIDEO_NOTE_MEDIA_ID }}>
            <VideoNotePlayer videoNote={message.videoNote} />
            <div className={styles.metaOverlay}>{meta}</div>
          </div>
        )}

        {media.length > 0 && (
          <div className={styles.media}>
            <MessageMedia items={media} />
            {isMediaOnly && <div className={styles.metaOverlay}>{meta}</div>}
          </div>
        )}

        {(message.voice || audios.length > 0 || files.length > 0) && (
          <div className={cn(styles.content, isVoiceOnly && styles.voiceOnly)}>
            {message.voice && <VoiceMessagePlayer voice={message.voice} />}
            {audios.length > 0 && <MessageAudios items={audios} />}
            {files.length > 0 && <MessageFiles files={files} />}
            {isVoiceOnly && meta}
          </div>
        )}

        {isMarkdown && (
          <div className={styles.markdown}>
            <Suspense fallback={<p className={styles.text}>{message.text}</p>}>
              <MarkdownText source={message.text} />
            </Suspense>
          </div>
        )}

        {hasText && !isMarkdown ? (
          <p className={styles.text}>
            {message.text}
            {meta}
          </p>
        ) : (
          /* Блочная разметка не обтекает время — показываем его отдельной строкой */
          (isMarkdown || !(isMediaOnly || isVideoNote || isVoiceOnly)) && <div className={styles.metaRow}>{meta}</div>
        )}

        {reactions.length > 0 && (
          <MessageReactions
            reactions={reactions}
            canToggle={canToggleReaction}
            onToggle={onToggleReaction}
            className={styles.reactions}
          />
        )}
      </div>
    </li>
  );
}

function ForwardedHeader({ forward, href }: { forward: MessageForward; href: string | null }) {
  // Источник есть только у постов каналов — у них «из», у людей — «от»
  const preposition = forward.source ? "из" : "от";

  return (
    <p className={styles.forwarded}>
      <Icon icon={ArrowTurnForwardIcon} size={14} className={styles.forwardedIcon} />
      <span className={styles.forwardedLabel}>Переслано {preposition}&nbsp;</span>
      {href ? (
        <Link href={href} className={styles.forwardedName}>
          {forward.authorName}
        </Link>
      ) : (
        <span className={styles.forwardedName}>{forward.authorName}</span>
      )}
    </p>
  );
}

interface ReplyQuoteProps {
  reply: MessageReply;
  target: ReplyQuoteTarget;
  onJump: (messageId: MessageId) => void;
}

/** Цитата сообщения, на которое ответили: ведёт к оригиналу в ленте или в другом чате */
function ReplyQuote({ reply, target, onJump }: ReplyQuoteProps) {
  const isDeleted = target.type === "none" && target.isDeleted;
  const sourceLabel = target.type === "link" ? getReplySourceLabel(reply, target.chatTitle) : null;

  const body = (
    <>
      {reply.thumbnailUrl && !isDeleted && (
        // eslint-disable-next-line @next/next/no-img-element -- миниатюра из data- или object URL, оптимизатору нечего делать
        <img src={reply.thumbnailUrl} alt="" className={styles.replyThumb} />
      )}
      <span className={styles.replyBody}>
        {!isDeleted && (
          <span className={styles.replyAuthor}>
            {reply.authorName}
            {sourceLabel && <span className={styles.replyChat}> · {sourceLabel}</span>}
          </span>
        )}
        <span className={styles.replyText}>{isDeleted ? "Сообщение удалено" : reply.text}</span>
      </span>
    </>
  );

  switch (target.type) {
    case "jump":
      return (
        <button
          type="button"
          className={styles.reply}
          aria-label={`Перейти к сообщению ${reply.authorName}: ${reply.text}`}
          onClick={() => onJump(target.messageId)}
        >
          {body}
        </button>
      );
    case "link":
      return (
        <Link
          href={target.href}
          className={styles.reply}
          aria-label={`Открыть сообщение ${reply.authorName} в чате «${target.chatTitle}»: ${reply.text}`}
        >
          {body}
        </Link>
      );
    case "none":
      return <div className={cn(styles.reply, isDeleted && styles.replyDeleted)}>{body}</div>;
  }
}

/**
 * Медиа, по которому кликнули или на котором держат палец: фото, видео, аудио, файл или кружок.
 * Голосовое сохраняется кликом по любому месту сообщения — если только клик не пришёлся на другое вложение.
 */
function findMediaAt(target: Element, message: Message) {
  const element = target.closest(`[${MEDIA_ID_ATTRIBUTE}]`);
  const mediaId = element?.getAttribute(MEDIA_ID_ATTRIBUTE) ?? VOICE_MEDIA_ID;
  return getSavableMedia(message, mediaId);
}
