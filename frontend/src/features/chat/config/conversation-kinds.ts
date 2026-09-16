import { BotIcon, Megaphone01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@/shared/ui";
import type { ConversationKind } from "../model/types";

/** Иконка рядом с названием чата; у личных переписок её нет */
export const CONVERSATION_KIND_ICONS: Partial<Record<ConversationKind, IconSvgElement>> = {
  group: UserGroupIcon,
  channel: Megaphone01Icon,
  bot: BotIcon,
};
