/*
 * Работа с markdown-разметкой в поле ввода: команды панели форматирования
 * применяются к тексту и выделению, не зная ничего о DOM.
 * Благодаря этому их легко читать и проверять, а компонент отвечает
 * только за то, чтобы вернуть каретку на место.
 */

/** Текст и выделение до применения команды */
export interface TextSelection {
  text: string;
  start: number;
  end: number;
}

/** Текст и выделение после применения команды */
export interface TextEdit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export type MarkdownCommand =
  /** Парные маркеры вокруг выделения: **жирный**, *курсив*, ~~зачёркнутый~~, `код` */
  | { kind: "wrap"; marker: string; placeholder: string }
  | { kind: "heading"; level: 1 | 2 | 3 }
  | { kind: "quote" }
  | { kind: "bullet-list" }
  | { kind: "ordered-list" }
  | { kind: "link" }
  | { kind: "code-block" }
  | { kind: "table"; rows: number; columns: number };

const HEADING_PATTERN = /^#{1,6} +/;
const QUOTE_PATTERN = /^> ?/;
const BULLET_PATTERN = /^[-*+] +/;
const ORDERED_PATTERN = /^\d+\. +/;

function edit(text: string, selectionStart: number, selectionEnd: number): TextEdit {
  return { text, selectionStart, selectionEnd };
}

/** Границы строк, которых касается выделение: команды абзацного уровня работают по целым строкам */
function getLinesRange(text: string, start: number, end: number): [number, number] {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndIndex = text.indexOf("\n", end);
  return [lineStart, lineEndIndex === -1 ? text.length : lineEndIndex];
}

/**
 * Оборачивает выделение парными маркерами. Повторный вызов снимает оформление —
 * причём и когда маркеры попали в выделение, и когда остались за его границами.
 */
function wrap(selection: TextSelection, marker: string, placeholder: string): TextEdit {
  const { text, start, end } = selection;
  const selected = text.slice(start, end);

  if (selected.length >= marker.length * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(marker.length, -marker.length);
    return edit(text.slice(0, start) + inner + text.slice(end), start, start + inner.length);
  }

  const isWrappedOutside =
    start >= marker.length && text.slice(start - marker.length, start) === marker && text.slice(end, end + marker.length) === marker;

  if (isWrappedOutside) {
    const next = text.slice(0, start - marker.length) + selected + text.slice(end + marker.length);
    return edit(next, start - marker.length, end - marker.length);
  }

  const body = selected || placeholder;
  const next = text.slice(0, start) + marker + body + marker + text.slice(end);
  const bodyStart = start + marker.length;
  return edit(next, bodyStart, bodyStart + body.length);
}

/**
 * Ставит (или снимает) префикс у каждой строки выделения.
 * `pattern` описывает все префиксы того же вида, чтобы «Заголовок 2» заменял «Заголовок 1»,
 * а не приписывался к нему.
 */
function prefixLines(
  selection: TextSelection,
  makePrefix: (index: number) => string,
  pattern: RegExp,
  placeholder: string,
): TextEdit {
  const { text, start, end } = selection;
  const [blockStart, blockEnd] = getLinesRange(text, start, end);
  const lines = text.slice(blockStart, blockEnd).split("\n");

  const meaningful = lines.filter((line) => line.trim().length > 0);
  const shouldRemove =
    meaningful.length > 0 && meaningful.every((line, index) => line.startsWith(makePrefix(index)));

  const nextLines = lines.map((line, index) => {
    const bare = line.replace(pattern, "");
    if (shouldRemove) return bare;
    // Пустая строка под курсором — подставляем подсказку, чтобы было что набирать поверх
    return makePrefix(index) + (bare || (lines.length === 1 ? placeholder : ""));
  });

  const block = nextLines.join("\n");
  const next = text.slice(0, blockStart) + block + text.slice(blockEnd);

  // Одну строку выделяем целиком (без префикса), несколько — весь блок
  if (lines.length === 1) {
    const prefixLength = shouldRemove ? 0 : makePrefix(0).length;
    return edit(next, blockStart + prefixLength, blockStart + block.length);
  }

  return edit(next, blockStart, blockStart + block.length);
}

