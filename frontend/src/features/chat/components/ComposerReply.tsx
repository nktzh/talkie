"use client";

import { ArrowTurnBackwardIcon, Cancel01Icon, MailReply01Icon } from "@hugeicons/core-free-icons";
import { Icon, IconButton } from "@/shared/ui";
import type { MessageReply } from "../model/types";
import styles from "./ComposerReply.module.css";

interface ComposerReplyProps {
  reply: MessageReply;
  /** Название чата оригинала — если отвечают в другом чате */
  sourceTitle: string | null;
  /** Прокрутить ленту к оригиналу; только когда он в этом же чате */
  onShow: (() => void) | null;
  onReplyElsewhere: () => void;
  onCancel: () => void;
}

/** Цитата над полем ввода: на что уйдёт ответ */
export function ComposerReply({ reply, sourceTitle, onShow, onReplyElsewhere, onCancel }: ComposerReplyProps) {
  const content = (
    <>
      {reply.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- миниатюра из data- или object URL, оптимизатору нечего делать
        <img src={reply.thumbnailUrl} alt="" className={styles.thumb} />
      )}
      <span className={styles.body}>
        <span className={styles.author}>
          <span className="sr-only">Ответ на сообщение: </span>
          {reply.authorName}
          {sourceTitle && <span className={styles.source}> · {sourceTitle}</span>}
        </span>
        <span className={styles.text}>{reply.text}</span>
      </span>
    </>
  );

  return (
    <div className={styles.reply}>
      <Icon icon={ArrowTurnBackwardIcon} size={20} className={styles.icon} />

      {onShow ? (
        <button type="button" className={styles.target} onClick={onShow} title="Показать сообщение">
          {content}
        </button>
      ) : (
        <div className={styles.target}>{content}</div>
      )}

      <IconButton label="Ответить в другом чате" className={styles.action} onClick={onReplyElsewhere}>
        <Icon icon={MailReply01Icon} size={18} />
      </IconButton>
      <IconButton label="Отменить ответ" className={styles.action} onClick={onCancel}>
        <Icon icon={Cancel01Icon} size={18} />
      </IconButton>
    </div>
  );
}
