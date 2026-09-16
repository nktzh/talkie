export type SettingsTabId = "profile" | "security";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
}

export interface PasswordChangeFormValues {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}
