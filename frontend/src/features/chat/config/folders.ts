import {
  BotIcon,
  Megaphone01Icon,
  MessageMultiple01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@/shared/ui";
import type { Conversation } from "../model/types";

export type ChatFolderId = "all" | "direct" | "groups" | "channels" | "bots";

/** Папка — фильтр списка чатов, переключается из навигационной панели */
export interface ChatFolder {
  id: ChatFolderId;
  /** Короткая подпись под иконкой в навигационной панели */
  label: string;
  /** Заголовок над списком чатов */
  title: string;
  icon: IconSvgElement;
  includes: (conversation: Conversation) => boolean;
  /** Раздел ещё не готов — вместо списка чатов показывается заглушка */
  comingSoon?: {
    title: string;
    description: string;
  };
}

export const CHAT_FOLDERS: readonly ChatFolder[] = [
  {
    id: "all",
    label: "Все",
    title: "Все чаты",
    icon: MessageMultiple01Icon,
    includes: () => true,
  },
  {
    id: "direct",
    label: "Личные",
    title: "Личные",
    icon: UserIcon,
    includes: (conversation) => conversation.kind === "direct",
  },
  {
    id: "groups",
    label: "Группы",
    title: "Группы",
    icon: UserGroupIcon,
    includes: (conversation) => conversation.kind === "group",
  },
  {
    id: "channels",
    label: "Каналы",
    title: "Каналы",
    icon: Megaphone01Icon,
    includes: (conversation) => conversation.kind === "channel",
  },
  {
    id: "bots",
    label: "Боты",
    title: "Боты",
    icon: BotIcon,
    includes: (conversation) => conversation.kind === "bot",
    comingSoon: {
      title: "Боты скоро появятся",
      description: "Мы уже работаем над ними — совсем скоро здесь можно будет найти полезных помощников",
    },
  },
];

export const DEFAULT_FOLDER_ID: ChatFolderId = "all";

export function getChatFolder(id: ChatFolderId): ChatFolder {
  return CHAT_FOLDERS.find((folder) => folder.id === id) ?? CHAT_FOLDERS[0];
}
