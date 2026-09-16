const LOCALE = "ru-RU";
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat(LOCALE, { weekday: "short" });
const dayMonthFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long" });
const numericDateFormat = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "2-digit" });
const compactNumberFormat = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const numberFormat = new Intl.NumberFormat(LOCALE);
const pluralRules = new Intl.PluralRules(LOCALE);

export interface PluralForms {
  one: string;
  few: string;
  many: string;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Разница в календарных днях: 0 — сегодня, 1 — вчера */
function calendarDaysBetween(date: Date, now: Date): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
}

export function isSameDay(a: string, b: string): boolean {
  return calendarDaysBetween(new Date(a), new Date(b)) === 0;
}

export function pluralize(count: number, forms: PluralForms): string {
  const category = pluralRules.select(count);
  return category === "one" || category === "few" ? forms[category] : forms.many;
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** Дата в списке чатов: время — сегодня, день недели — на этой неделе, иначе число */
export function formatChatListDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = calendarDaysBetween(date, now);

  if (days === 0) return formatTime(iso);
  if (days < 7) return weekdayFormat.format(date);
  return numericDateFormat.format(date);
}

export function formatDaySeparator(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = calendarDaysBetween(date, now);

  if (days === 0) return "Сегодня";
  if (days === 1) return "Вчера";

  const label = dayMonthFormat.format(date);
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()} г.`;
}

export function formatLastSeen(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / MINUTE_MS);

  if (minutes < 1) return "был(а) только что";
  if (minutes < 60) {
    return `был(а) ${minutes} ${pluralize(minutes, { one: "минуту", few: "минуты", many: "минут" })} назад`;
  }

  const days = calendarDaysBetween(date, now);
  if (days === 0) return `был(а) сегодня в ${formatTime(iso)}`;
  if (days === 1) return `был(а) вчера в ${formatTime(iso)}`;
  return `был(а) ${dayMonthFormat.format(date)}`;
}

/** «842 подписчика», «12,5 тыс. подписчиков» */
export function formatCount(count: number, forms: PluralForms): string {
  if (count >= 10_000) return `${compactNumberFormat.format(count)} ${forms.many}`;
  return `${numberFormat.format(count)} ${pluralize(count, forms)}`;
}

export function formatViews(count: number): string {
  return count >= 1000 ? compactNumberFormat.format(count) : String(count);
}

/** 7400 → «0:07», 83000 → «1:23» */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const fileSizeFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const FILE_SIZE_UNITS = ["Б", "КБ", "МБ", "ГБ"];

/** 1536 → «1,5 КБ» */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${fileSizeFormat.format(value)} ${FILE_SIZE_UNITS[unitIndex]}`;
}
