export type AuthMode = "login" | "register";

export interface LoginPayload {
  login: string;
  password: string;
}

export interface RegisterPayload {
  inviteCode: string;
  login: string;
  password: string;
}

export interface RegisterFormValues extends RegisterPayload {
  passwordConfirmation: string;
}
