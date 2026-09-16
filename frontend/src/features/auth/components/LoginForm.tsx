"use client";

import { LockPasswordIcon, UserIcon } from "@hugeicons/core-free-icons";
import { readString } from "@/shared/lib/form";
import { Button, FormAlert, TextField } from "@/shared/ui";
import { login } from "../api/auth";
import { useAuthForm } from "../hooks/useAuthForm";
import { validateLoginForm } from "../lib/validation";
import type { LoginPayload } from "../types";
import styles from "./AuthForm.module.css";

function readLoginValues(formData: FormData): LoginPayload {
  return {
    login: readString(formData, "login").trim(),
    password: readString(formData, "password"),
  };
}

export function LoginForm() {
  const { errors, formError, isPending, handleSubmit, clearFieldError } = useAuthForm({
    readValues: readLoginValues,
    validate: validateLoginForm,
    submit: login,
  });

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Логин"
        name="login"
        icon={UserIcon}
        placeholder="Ваш логин"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.login}
        onChange={() => clearFieldError("login")}
      />
      <TextField
        label="Пароль"
        name="password"
        type="password"
        icon={LockPasswordIcon}
        placeholder="Ваш пароль"
        autoComplete="current-password"
        error={errors.password}
        onChange={() => clearFieldError("password")}
      />

      {formError && <FormAlert variant="error">{formError}</FormAlert>}

      <Button type="submit" isLoading={isPending} className={styles.submit}>
        Войти
      </Button>
    </form>
  );
}
