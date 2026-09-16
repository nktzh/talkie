"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { collectChatMedia, type ChatMediaKind } from "../lib/media";
import type { Conversation, Message, MessageId, UserId } from "../model/types";
import { ChatInfoSection } from "./ChatInfoSection";
import { ChatAudioList, ChatFileList, ChatMediaGrid, ChatVoiceList } from "./ChatMediaList";
import { ChatMembersList } from "./ChatMembersList";
import styles from "./ChatInfoTabs.module.css";

/** Участники стоят в одном ряду с медиа: это разные взгляды на один и тот же чат */
type InfoTabId = "members" | ChatMediaKind;

interface InfoTab {
  id: InfoTabId;
  label: string;
  count: number;
  empty: string;
}

interface ChatInfoTabsProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: UserId;
  onShowMessage: (messageId: MessageId) => void;
}

export function ChatInfoTabs({ conversation, messages, currentUserId, onShowMessage }: ChatInfoTabsProps) {
  const media = collectChatMedia(messages);
  const group = conversation.kind === "group" ? conversation : null;

  const tabs: InfoTab[] = [
    ...(group
      ? [{ id: "members" as const, label: "Участники", count: group.membersCount, empty: "Участников нет" }]
      : []),
    { id: "media", label: "Медиа", count: media.media.length, empty: "В чате пока нет фото и видео" },
    { id: "file", label: "Файлы", count: media.files.length, empty: "В чате пока нет файлов" },
    { id: "audio", label: "Аудио", count: media.audio.length, empty: "В чате пока нет аудиофайлов" },
    { id: "voice", label: "Голосовые", count: media.voice.length, empty: "В чате пока нет голосовых и кружков" },
  ];

  const [activeId, setActiveId] = useState<InfoTabId>(tabs[0].id);
  // Вкладки зависят от типа чата, поэтому на всякий случай держимся первой из доступных
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <ChatInfoSection className={styles.section}>
      <div role="tablist" aria-label="Разделы чата" className={styles.tabs}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(styles.tab, isActive && styles.activeTab)}
              onClick={() => setActiveId(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className={styles.count}>{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {activeTab.count === 0 ? (
        <p className={styles.empty}>{activeTab.empty}</p>
      ) : activeTab.id === "members" && group ? (
        <ChatMembersList conversation={group} currentUserId={currentUserId} />
      ) : activeTab.id === "media" ? (
        <ChatMediaGrid items={media.media} onSelect={onShowMessage} />
      ) : activeTab.id === "file" ? (
        <ChatFileList items={media.files} onSelect={onShowMessage} />
      ) : activeTab.id === "audio" ? (
        <ChatAudioList items={media.audio} onSelect={onShowMessage} />
      ) : (
        <ChatVoiceList items={media.voice} onSelect={onShowMessage} />
      )}
    </ChatInfoSection>
  );
}
