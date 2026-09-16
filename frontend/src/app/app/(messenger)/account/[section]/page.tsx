import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SettingsScreen, getSettingsTab } from "@/features/settings";

export async function generateMetadata({ params }: PageProps<"/app/account/[section]">): Promise<Metadata> {
  const { section } = await params;

  return { title: getSettingsTab(section)?.label ?? "Настройки" };
}

export default async function AccountSectionPage({ params }: PageProps<"/app/account/[section]">) {
  const { section } = await params;
  const tab = getSettingsTab(section);

  if (!tab) notFound();

  return <SettingsScreen tab={tab} />;
}
