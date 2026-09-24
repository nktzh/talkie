import { ACCENT_ICON_COLORS, DEFAULT_ACCENT, isAccent, isTheme, type Theme } from "@/shared/theme";

/** Знак бренда — тот же контур, что в Logo и apple-icon.tsx */
const GLYPH =
  "M48 0C74.5097 0 96 21.4903 96 48C96 74.5097 74.5097 96 48 96H8C3.58172 96 1.28855e-07 92.4183 0 88V48C0 21.4903 21.4903 0 48 0ZM30 36C26.6863 36 24 38.6863 24 42V54C24 57.3137 26.6863 60 30 60C33.3137 60 36 57.3137 36 54V42C36 38.6863 33.3137 36 30 36ZM66 36C62.6863 36 60 38.6863 60 42V54C60 57.3137 62.6863 60 66 60C69.3137 60 72 57.3137 72 54V42C72 38.6863 69.3137 36 66 36Z";

/*
 * Тема выбрана — знак красится сразу. Выбора нет, значит идём за системной настройкой,
 * и решить её может только медиазапрос внутри самого файла: иконка — отдельный документ,
 * страничный CSS и data-атрибуты на <html> сюда не достают
 */
function renderGlyph(colors: Record<Theme, string>, theme: Theme | null) {
  const path = `<path fill-rule="evenodd" clip-rule="evenodd" d="${GLYPH}"/>`;

  if (theme) return `<style>path{fill:${colors[theme]}}</style>${path}`;

  return (
    `<style>path{fill:${colors.light}}` +
    `@media(prefers-color-scheme:dark){path{fill:${colors.dark}}}</style>${path}`
  );
}

/**
 * Иконка вкладки: знак в акцентном цвете пользователя. Цвет приходит параметрами, а не читается
 * здесь из куки, — браузер держит иконку в кеше по адресу и иначе не заметил бы смену цвета
 */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const accent = params.get("accent");
  const theme = params.get("theme");
  const colors = ACCENT_ICON_COLORS[isAccent(accent) ? accent : DEFAULT_ACCENT];

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `${renderGlyph(colors, isTheme(theme) ? theme : null)}</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      // Цвет въехал в адрес, поэтому ответ по нему не протухнет
      "Cache-Control": "public, max-age=604800",
    },
  });
}