/** Из выделения делает подпись ссылки; адрес остаётся выделенным, чтобы сразу вставить его */
function insertLink(selection: TextSelection): TextEdit {
  const { text, start, end } = selection;
  const selected = text.slice(start, end);
  const label = selected || "текст ссылки";
  const url = "https://";
  const snippet = `[${label}](${url})`;
  const next = text.slice(0, start) + snippet + text.slice(end);
  const urlStart = start + label.length + 3;
  return edit(next, urlStart, urlStart + url.length);
}

/** Вставляет блок отдельным абзацем: сверху и снизу остаётся пустая строка */
function insertBlock(selection: TextSelection, block: string, innerOffset = 0, innerLength = 0): TextEdit {
  const { text, start, end } = selection;
  const before = text.slice(0, start);
  const after = text.slice(end);

  const leading = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trailing = after.startsWith("\n") || after.length === 0 ? "\n" : "\n\n";

  const next = before + leading + block + trailing + after;
  const blockStart = before.length + leading.length;

  if (innerLength > 0) {
    return edit(next, blockStart + innerOffset, blockStart + innerOffset + innerLength);
  }

  return edit(next, blockStart, blockStart + block.length);
}

function insertCodeBlock(selection: TextSelection): TextEdit {
  const selected = selection.text.slice(selection.start, selection.end);
  const body = selected || "код";
  return insertBlock(selection, `\`\`\`\n${body}\n\`\`\``, 4, body.length);
}

/** Заготовка GFM-таблицы: первая строка — шапка, `rows` считает её тоже */
function buildTable(rows: number, columns: number): string {
  const header = Array.from({ length: columns }, (_, index) => `Колонка ${index + 1}`);
  const widths = header.map((title) => title.length);

  const line = (cells: string[]) => `| ${cells.map((cell, index) => cell.padEnd(widths[index])).join(" | ")} |`;

  const divider = `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`;
  const body = Array.from({ length: Math.max(rows - 1, 1) }, () => line(header.map(() => "")));

  return [line(header), divider, ...body].join("\n");
}

function insertTable(selection: TextSelection, rows: number, columns: number): TextEdit {
  const table = buildTable(rows, columns);
  // Выделяем заголовок первой колонки — с него удобно начать заполнение
  return insertBlock(selection, table, 2, "Колонка 1".length);
}

export function applyMarkdownCommand(command: MarkdownCommand, selection: TextSelection): TextEdit {
  switch (command.kind) {
    case "wrap":
      return wrap(selection, command.marker, command.placeholder);
    case "heading":
      return prefixLines(selection, () => `${"#".repeat(command.level)} `, HEADING_PATTERN, "Заголовок");
    case "quote":
      return prefixLines(selection, () => "> ", QUOTE_PATTERN, "Цитата");
    case "bullet-list":
      return prefixLines(selection, () => "- ", BULLET_PATTERN, "Пункт списка");
    case "ordered-list":
      return prefixLines(selection, (index) => `${index + 1}. `, ORDERED_PATTERN, "Пункт списка");
    case "link":
      return insertLink(selection);
    case "code-block":
      return insertCodeBlock(selection);
    case "table":
      return insertTable(selection, command.rows, command.columns);
  }
}

/**
 * Разметка → читаемая строка для превью в списке чатов и заголовках.
 * Не парсер: достаточно убрать служебные символы, не превращая текст в кашу.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " код ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^ {0,3}#{1,6} +/gm, "")
    .replace(/^ {0,3}> ?/gm, "")
    .replace(/^ {0,3}(?:[-*+]|\d+\.) +/gm, "")
    .replace(/^ {0,3}(?:[-*_] *){3,}$/gm, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\|(.+)\|$/gm, (_, row: string) =>
      // Строка-разделитель таблицы в превью не нужна
      /^[\s|:-]+$/.test(row) ? "" : row.split("|").map((cell) => cell.trim()).filter(Boolean).join(" · "),
    )
    .replace(/\s+/g, " ")
    .trim();
}
