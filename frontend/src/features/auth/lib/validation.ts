import { validateNewPassword, validatePasswordConfirmation, validateUsername } from "@/entities/user";
import type { FieldErrors } from "@/shared/lib/form";
import type { LoginPayload, RegisterFormValues } from "../types";

/** При входе проверяем только заполненность: правила могли меняться после регистрации */
export function validateLoginForm(values: LoginPayload): FieldErrors<LoginPayload> {
  return {
    login: values.login ? undefined : "Введите логин",
    password: values.password ? undefined : "Введите пароль",
  };
}

export function validateRegisterForm(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  return {
    inviteCode: values.inviteCode ? undefined : "Введите пригласительный код",
    login: validateUsername(values.login, "Введите логин"),
    password: validateNewPassword(values.password),
    passwordConfirmation: validatePasswordConfirmation(values.password, values.passwordConfirmation),
  };
}
