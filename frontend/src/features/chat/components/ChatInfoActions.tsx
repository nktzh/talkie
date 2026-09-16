"use client";

import {
  Delete02Icon,
  Flag02Icon,
  Logout01Icon,
  UserBlock01Icon,
  UserUnlock01Icon,
} from "@hugeicons/core-free-icons";
import { useState, type ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";
import { ConfirmDialog, Icon, type IconSvgElement } from "@/shared/ui";
import { useConversationBlock } from "../hooks/useConversationBlock";
import type { ChannelConversation, Conversation, DirectConversation } from "../model/types";
import { ChatInfoSection } from "./ChatInfoSection";
import { ConversationRemovalDialog } from "./ConversationRemovalDialog";
import { ReportDialog } from "./ReportDialog";
import styles from "./ChatInfoActions.module.css";

/** Что можно сделать с чатом. У ботов и групп отдельных действий пока нет */
export function ChatInfoActions({ conversation }: { conversation: Conversation }) {
  if (conversation.kind === "direct") return <DirectActions conversation={conversation} />;
  if (conversation.kind === "channel") return <ChannelActions conversation={conversation} />;
  return null;
}

function DirectActions({ conversation }: { conversation: DirectConversation }) {
  const [dialog, setDialog] = useState<"delete" | "block" | null>(null);
  const setBlocked = useConversationBlock(conversation.id);

  function changeBlocked(isBlocked: boolean) {
    setDialog(null);
    setBlocked(isBlocked);
  }

  return (
    <ChatInfoSection title="Действия">
      <ul role="list" className={styles.list}>
        <li>
          <ActionRow
            icon={Delete02Icon}
            label="Удалить чат"
            isDanger
            aria-haspopup="dialog"
            onClick={() => setDialog("delete")}
          />
        </li>
        <li>
          {conversation.isBlocked ? (
            <ActionRow
              icon={UserUnlock01Icon}
              label="Разблокировать пользователя"
              onClick={() => changeBlocked(false)}
            />
          ) : (
            <ActionRow
              icon={UserBlock01Icon}
              label="Заблокировать пользователя"
              isDanger
              aria-haspopup="dialog"
              onClick={() => setDialog("block")}
            />
          )}
        </li>
      </ul>

      <ConversationRemovalDialog
        request={dialog === "delete" ? { conversation, action: "delete" } : null}
        onClose={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "block"}
        onClose={() => setDialog(null)}
        title="Заблокировать пользователя?"
        description={`${conversation.peer.displayName} не сможет писать вам, а вы — отправлять сообщения в этот чат. Блокировку можно снять в любой момент.`}
        confirmLabel="Заблокировать"
        isDanger
        onConfirm={() => changeBlocked(true)}
      />
    </ChatInfoSection>
  );
}

function ChannelActions({ conversation }: { conversation: ChannelConversation }) {
  const [dialog, setDialog] = useState<"leave" | "delete" | "report" | null>(null);
  const [reportStatus, setReportStatus] = useState<"idle" | "sent" | "failed">("idle");

  return (
    <ChatInfoSection title="Действия">
      <ul role="list" className={styles.list}>
        <li>
          {/* Владелец не выходит из канала, а удаляет его */}
          {conversation.role === "owner" ? (
            <ActionRow
              icon={Delete02Icon}
              label="Удалить канал"
              isDanger
              aria-haspopup="dialog"
              onClick={() => setDialog("delete")}
            />
          ) : (
            <ActionRow
              icon={Logout01Icon}
              label="Выйти из канала"
              isDanger
              aria-haspopup="dialog"
              onClick={() => setDialog("leave")}
            />
          )}
        </li>
        {/* Владельцу и администраторам жаловаться не на что: канал их собственный */}
        {conversation.role === "subscriber" && (
          <li>
            <ActionRow
              icon={Flag02Icon}
              label="Пожаловаться"
              hint={
                reportStatus === "sent"
                  ? "Жалоба отправлена"
                  : reportStatus === "failed"
                    ? "Не удалось отправить жалобу — попробуйте ещё раз"
                    : undefined
              }
              aria-haspopup="dialog"
              onClick={() => setDialog("report")}
            />
          </li>
        )}
      </ul>

      <ConversationRemovalDialog
        request={dialog === "leave" || dialog === "delete" ? { conversation, action: dialog } : null}
        onClose={() => setDialog(null)}
      />

      <ReportDialog
        open={dialog === "report"}
        conversation={conversation}
        onClose={() => setDialog(null)}
        onReported={() => setReportStatus("sent")}
        onReportFailed={() => setReportStatus("failed")}
      />
    </ChatInfoSection>
  );
}

type ActionRowProps = ComponentProps<"button"> & {
  icon: IconSvgElement;
  label: string;
  /** Подпись под названием — например, подтверждение, что действие уже выполнено */
  hint?: string;
  /** Необратимое действие подсвечивается красным */
  isDanger?: boolean;
};

function ActionRow({ icon, label, hint, isDanger = false, className, ...props }: ActionRowProps) {
  return (
    <button type="button" className={cn(styles.action, isDanger && styles.danger, className)} {...props}>
      <Icon icon={icon} size={20} className={styles.icon} />
      <span className={styles.body}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </button>
  );
}
