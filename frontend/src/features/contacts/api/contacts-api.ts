import { getDisplayName, normalizePhone } from "@/entities/user";
import { delay } from "@/shared/lib/delay";
import type { Contact, ContactFormValues } from "../types";

/*
 * Список контактов. Пока бэкенд не готов — заглушки в памяти вкладки.
 * Контракт: при неуспехе функции бросают Error с понятным пользователю сообщением.
 */

let mockContacts: Contact[] = [
  {
    id: "u-anna",
    firstName: "Анна",
    lastName: "Смирнова",
    displayName: "Анна Смирнова",
    username: "anna_sm",
    phone: "+79001234567",
  },
  {
    id: "u-max",
    firstName: "Максим",
    lastName: "Орлов",
    displayName: "Максим Орлов",
    username: "orlov",
    phone: "+79007654321",
  },
];

export async function getContacts(): Promise<Contact[]> {
  return mockContacts;
}

export async function addContact(values: ContactFormValues): Promise<Contact> {
  await delay(500);

  const username = values.username.replace(/^@/, "");
  if (mockContacts.some((contact) => contact.username === username)) {
    throw new Error("Такой контакт уже добавлен");
  }

  const contact: Contact = {
    id: `u-${username}`,
    firstName: values.firstName,
    lastName: values.lastName,
    // Имя необязательно — без него в списке показываем ник
    displayName: getDisplayName(values) || username,
    username,
    phone: normalizePhone(values.phone),
  };
  mockContacts = [...mockContacts, contact];
  return contact;
}
