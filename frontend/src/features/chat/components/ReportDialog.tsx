"use client";

import { useId, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button, Modal } from "@/shared/ui";
import { reportConversation } from "../api/chat-actions";
import type { Conversation } from "../model/types";
import styles from "./ReportDialog.module.css";

const REPORT_REASONS = ["Спам", "Мошенничество", "Оскорбления", "Запрещённый контент", "Другое"] as const;

interface ReportFormProps {
  conversation: Conversation;
  onClose: () => void;
  /** Жалоба ушла: панель покажет, что обращение принято */
  onReported: () => void;
  /** Сервер жалобу не принял — панель уберёт отметку об отправке */
  onReportFailed: () => void;
}

type ReportDialogProps = ReportFormProps & { open: boolean };

/** Жалоба модераторам: причину выбирают из списка, чтобы обращение было понятным */
export function ReportDialog({ open, onClose, ...formProps }: ReportDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <ReportForm titleId={titleId} onClose={onClose} {...formProps} />
    </Modal>
  );
}

/**
 * Монтируется при каждом открытии модалки, поэтому выбор всегда начинается заново.
 * Оптимистично: окно закрывается сразу, не дожидаясь сервера
 */
function ReportForm({
  titleId,
  conversation,
  onClose,
  onReported,
  onReportFailed,
}: ReportFormProps & { titleId: string }) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);

  function submit() {
    onReported();
    onClose();
    reportConversation(conversation.id, reason).catch(onReportFailed);
  }

  return (
    <div className={styles.body}>
      <h2 id={titleId} className={styles.title}>
        Пожаловаться на «{conversation.title}»
      </h2>
      <p className={styles.description}>Расскажите, что не так. Жалобу увидят модераторы Talkie.</p>

      <fieldset className={styles.reasons}>
        <legend className="sr-only">Причина жалобы</legend>
        {REPORT_REASONS.map((item) => (
          <label key={item} className={cn(styles.reason, item === reason && styles.selected)}>
            <input
              type="radio"
              name="report-reason"
              value={item}
              checked={item === reason}
              onChange={() => setReason(item)}
              className="sr-only"
            />
            {item}
          </label>
        ))}
      </fieldset>

      <div className={styles.actions}>
        <Button variant="secondary" className={styles.action} onClick={onClose}>
          Отмена
        </Button>
        <Button className={styles.action} onClick={submit}>
          Отправить
        </Button>
      </div>
    </div>
  );
}
