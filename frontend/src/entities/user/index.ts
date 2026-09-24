export {
  changePassword,
  getCurrentUser,
  removeAvatar,
  updateAvatar,
  updateProfile,
  updateStatus,
} from "./api/user-api";
export { getDisplayName } from "./lib/display-name";
export {
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_HINT,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizePhone,
  validateNewPassword,
  validatePasswordConfirmation,
  validatePhone,
  validateUsername,
} from "./lib/validation";
export { CurrentUserProvider, useCurrentUser } from "./model/current-user";
export type { CurrentUser, PasswordChange, ProfileUpdate, User, UserId } from "./model/types";
