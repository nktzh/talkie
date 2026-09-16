"use client";

import { CloudUploadIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/entities/user";
import { INFO_PANEL_OVERLAY_MAX_WIDTH } from "@/shared/routing";
import { Icon } from "@/shared/ui";
import { useAttachmentsDraft } from "../hooks/useAttachmentsDraft";
import { useConversationMessages } from "../hooks/useConversationMessages";
import { useFileDrop } from "../hooks/useFileDrop";
import { useForwardMessage } from "../hooks/useForwardMessage";
import { useOverlayInset } from "../hooks/useOverlayInset";
import { useJumpToMessage } from "../hooks/useJumpToMessage";
import { useSendMessage } from "../hooks/useSendMessage";
import { formatCount } from "../lib/format";
import { createMessageReply, getReplySourceLabel, parseMessageHash } from "../lib/reply";
import { useChatStore } from "../model/chat-store";
import { canPostMessages } from "../model/selectors";
import type { Conversation, Message, MessageId, MessageReply } from "../model/types";
import { BlockedFooter } from "./BlockedFooter";
import { ChannelFooter } from "./ChannelFooter";
import { ChatHeader } from "./ChatHeader";
import { ChatInfoPanel } from "./ChatInfoPanel";
import { ForwardDialog, ReplyElsewhereDialog } from "./ForwardDialog";
import { MessageComposer, type ComposerReplyDraft } from "./MessageComposer";
import { MessageList } from "./MessageList";
import styles from "./ChatView.module.css";

/** Сколько висит подтверждение пересылки */
const NOTICE_DURATION_MS = 3000;

interface ChatViewProps {
  conversation: Conversation;
  initialMessages: Message[];
}

export function ChatView({ conversation: initialConversation, initialMessages }: ChatViewProps) {
  const { conversations, markAsRead, replyDrafts, setReplyDraft } = useChatStore();
  const { user: currentUser } = useCurrentUser();
  const router = useRouter();
  // Сервер отдаёт снимок на момент загрузки, а стор — актуальное состояние (mute, непрочитанные)
  const conversation =
    conversations.find((item) => item.id === initialConversation.id) ?? initialConversation;
  const messages = useConversationMessages(conversation.id, initialMessages);
  const sendMessage = useSendMessage(conversation.id);
  const forwardMessage = useForwardMessage(conversation);

  const canPost = canPostMessages(conversation);
  const attachments = useAttachmentsDraft();
  const { isDragging, dropHandlers } = useFileDrop(attachments.add, canPost);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  /** Сообщение, для которого открыт выбор чатов пересылки */
  const [forwarding, setForwarding] = useState<Message | null>(null);
  /** Цитата, для которой выбирают другой чат */
  const [replyingElsewhere, setReplyingElsewhere] = useState<MessageReply | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Высота нижней панели — на неё лента делает отступ снизу
  const { containerRef, overlayRef: footerRef } = useOverlayInset<HTMLDivElement, HTMLDivElement>(
    "--chat-footer-height",
  );

  const jumpToMessage = useJumpToMessage();
  const reply = replyDrafts[conversation.id] ?? null;

  useEffect(() => {
    markAsRead(conversation.id);
  }, [conversation.id, markAsRead]);

  // Переход из цитаты или пересланного поста другого чата: /app/<чат>#message-<id>
  useEffect(() => {
    const messageId = parseMessageHash(window.location.hash);
    if (!messageId) return;

    jumpToMessage(messageId);
    // Хэш одноразовый: после обновления страницы лента не должна снова прыгать к сообщению
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, [conversation.id, jumpToMessage]);

  useEffect(() => {
    if (!notice) return;
    const timeoutId = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  function showMessage(messageId: MessageId) {
    // На узком экране панель закрывает ленту: убираем её, чтобы было видно, куда перешли
    if (window.matchMedia(`(max-width: ${INFO_PANEL_OVERLAY_MAX_WIDTH}px)`).matches) {
      setIsInfoOpen(false);
    }
    jumpToMessage(messageId);
  }

  function handleForward(message: Message, targets: Conversation[], comment: string) {
    setForwarding(null);
    void forwardMessage(
      message,
      targets.map((target) => target.id),
      comment,
    );

    const [target] = targets;
    if (targets.length === 1 && target.id === conversation.id) return;

    // В один чат — открываем его, как Telegram: видно, что сообщение ушло. В несколько — остаёмся здесь
    if (targets.length === 1) {
      router.push(`/app/${target.id}`);
    } else {
      setNotice(`Сообщение переслано в ${formatCount(targets.length, { one: "чат", few: "чата", many: "чатов" })}`);
    }
  }

  function handleReplyElsewhere(selectedReply: MessageReply, target: Conversation) {
    setReplyingElsewhere(null);
    setReplyDraft(target.id, selectedReply);
    // Цитата переехала в другой чат — здесь она больше не нужна
    if (reply?.messageId === selectedReply.messageId) setReplyDraft(conversation.id, null);
    router.push(`/app/${target.id}`);
  }

  const replyDraft: ComposerReplyDraft | null = reply && {
    reply,
    sourceTitle:
      reply.conversationId === conversation.id
        ? null
        : getReplySourceLabel(reply, conversations.find((item) => item.id === reply.conversationId)?.title ?? null),
    onShow: reply.conversationId === conversation.id ? () => jumpToMessage(reply.messageId) : null,
    onReplyElsewhere: () => setReplyingElsewhere(reply),
    onCancel: () => setReplyDraft(conversation.id, null),
  };

  return (
    // data-chat-open сообщает layout, что открыт чат: на мобильных скрывается список
    <section className={styles.chat} aria-label={conversation.title} data-chat-open {...dropHandlers}>
      <div ref={containerRef} className={styles.conversation}>
        <ChatHeader
          conversation={conversation}
          isInfoOpen={isInfoOpen}
          onToggleInfo={() => setIsInfoOpen((open) => !open)}
        />

        <MessageList
          messages={messages}
          conversation={conversation}
          currentUserId={currentUser.id}
          onForward={setForwarding}
          onReplyElsewhere={(message) => setReplyingElsewhere(createMessageReply(message))}
        />

        <div ref={footerRef} className={styles.footer}>
          {notice && (
            <p role="status" className={styles.notice}>
              {notice}
            </p>
          )}

          {canPost ? (
            <MessageComposer
              placeholder={conversation.kind === "channel" ? "Опубликовать пост…" : "Сообщение…"}
              attachments={attachments}
              replyDraft={replyDraft}
              onSend={sendMessage}
            />
          ) : conversation.kind === "channel" ? (
            <ChannelFooter conversation={conversation} />
          ) : (
            conversation.kind === "direct" && <BlockedFooter conversation={conversation} />
          )}
        </div>
      </div>

      {isInfoOpen && (
        <ChatInfoPanel
          conversation={conversation}
          messages={messages}
          onClose={() => setIsInfoOpen(false)}
          onShowMessage={showMessage}
        />
      )}

      {isDragging && (
        <div className={styles.dropOverlay} aria-hidden="true">
          <Icon icon={CloudUploadIcon} size={40} />
          <span>Отпустите, чтобы прикрепить</span>
        </div>
      )}

      <ForwardDialog message={forwarding} onClose={() => setForwarding(null)} onForward={handleForward} />

      <ReplyElsewhereDialog
        reply={replyingElsewhere}
        currentConversationId={conversation.id}
        onClose={() => setReplyingElsewhere(null)}
        onSelect={handleReplyElsewhere}
      />
    </section>
  );
}
