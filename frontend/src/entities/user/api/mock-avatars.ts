import type { UserId } from "../model/types";

/*
 * Фото-заглушки: настоящих аватаров в моках нет, поэтому рисуем их в SVG.
 * Часть собеседников остаётся без фото — на них видно запасной вариант с инициалами.
 */
export function mockAvatar(hue: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 66% 68%)"/>` +
    `<stop offset="1" stop-color="hsl(${hue + 40} 58% 40%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="128" height="128" fill="url(#g)"/>` +
    `<circle cx="64" cy="50" r="23" fill="#ffffff" fill-opacity="0.88"/>` +
    `<ellipse cx="64" cy="126" rx="39" ry="33" fill="#ffffff" fill-opacity="0.88"/>` +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Аватары по идентификатору: в чатах и контактах у человека одно и то же фото */
export const MOCK_AVATARS: Partial<Record<UserId, string>> = {
  "u-anna": mockAvatar(210),
  "u-max": mockAvatar(28),
  "u-dmitry": mockAvatar(150),
  "u-olga": mockAvatar(320),
  "u-ivan": mockAvatar(260),
  "b-talkie": mockAvatar(190),
};
