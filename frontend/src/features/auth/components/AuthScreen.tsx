"use client";

import { useState } from "react";
import { ThemeToggle } from "@/shared/theme";
import { Logo } from "@/shared/ui";
import type { AuthMode } from "../types";
import { AuthModeToggle, getAuthTabId } from "./AuthModeToggle";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import styles from "./AuthScreen.module.css";

const PANEL_ID = "auth-panel";

const COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "С возвращением",
    subtitle: "Войдите, чтобы продолжить общение",
  },
  register: {
    title: "Создайте аккаунт",
    subtitle: "Регистрация доступна по пригласительному коду",
  },
};

interface AuthScreenProps {
  initialMode: AuthMode;
  /** Код из ссылки-приглашения: /app/auth?invite=CODE */
  inviteCode?: string;
}

export function AuthScreen({ initialMode, inviteCode }: AuthScreenProps) {
  const [mode, setMode] = useState(initialMode);

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    // Держим режим в адресе, чтобы ссылкой можно было поделиться; сервер при этом не дёргаем
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className={styles.screen}>
      <ThemeToggle className={styles.themeToggle} />

      <main className={styles.card}>
        <header className={styles.header}>
          <Logo size={44} className={styles.logo} />
          <h1 className={styles.title}>{COPY[mode].title}</h1>
          <p className={styles.subtitle}>{COPY[mode].subtitle}</p>
        </header>

        <AuthModeToggle value={mode} onChange={handleModeChange} panelId={PANEL_ID} />

        <div role="tabpanel" id={PANEL_ID} aria-labelledby={getAuthTabId(mode)}>
          {mode === "login" ? <LoginForm /> : <RegisterForm initialInviteCode={inviteCode} />}
        </div>
      </main>
    </div>
  );
}
