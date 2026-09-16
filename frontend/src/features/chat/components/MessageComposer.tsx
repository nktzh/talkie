"use client";

import {
  Alert02Icon,
  ArrowUp01Icon,
  Attachment01Icon,
  Cancel01Icon,
  Edit02Icon,
  LockIcon,
  Mic01Icon,
  SentIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";
import dynamic from "next/dynamic";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/shared/lib/cn";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { useTextareaAutosize } from "@/shared/lib/useTextareaAutosize";
import { Icon, IconButton, LiquidGlass } from "@/shared/ui";
import type { AttachmentsDraft } from "../hooks/useAttachmentsDraft";
import { useHoldToRecord } from "../hooks/useHoldToRecord";
import { useMarkdownEditor } from "../hooks/useMarkdownEditor";
import { useMessageRecorder, type RecordingKind } from "../hooks/useMessageRecorder";
import type { MessageReply, OutgoingMessageContent } from "../model/types";
import { ComposerAttachments } from "./ComposerAttachments";
import { ComposerReply } from "./ComposerReply";
import { RecordingBar } from "./RecordingBar";
import { VideoNoteRecorderPreview } from "./VideoNoteRecorderPreview";
import styles from "./MessageComposer.module.css";

/*
 * Панель форматирования и предпросмотр нужны только в режиме markdown — их код (а с предпросмотром
 * и парсер react-markdown) грузится отдельными чанками, когда режим включают впервые.
 * Кнопка переключателя начинает загрузку заранее — при наведении, фокусе или касании.
 */
const loadMarkdownToolbar = () => import("./MarkdownToolbar").then((module) => module.MarkdownToolbar);
const loadMarkdownText = () => import("./MarkdownText").then((module) => module.MarkdownText);
const MarkdownToolbar = dynamic(loadMarkdownToolbar, { ssr: false });
const MarkdownText = dynamic(loadMarkdownText, { ssr: false });

function preloadMarkdown() {
  void loadMarkdownToolbar();
  void loadMarkdownText();
}

const MAX_MESSAGE_LENGTH = 4096;

const MARKDOWN_PLACEHOLDER = "Markdown-разметка… Ctrl+Enter — отправить";
/** На экранной клавиатуре сочетаний нет: отправляет только кнопка */
const MARKDOWN_PLACEHOLDER_TOUCH = "Markdown-разметка…";

/** Половина высоты однострочной панели (44px строка + 8px отступы) — капсула */
const CARD_RADIUS = 26;
const CARD_RADIUS_MARKDOWN = 24;

/**
 * Главная кнопка меняет роль, оставаясь тем же элементом — фокус и захват указателя
 * не теряются, а иконки плавно перетекают друг в друга.
 */
type ActionMode = "record" | "send" | "send-recording";

const RECORD_LABELS: Record<RecordingKind, string> = {
  voice: "Голосовое сообщение: удерживайте, чтобы записать, нажмите — перейти к видео",
  video: "Видеосообщение: удерживайте, чтобы записать, нажмите — перейти к голосовому",
};

const SEND_RECORDING_LABELS: Record<RecordingKind, string> = {
  voice: "Отправить голосовое сообщение",
  video: "Отправить видеосообщение",
};

/** Цитата над полем ввода: хранится в сторе, поле только показывает её и управляет ею */
export interface ComposerReplyDraft {
  reply: MessageReply;
  /** Название чата оригинала — если отвечают в другом чате */
  sourceTitle: string | null;
  /** Прокрутить ленту к оригиналу; null — оригинал в другом чате */
  onShow: (() => void) | null;
  onReplyElsewhere: () => void;
  onCancel: () => void;
}

interface MessageComposerProps {
  placeholder: string;
  /** Черновик вложений живёт в окне чата, чтобы файлы можно было бросить на всю ленту */
  attachments: AttachmentsDraft;
  replyDraft: ComposerReplyDraft | null;
  onSend: (content: OutgoingMessageContent) => void;
}

export function MessageComposer({ placeholder, attachments, replyDraft, onSend }: MessageComposerProps) {
  const [text, setText] = useState("");
  /** Режим markdown: панель форматирования и увеличенное поле ввода */
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  /** Панель форматирования монтируется при первом включении markdown и дальше остаётся в разметке */
  const [hasToolbar, setHasToolbar] = useState(false);
  /** Что запишет кнопка при удержании; короткое нажатие переключает */
  const [recordKind, setRecordKind] = useState<RecordingKind>("voice");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useMessageRecorder({
    onRecorded: (media) => onSend({ text: "", format: "plain", attachments: [], ...media }),
  });
  const editor = useMarkdownEditor({ value: text, onChange: setText, textareaRef });
  // Safari и Firefox не умеют field-sizing: content — там высоту поля выставляет хук
  useTextareaAutosize(textareaRef, text, `${isMarkdown}:${isPreview}`);
  /** Экранная клавиатура: Shift как модификатор не работает, поэтому Enter только переносит строку */
  const isTouch = useMediaQuery("(pointer: coarse)");

  const trimmedText = text.trim();
  const hasAttachments = attachments.items.length > 0;
  const canSend = trimmedText.length > 0 || hasAttachments;
  const isRecording = recorder.status === "recording";
  const isRequestingDevice = recorder.status === "requesting";
  const isToolbarOpen = isMarkdown && !isRecording;
  // В режиме markdown записи нет: кнопка всегда отправляет и гаснет, пока отправлять нечего
  const mode: ActionMode = isRecording ? "send-recording" : canSend || isMarkdown ? "send" : "record";

  const hold = useHoldToRecord({
    enabled: mode === "record",
    onTap: () => setRecordKind((kind) => (kind === "voice" ? "video" : "voice")),
    onHoldStart: () => void recorder.start(recordKind),
    onRelease: recorder.stop,
    onCancel: recorder.cancel,
  });

  const isLocked = isRecording && hold.isLocked;
  const currentLevel = isRecording ? (recorder.liveLevels.at(-1) ?? 0) : 0;
  const alert = attachments.error ?? recorder.error;
  const actionLabel =
    mode === "record" ? RECORD_LABELS[recordKind] : mode === "send" ? "Отправить" : SEND_RECORDING_LABELS[recorder.kind];
  const replyMessageId = replyDraft?.reply.messageId;

  // Выбрали «Ответить» или пришли в чат с цитатой из другого — сразу печатаем ответ
  useEffect(() => {
    if (replyMessageId) textareaRef.current?.focus({ preventScroll: true });
  }, [replyMessageId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    onSend({
      text: trimmedText,
      format: isMarkdown ? "markdown" : "plain",
      attachments: attachments.items,
      voice: null,
      videoNote: null,
    });
    setText("");
    attachments.clear();
    setIsPreview(false);
    textareaRef.current?.focus();
  }

  function handleActionClick() {
    // Запись управляется жестом удержания, отправку текста обрабатывает форма.
    // Click остаётся только у закреплённой записи: кнопка отправляет её
    if (hold.consumeGestureClick()) return;
    if (mode === "send-recording") recorder.stop();
  }

  function toggleMarkdown() {
    setHasToolbar(true);
    setIsMarkdown((enabled) => !enabled);
    setIsPreview(false);
    textareaRef.current?.focus();
  }

  /*
   * Обычный режим: Enter отправляет, Shift+Enter переносит строку.
   * Режим markdown: текст многострочный по сути, поэтому Enter всегда переносит,
   * а отправляет Ctrl/Cmd+Enter. Во время набора через IME не отправляем.
   * Тач-устройства: Enter всегда переносит строку, отправляет только кнопка.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isMarkdown && editor.handleShortcut(event)) return;

    // Esc отменяет ответ, как в Telegram; набранный текст остаётся
    if (event.key === "Escape" && replyDraft && !event.nativeEvent.isComposing) {
      event.preventDefault();
      replyDraft.onCancel();
      return;
    }

    if (isTouch || event.key !== "Enter" || event.nativeEvent.isComposing) return;

    const shouldSend = isMarkdown ? event.ctrlKey || event.metaKey : !event.shiftKey;
    if (!shouldSend) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    attachments.add(Array.from(event.target.files ?? []));
    // Сбрасываем выбор, чтобы тот же файл можно было прикрепить повторно
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Вставка скриншота или файла из буфера обмена
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files);
    if (files.length === 0) return;

    event.preventDefault();
    attachments.add(files);
  }

  function dismissAlert() {
    attachments.dismissError();
    recorder.dismissError();
  }

  return (
    <div className={styles.composer}>
      {isRecording && recorder.kind === "video" && recorder.stream && (
        <VideoNoteRecorderPreview stream={recorder.stream} elapsedMs={recorder.elapsedMs} />
      )}

      {/* Пока кнопку держат, над ней подсказка: потяните вверх, чтобы не держать */}
      {isRecording && !isLocked && (
        <div
          className={styles.lockHint}
          style={{ "--lock-progress": hold.lockProgress } as CSSProperties}
          aria-hidden="true"
        >
          <Icon icon={LockIcon} size={18} />
          <Icon icon={ArrowUp01Icon} size={16} className={styles.lockArrow} />
        </div>
      )}

      {alert && (
        <div role="alert" className={styles.alert}>
          <Icon icon={Alert02Icon} size={16} />
          <span className={styles.alertText}>{alert}</span>
          <button type="button" className={styles.alertDismiss} onClick={dismissAlert} aria-label="Скрыть сообщение">
            <Icon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      )}

      {/* Капсула, пока панель в одну строку; с панелью форматирования — скруглённая карточка */}
      <LiquidGlass radius={isMarkdown ? CARD_RADIUS_MARKDOWN : CARD_RADIUS} className={styles.card}>
        {/* Панель всегда в разметке, чтобы появляться и исчезать плавно; скрытая — недоступна */}
        <div className={styles.toolbarSlot} data-open={isToolbarOpen || undefined} inert={!isToolbarOpen}>
          <div className={styles.toolbarSlotInner}>
            {hasToolbar && (
              <MarkdownToolbar editor={editor} isPreview={isPreview} onTogglePreview={() => setIsPreview((on) => !on)} />
            )}
          </div>
        </div>

        {replyDraft && (
          <ComposerReply
            reply={replyDraft.reply}
            sourceTitle={replyDraft.sourceTitle}
            onShow={replyDraft.onShow}
            onReplyElsewhere={replyDraft.onReplyElsewhere}
            onCancel={() => {
              replyDraft.onCancel();
              textareaRef.current?.focus();
            }}
          />
        )}

        {hasAttachments && !isRecording && (
          <ComposerAttachments
            items={attachments.items}
            onRemove={attachments.remove}
            onRemoveAll={attachments.removeAll}
          />
        )}

        <form className={styles.row} onSubmit={handleSubmit}>
          {isRecording ? (
            <RecordingBar
              kind={recorder.kind}
              elapsedMs={recorder.elapsedMs}
              levels={recorder.liveLevels}
              isLocked={isLocked}
              offsetX={hold.offsetX}
              onCancel={recorder.cancel}
              onSend={recorder.stop}
            />
          ) : (
            <>
              <IconButton
                label="Прикрепить файлы"
                className={styles.attach}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon icon={Attachment01Icon} size={22} />
              </IconButton>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                tabIndex={-1}
                onChange={handleFileInputChange}
              />

              {isPreview ? (
                <div className={styles.preview} aria-label="Предпросмотр сообщения">
                  {trimmedText ? (
                    <MarkdownText source={text} />
                  ) : (
                    <p className={styles.previewEmpty}>Здесь появится оформленное сообщение</p>
                  )}
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  name="message"
                  rows={1}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={isMarkdown ? (isTouch ? MARKDOWN_PLACEHOLDER_TOUCH : MARKDOWN_PLACEHOLDER) : placeholder}
                  enterKeyHint="enter"
                  aria-label="Текст сообщения"
                  maxLength={MAX_MESSAGE_LENGTH}
                  className={cn(styles.input, isMarkdown && styles.inputMarkdown)}
                />
              )}

              <IconButton
                label={isMarkdown ? "Выключить форматирование" : "Форматирование markdown"}
                className={cn(styles.markdownToggle, isMarkdown && styles.markdownToggleActive)}
                aria-pressed={isMarkdown}
                onClick={toggleMarkdown}
                onPointerEnter={preloadMarkdown}
                onPointerDown={preloadMarkdown}
                onFocus={preloadMarkdown}
              >
                <Icon icon={Edit02Icon} size={22} />
              </IconButton>
            </>
          )}

          <button
            type={mode === "send" ? "submit" : "button"}
            className={styles.action}
            data-mode={mode}
            data-kind={recordKind}
            data-holding={(hold.isHolding && !isLocked) || undefined}
            disabled={mode === "send" && !canSend}
            aria-busy={isRequestingDevice || undefined}
            aria-label={actionLabel}
            title={actionLabel}
            style={{ "--voice-level": currentLevel } as CSSProperties}
            onClick={handleActionClick}
            {...hold.buttonProps}
          >
            <Icon icon={Mic01Icon} size={22} className={styles.micIcon} />
            <Icon icon={Video01Icon} size={22} className={styles.videoIcon} />
            <Icon icon={SentIcon} size={22} className={styles.sendIcon} />
          </button>
        </form>
      </LiquidGlass>
    </div>
  );
}
