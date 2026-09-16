import type { CurrentUser } from "../model/types";

/*
 * Пользователь-заглушка до появления API сессий.
 * Изменения из настроек профиля хранятся в памяти вкладки и сбрасываются при перезагрузке.
 */
let mockCurrentUser: CurrentUser = {
  id: "u-me",
  firstName: "Алексей",
  lastName: "Морозов",
  displayName: "Алексей Морозов",
  username: "alexey",
  phone: null,
};

export function getMockCurrentUser(): CurrentUser {
  return mockCurrentUser;
}

export function setMockCurrentUser(user: CurrentUser): void {
  mockCurrentUser = user;
}
