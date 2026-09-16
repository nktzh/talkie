"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { DEFAULT_FOLDER_ID, type ChatFolderId } from "../config/folders";
import { sortConversations } from "./selectors";
import type { Conversation, ConversationId, Message, MessageId, MessageReaction, MessageReply } from "./types";

interface ChatState {
  conversations: Conversation[];
  activeFolderId: ChatFolderId;
  /** Сообщения, появившиеся за текущую сессию. Сюда же лягут события из WebSocket */
  sessionMessages: Record<ConversationId, Message[]>;
  /** Удалённые за сессию: сообщения с сервера пришли в снимке страницы, и отфильтровать их можно только здесь */
  deletedMessageIds: Record<ConversationId, MessageId[]>;
  /** Реакции, изменившиеся за сессию: перекрывают те, что пришли в снимке страницы */
  messageReactions: Record<ConversationId, Record<MessageId, MessageReaction[]>>;
  /** Цитаты, на которые пользователь начал отвечать: у каждого чата своя и не теряется при переходах */
  replyDrafts: Record<ConversationId, MessageReply>;
}

type ChatAction =
  | { type: "folderSelected"; folderId: ChatFolderId }
  | { type: "conversationAdded"; conversation: Conversation }
  | { type: "conversationRemoved"; conversationId: ConversationId }
  | { type: "conversationRead"; conversationId: ConversationId }
  | { type: "muteToggled"; conversationId: ConversationId }
  | { type: "pinChanged"; conversationId: ConversationId; isPinned: boolean }
  | { type: "blockChanged"; conversationId: ConversationId; isBlocked: boolean }
  | { type: "reactionsToggled"; conversationId: ConversationId; isEnabled: boolean }
  | { type: "messageReactionsChanged"; message: Message; reactions: MessageReaction[] }
  | { type: "messageUpserted"; message: Message; replacesId?: MessageId }
  | { type: "messageRemoved"; message: Message; previousMessage: Message | null }
  | { type: "messageRestored"; message: Message }
  | { type: "replyDraftChanged"; conversationId: ConversationId; reply: MessageReply | null };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "folderSelected":
      return state.activeFolderId === action.folderId ? state : { ...state, activeFolderId: action.folderId };

    case "conversationAdded": {
      const isKnown = state.conversations.some((item) => item.id === action.conversation.id);
      if (isKnown) return state;

      return { ...state, conversations: sortConversations([...state.conversations, action.conversation]) };
    }

    // Сообщения и реакции чата за сессию не стираем: удаление оптимистичное, и если сервер
    // откажет, чат вернётся в список вместе с ними. Новый чат с тем же id не появится — id уникальны
    case "conversationRemoved":
      return {
        ...state,
        conversations: state.conversations.filter((conversation) => conversation.id !== action.conversationId),
      };

    case "conversationRead": {
      const target = state.conversations.find((conversation) => conversation.id === action.conversationId);
      if (!target || target.unreadCount === 0) return state;

      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        ),
      };
    }

    case "muteToggled":
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId
            ? { ...conversation, isMuted: !conversation.isMuted }
            : conversation,
        ),
      };

    case "pinChanged":
      return {
        ...state,
        conversations: sortConversations(
          state.conversations.map((conversation) =>
            conversation.id === action.conversationId ? { ...conversation, isPinned: action.isPinned } : conversation,
          ),
        ),
      };

    case "blockChanged":
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId && conversation.kind === "direct"
            ? { ...conversation, isBlocked: action.isBlocked }
            : conversation,
        ),
      };

    case "reactionsToggled":
      return {
        ...state,
        conversations: state.conversations.map((conversation) =>
          conversation.id === action.conversationId && (conversation.kind === "group" || conversation.kind === "channel")
            ? { ...conversation, reactionsEnabled: action.isEnabled }
            : conversation,
        ),
      };

    case "messageReactionsChanged": {
      const { conversationId, id } = action.message;

      return {
        ...state,
        messageReactions: {
          ...state.messageReactions,
          [conversationId]: { ...state.messageReactions[conversationId], [id]: action.reactions },
        },
      };
    }

    case "messageUpserted": {
      const { message, replacesId = message.id } = action;

      const currentMessages = state.sessionMessages[message.conversationId] ?? [];
      const hasTarget = currentMessages.some((item) => item.id === replacesId);
      const nextMessages = hasTarget
        ? currentMessages.map((item) => (item.id === replacesId ? message : item))
        : [...currentMessages, message];

      const conversations = state.conversations.map((conversation) => {
        if (conversation.id !== message.conversationId) return conversation;

        const last = conversation.lastMessage;
        const isLatest = !last || last.id === replacesId || message.createdAt >= last.createdAt;
        return isLatest ? { ...conversation, lastMessage: message } : conversation;
      });

      return {
        ...state,
        conversations: sortConversations(conversations),
        sessionMessages: { ...state.sessionMessages, [message.conversationId]: nextMessages },
      };
    }

    case "messageRemoved": {
      const { message, previousMessage } = action;
      const { conversationId } = message;

      const conversations = state.conversations.map((conversation) =>
        conversation.id === conversationId && conversation.lastMessage?.id === message.id
          ? { ...conversation, lastMessage: previousMessage }
          : conversation,
      );

      return {
        ...state,
        conversations: sortConversations(conversations),
        sessionMessages: {
          ...state.sessionMessages,
          [conversationId]: (state.sessionMessages[conversationId] ?? []).filter((item) => item.id !== message.id),
        },
        deletedMessageIds: {
          ...state.deletedMessageIds,
          [conversationId]: [...(state.deletedMessageIds[conversationId] ?? []), message.id],
        },
      };
    }

    case "messageRestored": {
      const { message } = action;
      const { conversationId } = message;

      // Сообщение из снимка страницы встанет на место само, как только пропадёт из удалённых.
      // Отправленное за сессию возвращаем в список сессии по времени (копию серверного лента пропустит)
      const sessionList = (state.sessionMessages[conversationId] ?? []).filter((item) => item.id !== message.id);
      const insertAt = sessionList.findIndex((item) => item.createdAt > message.createdAt);
      const nextSessionList =
        insertAt === -1
          ? [...sessionList, message]
          : [...sessionList.slice(0, insertAt), message, ...sessionList.slice(insertAt)];

      const conversations = state.conversations.map((conversation) => {
        const last = conversation.lastMessage;
        const isLatest = conversation.id === conversationId && (!last || message.createdAt >= last.createdAt);
        return isLatest ? { ...conversation, lastMessage: message } : conversation;
      });

      return {
        ...state,
        conversations: sortConversations(conversations),
        sessionMessages: { ...state.sessionMessages, [conversationId]: nextSessionList },
        deletedMessageIds: {
          ...state.deletedMessageIds,
          [conversationId]: (state.deletedMessageIds[conversationId] ?? []).filter((id) => id !== message.id),
        },
      };
    }

    case "replyDraftChanged": {
      const { conversationId, reply } = action;
      if (!reply && !state.replyDrafts[conversationId]) return state;

      const replyDrafts = { ...state.replyDrafts };
      if (reply) replyDrafts[conversationId] = reply;
      else delete replyDrafts[conversationId];

      return { ...state, replyDrafts };
    }
  }
}

