import { validatePhone, validateUsername } from "@/entities/user";
import type { FieldErrors } from "@/shared/lib/form";
import type { ContactFormValues } from "../types";

/** Контакт опознаётся по никнейму, поэтому имя, фамилия и телефон необязательны */
export function validateContactForm(values: ContactFormValues): FieldErrors<ContactFormValues> {
  return {
    phone: validatePhone(values.phone),
    username: validateUsername(values.username, "Введите никнейм"),
  };
}
