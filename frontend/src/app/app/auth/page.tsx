import type { Metadata } from "next";
import { AuthScreen, type AuthMode } from "@/features/auth";

export const metadata: Metadata = {
  title: "Вход",
};

function resolveAuthMode(mode: string | string[] | undefined, inviteCode: string | undefined): AuthMode {
  if (mode === "login" || mode === "register") return mode;
  // Ссылка-приглашение сразу открывает регистрацию
  return inviteCode ? "register" : "login";
}

export default async function AuthPage({ searchParams }: PageProps<"/app/auth">) {
  const { mode, invite } = await searchParams;
  const inviteCode = typeof invite === "string" ? invite : undefined;

  return <AuthScreen initialMode={resolveAuthMode(mode, inviteCode)} inviteCode={inviteCode} />;
}
