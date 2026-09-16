"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CurrentUser } from "./types";

interface CurrentUserContextValue {
  user: CurrentUser;
  setUser: (user: CurrentUser) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

interface CurrentUserProviderProps {
  initialUser: CurrentUser;
  children: ReactNode;
}

/** Текущий пользователь доступен всему мессенджеру: навигации, чатам, настройкам */
export function CurrentUserProvider({ initialUser, children }: CurrentUserProviderProps) {
  const [user, setUser] = useState(initialUser);

  return <CurrentUserContext value={{ user, setUser }}>{children}</CurrentUserContext>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error("useCurrentUser должен использоваться внутри CurrentUserProvider");
  }
  return context;
}
