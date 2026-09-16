"use client";

import { AtIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import {
  NAME_MAX_LENGTH,
  USERNAME_HINT,
  USERNAME_MAX_LENGTH,
  normalizePhone,
  updateProfile,
  useCurrentUser,
} from "@/entities/user";
import { readString, useFormSubmit } from "@/shared/lib/form";
import { Avatar, Button, FormAlert, TextField } from "@/shared/ui";
import { validateProfileForm } from "../lib/validation";
import type { ProfileFormValues } from "../types";
import styles from "./SettingsForm.module.css";

function readProfileValues(formData: FormData): ProfileFormValues {
  return {
    firstName: readString(formData, "firstName").trim(),
    lastName: readString(formData, "lastName").trim(),
    username: readString(formData, "username").trim().replace(/^@/, ""),
    phone: readString(formData, "phone").trim(),
  };
}

export function ProfileSettings() {
  const { user, setUser } = useCurrentUser();

  const { errors, formError, status, isPending, handleSubmit, clearFieldError } = useFormSubmit({
    readValues: readProfileValues,
    validate: validateProfileForm,
    submit: async (values) => {
      const savedUser = await updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        phone: values.phone ? normalizePhone(values.phone) : null,
      });
      setUser(savedUser);
    },
  });

  return (
    <div className={styles.stack}>
      <header className={styles.profileHeader}>
        <Avatar id={user.id} name={user.displayName} size={72} />
        <p className={styles.profileName}>{user.displayName}</p>
        <p className={styles.profileMeta}>@{user.username}</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Имя"
          name="firstName"
          defaultValue={user.firstName}
          autoComplete="given-name"
          maxLength={NAME_MAX_LENGTH}
          error={errors.firstName}
          onChange={() => clearFieldError("firstName")}
        />
        <TextField
          label="Фамилия"
          name="lastName"
          defaultValue={user.lastName}
          autoComplete="family-name"
          maxLength={NAME_MAX_LENGTH}
          error={errors.lastName}
          onChange={() => clearFieldError("lastName")}
        />

        <TextField
          label="Никнейм"
          name="username"
          icon={AtIcon}
          defaultValue={user.username}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={USERNAME_MAX_LENGTH + 1}
          hint={`По нему вас смогут найти. ${USERNAME_HINT}`}
          error={errors.username}
          onChange={() => clearFieldError("username")}
        />

        <TextField
          label="Номер телефона"
          name="phone"
          type="tel"
          inputMode="tel"
          icon={SmartPhone01Icon}
          defaultValue={user.phone ?? ""}
          placeholder="+7 900 123-45-67"
          autoComplete="tel"
          hint="Необязательно"
          error={errors.phone}
          onChange={() => clearFieldError("phone")}
        />

        {formError && <FormAlert variant="error">{formError}</FormAlert>}
        {status === "success" && <FormAlert variant="success">Изменения сохранены</FormAlert>}

        <div className={styles.actions}>
          <Button type="submit" isLoading={isPending} className={styles.submit}>
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
