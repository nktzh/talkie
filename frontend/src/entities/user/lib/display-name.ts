import type { CurrentUser } from "../model/types";

export function getDisplayName({ firstName, lastName }: Pick<CurrentUser, "firstName" | "lastName">): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}
