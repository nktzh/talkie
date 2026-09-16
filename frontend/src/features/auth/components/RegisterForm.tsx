"use client";

import { LockPasswordIcon, Ticket01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { PASSWORD_MIN_LENGTH, USERNAME_HINT, USERNAME_MAX_LENGTH } from "@/entities/user";
import { readString } from "@/shared/lib/form";
import { Button, FormAlert, TextField } from "@/shared/ui";
import { register } from "../api/auth";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateRegisterForm } from "../lib/validation";
import type { RegisterFormValues } from "../types";
import styles from "./AuthForm.module.css";

function readRegisterValues(formData: FormData): RegisterFormValues {
  return {
    inviteCode: readString(formData, "inviteCode").trim(),
    login: readString(formData, "login").trim(),
    password: readString(formData, "password"),
    passwordConfirmation: readString(formData, "passwordConfirmation"),
  };
}

function submitRegistration(values: RegisterFormValues): Promise<void> {
  return register({
    inviteCode: values.inviteCode,
    login: values.login,
    password: values.password,
  });
}

interface RegisterFormProps {
  initialInviteCode?: string;
}

export function RegisterForm({ initialInviteCode }: RegisterFormProps) {
  const { errors, formError, isPending, handleSubmit, clearFieldError } = useAuthForm({
    readValues: readRegisterValues,
    validate: validateRegisterForm,
    submit: submitRegistration,
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Пригласительный код"
        name="inviteCode"
        icon={Ticket01Icon}
        defaultValue={initialInviteCode}
        placeholder="Код из приглашения"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        error={errors.inviteCode}
        onChange={() => clearFieldError("inviteCode")}
      />
      <TextField
        label="Логин"
        name="login"
        icon={UserIcon}
        placeholder="Придумайте логин"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={USERNAME_MAX_LENGTH}
        hint={USERNAME_HINT}
        error={errors.login}
        onChange={() => clearFieldError("login")}
      />
      <TextField
        label="Пароль"
        name="password"
        type="password"
        icon={LockPasswordIcon}
        placeholder={`Не менее ${PASSWORD_MIN_LENGTH} символов`}
        autoComplete="new-password"
        error={errors.password}
        onChange={() => clearFieldError("password")}
      />
      <TextField
        label="Подтверждение пароля"
        name="passwordConfirmation"
        type="password"
        icon={LockPasswordIcon}
        placeholder="Повторите пароль"
        autoComplete="new-password"
        error={errors.passwordConfirmation}
        onChange={() => clearFieldError("passwordConfirmation")}
      />

      {formError && <FormAlert variant="error">{formError}</FormAlert>}

      <Button type="submit" isLoading={isPending} className={styles.submit}>
        Зарегистрироваться
      </Button>
    </form>
  );
}
