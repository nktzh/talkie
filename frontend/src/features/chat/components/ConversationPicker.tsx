"use client";

import { Cancel01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { Avatar, Icon } from "@/shared/ui";
import { CONVERSATION_KIND_ICONS } from "../config/conversation-kinds";
import { getConversationSubtitle } from "../lib/preview";
import { getConversationAvatarUrl, searchConversations } from "../model/selectors";
import type { Conversation, ConversationId } from "../model/types";
import styles from "./ConversationPicker.module.css";

interface ConversationPickerProps {
  conversations: Conversation[];
  /** Выбор нескольких чатов — отмеченные; null — выбор одного: нажатие сразу выбирает чат */
  selectedIds: ReadonlySet<ConversationId> | null;
  onSelect: (conversation: Conversation) => void;
  /** Подпись, когда выбирать не из чего */
  emptyText: string;
}

/** Поиск и список чатов для диалогов пересылки и ответа в другом чате */
export function ConversationPicker({ conversations, selectedIds, onSelect, emptyText }: ConversationPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isTouch = useMediaQuery("(pointer: coarse)");
  const results = searchConversations(conversations, query);
  const isMultiple = selectedIds !== null;

  // Модальное окно открывается уже после монтирования содержимого и ставит фокус на первую кнопку —
  // поиск забирает его кадром позже. На телефоне не забирает: клавиатура закрыла бы половину списка
  useEffect(() => {
    if (isTouch) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isTouch]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && query) {
      // Сначала очищаем поиск, а окно закроет следующий Esc
      event.preventDefault();
      setQuery("");
    } else if (event.key === "Enter" && results.length > 0 && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSelect(results[0]);
      if (isMultiple) setQuery("");
    }
  }

  return (
    <div className={styles.picker}>
      <div className={styles.search}>
        <Icon icon={Search01Icon} size={18} className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск чатов"
          aria-label="Поиск чатов"
          aria-controls="conversation-picker-list"
          autoComplete="off"
          spellCheck={false}
          className={styles.searchInput}
        />
        {query && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Очистить поиск"
          >
            <Icon icon={Cancel01Icon} size={16} />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className={styles.empty}>{query ? "Ничего не найдено" : emptyText}</p>
      ) : (
        <ul id="conversation-picker-list" role="list" className={styles.list}>
          {results.map((conversation) => {
            const isSelected = selectedIds?.has(conversation.id) ?? false;
            const kindIcon = CONVERSATION_KIND_ICONS[conversation.kind];

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  role={isMultiple ? "checkbox" : undefined}
                  aria-checked={isMultiple ? isSelected : undefined}
                  className={cn(styles.item, isSelected && styles.selected)}
                  onClick={() => onSelect(conversation)}
                >
                  <span className={styles.avatar}>
                    <Avatar
                      id={conversation.id}
                      name={conversation.title}
                      src={getConversationAvatarUrl(conversation)}
                      size={42}
                    />
                    {isMultiple && (
                      <span className={styles.check} aria-hidden="true">
                        <Icon icon={Tick02Icon} size={12} strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className={styles.body}>
                    <span className={styles.titleRow}>
                      {kindIcon && <Icon icon={kindIcon} size={15} className={styles.kindIcon} />}
                      <span className={styles.title}>{conversation.title}</span>
                    </span>
                    <span className={styles.subtitle}>{getConversationSubtitle(conversation)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
