import type { Metadata } from "next";
import { ContactsPanel } from "@/features/contacts";

export const metadata: Metadata = {
  title: "Контакты",
};

export default function ContactsPage() {
  return <ContactsPanel titleId="contacts-page-title" />;
}