function createInitialState(conversations: Conversation[]): ChatState {
  return {
    conversations: sortConversations(conversations),
    activeFolderId: DEFAULT_FOLDER_ID,
    sessionMessages: {},
    deletedMessageIds: {},
    messageReactions: {},
    replyDrafts: {},
  };
}

interface ChatStoreValue extends ChatState {
  selectFolder: (folderId: ChatFolderId) => void;
  /** Чат, начатый из контактов: на сервере он уже есть, в списке — ещё нет */
  addConversation: (conversation: Conversation) => void;
  /** Удалённый чат или канал, который покинул пользователь */
  removeConversation: (conversationId: ConversationId) => void;
  markAsRead: (conversationId: ConversationId) => void;
  toggleMute: (conversationId: ConversationId) => void;
  setPinned: (conversationId: ConversationId, isPinned: boolean) => void;
  /** Блокировка собеседника в личной переписке */
  setBlocked: (conversationId: ConversationId, isBlocked: boolean) => void;
  /** Реакции в группе или канале, которые включает и выключает владелец */
  setReactionsEnabled: (conversationId: ConversationId, isEnabled: boolean) => void;
  /** Итоговый список реакций сообщения — оптимистичный или подтверждённый сервером */
  setMessageReactions: (message: Message, reactions: MessageReaction[]) => void;
  /** Добавляет сообщение или заменяет существующее (например, оптимистичное на подтверждённое) */
  upsertMessage: (message: Message, replacesId?: MessageId) => void;
  /** previousMessage станет последним в списке чатов, если удалено последнее сообщение */
  removeMessage: (message: Message, previousMessage: Message | null) => void;
  /** Возвращает сообщение, удалённое оптимистично, если сервер удалить не смог */
  restoreMessage: (message: Message) => void;
  /** Цитата над полем ввода чата; null — ответ отменён или отправлен */
  setReplyDraft: (conversationId: ConversationId, reply: MessageReply | null) => void;
}

const ChatStoreContext = createContext<ChatStoreValue | null>(null);

interface ChatStoreProviderProps {
  initialConversations: Conversation[];
  children: ReactNode;
}

export function ChatStoreProvider({ initialConversations, children }: ChatStoreProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialConversations, createInitialState);

  const value: ChatStoreValue = {
    ...state,
    selectFolder: (folderId) => dispatch({ type: "folderSelected", folderId }),
    addConversation: (conversation) => dispatch({ type: "conversationAdded", conversation }),
    removeConversation: (conversationId) => dispatch({ type: "conversationRemoved", conversationId }),
    markAsRead: (conversationId) => dispatch({ type: "conversationRead", conversationId }),
    toggleMute: (conversationId) => dispatch({ type: "muteToggled", conversationId }),
    setPinned: (conversationId, isPinned) => dispatch({ type: "pinChanged", conversationId, isPinned }),
    setBlocked: (conversationId, isBlocked) => dispatch({ type: "blockChanged", conversationId, isBlocked }),
    setReactionsEnabled: (conversationId, isEnabled) =>
      dispatch({ type: "reactionsToggled", conversationId, isEnabled }),
    setMessageReactions: (message, reactions) => dispatch({ type: "messageReactionsChanged", message, reactions }),
    upsertMessage: (message, replacesId) => dispatch({ type: "messageUpserted", message, replacesId }),
    removeMessage: (message, previousMessage) => dispatch({ type: "messageRemoved", message, previousMessage }),
    restoreMessage: (message) => dispatch({ type: "messageRestored", message }),
    setReplyDraft: (conversationId, reply) => dispatch({ type: "replyDraftChanged", conversationId, reply }),
  };

  return <ChatStoreContext value={value}>{children}</ChatStoreContext>;
}

export function useChatStore(): ChatStoreValue {
  const store = useContext(ChatStoreContext);
  if (!store) {
    throw new Error("useChatStore должен использоваться внутри ChatStoreProvider");
  }
  return store;
}
