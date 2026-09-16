"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { startDirectConversation } from "../api/chat-actions";
import { useChatStore } from "../model/chat-store";
import { findDirectConversation } from "../model/selectors";
import type { User } from "../model/types";

interface DirectChat {
  /** Ссылка на уже заведённую переписку; null — чат ещё предстоит создать через open */
  href: string | null;
  open: () => void;
  isPending: boolean;
}

/**
 * Переход в личную переписку с пользователем. Если чат уже есть — это обычная ссылка,
 * которую можно открыть в новой вкладке; если нет — open заводит его на сервере.
 */
export function useDirectChat(peer: User, onOpen?: () => void): DirectChat {
  const { conversations, addConversation } = useChatStore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const conversation = findDirectConversation(conversations, peer.id);

  function open() {
    startTransition(async () => {
      const created = await startDirectConversation(peer);

      addConversation(created);
      onOpen?.();
      router.push(`/app/${created.id}`);
    });
  }

  return { href: conversation ? `/app/${conversation.id}` : null, open, isPending };
}
