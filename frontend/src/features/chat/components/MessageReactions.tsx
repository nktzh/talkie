import { cn } from "@/shared/lib/cn";
import { getEmojiKey } from "../config/reactions";
import { formatViews } from "../lib/format";
import { getReactionName } from "../lib/reactions";
import type { MessageReaction } from "../model/types";
import styles from "./MessageReactions.module.css";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  /** Реакцию нельзя нажать, если реагировать в чате нельзя или эмодзи убрали из палитры */
  canToggle: (reaction: MessageReaction) => boolean;
  onToggle: (emoji: string) => void;
  className?: string;
}

/** Реакции под сообщением: нажатие на чужую ставит такую же, на свою — снимает */
export function MessageReactions({ reactions, canToggle, onToggle, className }: MessageReactionsProps) {
  return (
    <ul role="list" aria-label="Реакции" className={cn(styles.list, className)}>
      {reactions.map((reaction) => {
        const name = getReactionName(reaction.emoji);

        return (
          <li key={getEmojiKey(reaction.emoji)}>
            <button
              type="button"
              aria-pressed={reaction.isChosen}
              aria-label={`${name}: ${reaction.count}`}
              title={name}
              disabled={!canToggle(reaction)}
              className={cn(styles.reaction, reaction.isChosen && styles.chosen)}
              onClick={() => onToggle(reaction.emoji)}
            >
              <span className={styles.emoji} aria-hidden="true">
                {reaction.emoji}
              </span>
              <span className={styles.count} aria-hidden="true">
                {formatViews(reaction.count)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
