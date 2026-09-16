"use client";

import { LockPasswordIcon } from "@hugeicons/core-free-icons";
import { PASSWORD_MIN_LENGTH, changePassword, useCurrentUser } from "@/entities/user";
import { readString, useFormSubmit } from "@/shared/lib/form";
import { Button, FormAlert, TextField } from "@/shared/ui";
import { validatePasswordChangeForm } from "../lib/validation";
import type { PasswordChangeFormValues } from "../types";
import styles from "./SettingsForm.module.css";

function readPasswordChangeValues(formData: FormData): PasswordChangeFormValues {
  return {
    currentPassword: readString(formData, "currentPassword"),
    newPassword: readString(formData, "newPassword"),
    newPasswordConfirmation: readString(formData, "newPasswordConfirmation"),
  };
}

function submitPasswordChange(values: PasswordChangeFormValues): Promise<void> {
  return changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
}

export function SecuritySettings() {
  const { user } = useCurrentUser();

  const { errors, formError, status, isPending, handleSubmit, clearFieldError } = useFormSubmit({
    readValues: readPasswordChangeValues,
    validate: validatePasswordChangeForm,
    submit: submitPasswordChange,
    onSuccess: (_values, form) => form.reset(),
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Скрытый логин подсказывает менеджеру паролей, для какого аккаунта меняется пароль */}
      <input type="text" name="username" autoComplete="username" value={user.username} readOnly hidden />

      <TextField
        label="Текущий пароль"
        name="currentPassword"
        type="password"
        icon={LockPasswordIcon}
        autoComplete="current-password"
        error={errors.currentPassword}
        onChange={() => clearFieldError("currentPassword")}
      />
      <TextField
        label="Новый пароль"
        name="newPassword"
        type="password"
        icon={LockPasswordIcon}
        autoComplete="new-password"
        hint={`Не менее ${PASSWORD_MIN_LENGTH} символов`}
        error={errors.newPassword}
        onChange={() => clearFieldError("newPassword")}
      />
      <TextField
        label="Повторите новый пароль"
        name="newPasswordConfirmation"
        type="password"
        icon={LockPasswordIcon}
        autoComplete="new-password"
        error={errors.newPasswordConfirmation}
        onChange={() => clearFieldError("newPasswordConfirmation")}
      />

      {formError && <FormAlert variant="error">{formError}</FormAlert>}
      {status === "success" && <FormAlert variant="success">Пароль изменён</FormAlert>}

      <div className={styles.actions}>
        <Button type="submit" isLoading={isPending} className={styles.submit}>
          Сменить пароль
        </Button>
      </div>
    </form>
  );
}
