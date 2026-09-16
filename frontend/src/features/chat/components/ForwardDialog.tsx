"use client";

import { type FormEvent, useState } from "react";
import { Button, Modal, ModalCloseButton } from "@/shared/ui";
import { formatCount } from "../lib/format";
import { describeMessageContent } from "../lib/preview";
import { useChatStore } from "../model/chat-store";
import { canPostMessages } from "../model/selectors";
import type { Conversation, ConversationId, Message, MessageReply } from "../model/types";
import { ConversationPicker } from "./ConversationPicker";
import styles from "./ForwardDialog.module.css";

const FORWARD_TITLE_ID = "forward-dialog-title";
const REPLY_TITLE_ID = "reply-elsewhere-dialog-title";
const COMMENT_MAX_LENGTH = 1024;
const CHATS_FORMS = { one: "чат", few: "чата", many: "чатов" };

interface ForwardDialogProps {
  /** null — окно закрыто */
  message: Message | null;
  onClose: () => void;
  onForward: (message: Message, targets: Conversation[], comment: string) => void;
}

/** Пересылка сообщения: несколько чатов сразу и необязательный комментарий */
export function ForwardDialog({ message, onClose, onForward }: ForwardDialogProps) {
  return (
    <Modal open={message !== null} onClose={onClose} labelledBy={FORWARD_TITLE_ID} size="sheet" className={styles.dialog}>
      {message && <ForwardPanel message={message} onClose={onClose} onForward={onForward} />}
    </Modal>
  );
}

/** Монтируется при каждом открытии, поэтому выбор и комментарий всегда начинаются с чистого листа */
function ForwardPanel({ message, onClose, onForward }: { message: Message } & Omit<ForwardDialogProps, "message">) {
  const { conversations } = useChatStore();
  // Порядок выбора сохраняем: в нём же уйдут сообщения
  const [selectedIds, setSelectedIds] = useState<ConversationId[]>([]);
  const [comment, setComment] = useState("");

  const targets = conversations.filter(canPostMessages);
  // Чат мог пропасть из списка, пока окно открыто (например, удалён)
  const selected = selectedIds.flatMap((id) => targets.find((conversation) => conversation.id === id) ?? []);

  function toggle(conversation: Conversation) {
    setSelectedIds((ids) =>
      ids.includes(conversation.id) ? ids.filter((id) => id !== conversation.id) : [...ids, conversation.id],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length > 0) onForward(message, selected, comment);
  }

  const submitLabel =
    selected.length === 0
      ? "Выберите чаты"
      : selected.length === 1
        ? `Переслать в «${selected[0].title}»`
        : `Переслать в ${formatCount(selected.length, CHATS_FORMS)}`;

  return (
    <div className={styles.panel}>
      <DialogHeader
        titleId={FORWARD_TITLE_ID}
        title="Переслать"
        description={describeMessageContent(message)}
        onClose={onClose}
      />

      <ConversationPicker
        conversations={targets}
        selectedIds={new Set(selectedIds)}
        onSelect={toggle}
        emptyText="Нет чатов, в которые можно писать"
      />

      <form className={styles.footer} onSubmit={handleSubmit}>
        {selected.length > 0 && (
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Комментарий (необязательно)"
            aria-label="Комментарий к пересылаемому сообщению"
            maxLength={COMMENT_MAX_LENGTH}
            autoComplete="off"
            enterKeyHint="send"
            onKeyDown={(event) => {
              // Неявная отправка формы по Enter срабатывает не везде — отправляем явно, но не посреди набора IME
              if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }}
            className={styles.comment}
          />
        )}
        <Button type="submit" disabled={selected.length === 0} className={styles.submit}>
          <span className={styles.submitLabel}>{submitLabel}</span>
        </Button>
      </form>
    </div>
  );
}

interface ReplyElsewhereDialogProps {
  /** null — окно закрыто */
  reply: MessageReply | null;
  /** Чат, из которого открыли окно: отвечать «в другом» в него же незачем */
  currentConversationId: ConversationId;
  onClose: () => void;
  onSelect: (reply: MessageReply, target: Conversation) => void;
}

/** Ответ в другом чате: цитата переезжает в поле ввода выбранного чата */
export function ReplyElsewhereDialog({ reply, currentConversationId, onClose, onSelect }: ReplyElsewhereDialogProps) {
  return (
    <Modal open={reply !== null} onClose={onClose} labelledBy={REPLY_TITLE_ID} size="sheet" className={styles.dialog}>
      {reply && (
        <ReplyElsewherePanel
          reply={reply}
          currentConversationId={currentConversationId}
          onClose={onClose}
          onSelect={onSelect}
        />
      )}
    </Modal>
  );
}

function ReplyElsewherePanel({
  reply,
  currentConversationId,
  onClose,
  onSelect,
}: { reply: MessageReply } & Omit<ReplyElsewhereDialogProps, "reply">) {
  const { conversations } = useChatStore();
  const targets = conversations.filter(
    (conversation) => conversation.id !== currentConversationId && canPostMessages(conversation),
  );

  return (
    <div className={styles.panel}>
      <DialogHeader
        titleId={REPLY_TITLE_ID}
        title="Ответить в другом чате"
        description={`${reply.authorName}: ${reply.text}`}
        onClose={onClose}
      />

      <ConversationPicker
        conversations={targets}
        selectedIds={null}
        onSelect={(target) => onSelect(reply, target)}
        emptyText="Нет других чатов, в которые можно писать"
      />
    </div>
  );
}

interface DialogHeaderProps {
  titleId: string;
  title: string;
  /** Что пересылают или цитируют — одной строкой */
  description: string;
  onClose: () => void;
}

function DialogHeader({ titleId, title, description, onClose }: DialogHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>
      </div>
      <ModalCloseButton onClose={onClose} />
    </header>
  );
}
