import type { Metadata } from "next";
import { AccountPanel } from "@/features/settings";

export const metadata: Metadata = {
  title: "Аккаунт",
};

export default function AccountPage() {
  return <AccountPanel />;
}
