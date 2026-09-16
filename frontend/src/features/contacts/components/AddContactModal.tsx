"use client";

import { AtIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { NAME_MAX_LENGTH, USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/entities/user";
import { readString, useFormSubmit } from "@/shared/lib/form";
import { Button, FormAlert, Modal, ModalCloseButton, TextField } from "@/shared/ui";
import { addContact } from "../api/contacts-api";
import { useContactsStore } from "../model/contacts-store";
import { validateContactForm } from "../lib/validation";
import type { ContactFormValues } from "../types";
import styles from "./AddContactModal.module.css";

const TITLE_ID = "add-contact-title";

function readContactValues(formData: FormData): ContactFormValues {
  return {
    firstName: readString(formData, "firstName").trim(),
    lastName: readString(formData, "lastName").trim(),
    phone: readString(formData, "phone").trim(),
    username: readString(formData, "username").trim().replace(/^@/, ""),
  };
}

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddContactModal({ open, onClose }: AddContactModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={TITLE_ID}>
      <AddContactForm onClose={onClose} />
    </Modal>
  );
}

/** Монтируется при каждом открытии модалки, поэтому поля всегда чистые */
function AddContactForm({ onClose }: { onClose: () => void }) {
  const { addContact: saveToStore } = useContactsStore();

  const { errors, formError, isPending, handleSubmit, clearFieldError } = useFormSubmit({
    readValues: readContactValues,
    validate: validateContactForm,
    submit: async (values) => {
      saveToStore(await addContact(values));
    },
    onSuccess: onClose,
  });

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 id={TITLE_ID} className={styles.title}>
            Новый контакт
          </h2>
          <p className={styles.description}>Добавьте собеседника, чтобы начать общение</p>
        </div>
        <ModalCloseButton onClose={onClose} />
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Имя (необязательно)"
          name="firstName"
          autoComplete="given-name"
          maxLength={NAME_MAX_LENGTH}
          error={errors.firstName}
          onChange={() => clearFieldError("firstName")}
        />

        <TextField
          label="Фамилия (необязательно)"
          name="lastName"
          autoComplete="family-name"
          maxLength={NAME_MAX_LENGTH}
          error={errors.lastName}
          onChange={() => clearFieldError("lastName")}
        />

        <TextField
          label="Номер телефона (необязательно)"
          name="phone"
          type="tel"
          inputMode="tel"
          icon={SmartPhone01Icon}
          placeholder="+7 900 123-45-67"
          autoComplete="tel"
          error={errors.phone}
          onChange={() => clearFieldError("phone")}
        />

        <TextField
          label="Никнейм"
          name="username"
          icon={AtIcon}
          placeholder="nickname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX_LENGTH + 1}
          hint={USERNAME_HINT}
          error={errors.username}
          onChange={() => clearFieldError("username")}
        />

        {formError && <FormAlert variant="error">{formError}</FormAlert>}

        <Button type="submit" isLoading={isPending} className={styles.submit}>
          Добавить
        </Button>
      </form>
    </div>
  );
}
