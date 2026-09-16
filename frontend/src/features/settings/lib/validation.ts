import {
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhone,
  validateUsername,
} from "@/entities/user";
import type { FieldErrors } from "@/shared/lib/form";
import type { PasswordChangeFormValues, ProfileFormValues } from "../types";

export function validateProfileForm(values: ProfileFormValues): FieldErrors<ProfileFormValues> {
  return {
    firstName: values.firstName ? undefined : "Введите имя",
    username: validateUsername(values.username, "Введите никнейм"),
    phone: validatePhone(values.phone),
  };
}

export function validatePasswordChangeForm(values: PasswordChangeFormValues): FieldErrors<PasswordChangeFormValues> {
  const errors: FieldErrors<PasswordChangeFormValues> = {
    currentPassword: values.currentPassword ? undefined : "Введите текущий пароль",
    newPassword: validateNewPassword(values.newPassword, "Введите новый пароль"),
    newPasswordConfirmation: validatePasswordConfirmation(values.newPassword, values.newPasswordConfirmation),
  };

  if (!errors.newPassword && values.newPassword === values.currentPassword) {
    errors.newPassword = "Новый пароль должен отличаться от текущего";
  }

  return errors;
}
