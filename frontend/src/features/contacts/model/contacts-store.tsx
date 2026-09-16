"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Contact } from "../types";

interface ContactsStoreValue {
  contacts: Contact[];
  addContact: (contact: Contact) => void;
}

const ContactsStoreContext = createContext<ContactsStoreValue | null>(null);

interface ContactsStoreProviderProps {
  initialContacts: Contact[];
  children: ReactNode;
}

function sortContacts(contacts: readonly Contact[]): Contact[] {
  return [...contacts].sort((a, b) => a.displayName.localeCompare(b.displayName, "ru-RU"));
}

export function ContactsStoreProvider({ initialContacts, children }: ContactsStoreProviderProps) {
  const [contacts, setContacts] = useState(() => sortContacts(initialContacts));

  const value: ContactsStoreValue = {
    contacts,
    addContact: (contact) => setContacts((current) => sortContacts([...current, contact])),
  };

  return <ContactsStoreContext value={value}>{children}</ContactsStoreContext>;
}

export function useContactsStore(): ContactsStoreValue {
  const store = useContext(ContactsStoreContext);
  if (!store) {
    throw new Error("useContactsStore должен использоваться внутри ContactsStoreProvider");
  }
  return store;
}
