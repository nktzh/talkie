/**
 * Медиазапрос мобильной раскладки: узкое окно или телефон в ландшафте.
 * В CSS это `@media (--mobile)` из shared/styles/media.css — условия должны совпадать.
 */
export const MOBILE_MEDIA_QUERY = "(max-width: 767px), (pointer: coarse) and (max-height: 500px)";

/** До этой ширины панель «Информация» закрывает собой чат. Совпадает с ChatInfoPanel.module.css */
export const INFO_PANEL_OVERLAY_MAX_WIDTH = 900;

/**
 * Мобильная ли сейчас вёрстка. Только для обработчиков событий: при рендере на сервере
 * окна ещё нет, а вычисленное заранее значение разошлось бы с разметкой при гидратации.
 */
export function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}
