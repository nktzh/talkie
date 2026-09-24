"use client";

import {
  CodeIcon,
  GridTableIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  QuoteDownIcon,
  SourceCodeIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Icon, LiquidGlass, type IconSvgElement } from "@/shared/ui";
import type { MarkdownEditor } from "../hooks/useMarkdownEditor";
import type { MarkdownCommand } from "../lib/markdown";
import { MarkdownTableGrid } from "./MarkdownTableGrid";
import styles from "./MarkdownToolbar.module.css";

/*
 * Преломление у краёв ослаблено, как у «Нового чата»: настройки по умолчанию рассчитаны
 * на крупные панели, а на невысокой капсуле линза по контуру съела бы её целиком.
 */
const GLASS_DISPLACEMENT = 24;

/** Сколько пикселей в «строке» для мышей, сообщающих прокрутку строками (deltaMode = 1) */
const WHEEL_LINE_HEIGHT = 16;

interface ToolbarButton {
  icon: IconSvgElement;
  label: string;
  command: MarkdownCommand;
}

/** Кнопки, которые просто применяют команду; сгруппированы так же, как выглядят в панели */
const BUTTON_GROUPS: ToolbarButton[][] = [
  [
    { icon: TextBoldIcon, label: "Жирный (Ctrl+B)", command: { kind: "wrap", marker: "**", placeholder: "жирный текст" } },
    { icon: TextItalicIcon, label: "Курсив (Ctrl+I)", command: { kind: "wrap", marker: "*", placeholder: "курсив" } },
    {
      icon: TextStrikethroughIcon,
      label: "Зачёркнутый",
      command: { kind: "wrap", marker: "~~", placeholder: "зачёркнутый текст" },
    },
  ],
  [
    { icon: CodeIcon, label: "Код в строке (Ctrl+E)", command: { kind: "wrap", marker: "`", placeholder: "код" } },
    { icon: SourceCodeIcon, label: "Блок кода", command: { kind: "code-block" } },
    { icon: QuoteDownIcon, label: "Цитата", command: { kind: "quote" } },
  ],
  [
    { icon: LeftToRightListBulletIcon, label: "Маркированный список", command: { kind: "bullet-list" } },
    { icon: LeftToRightListNumberIcon, label: "Нумерованный список", command: { kind: "ordered-list" } },
    { icon: Link01Icon, label: "Ссылка (Ctrl+K)", command: { kind: "link" } },
  ],
];

const HEADING_LEVELS = [
  { level: 1, icon: Heading01Icon, label: "Заголовок 1" },
  { level: 2, icon: Heading02Icon, label: "Заголовок 2" },
  { level: 3, icon: Heading03Icon, label: "Заголовок 3" },
] as const;

interface MarkdownToolbarProps {
  editor: MarkdownEditor;
  isPreview: boolean;
  onTogglePreview: () => void;
}

/**
 * Панель форматирования над композером: кнопки — в отдельной стеклянной капсуле,
 * предпросмотр — стеклянной кнопкой справа. На телефоне у кнопки остаётся только значок.
 */
export function MarkdownToolbar({ editor, isPreview, onTogglePreview }: MarkdownToolbarProps) {
  const previewLabel = isPreview ? "Правка" : "Просмотр";
  const { ref: toolsRef, isOverflowing } = useScrollableTools();

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Форматирование">
      <LiquidGlass radius={999} displacementScale={GLASS_DISPLACEMENT} className={styles.toolsGlass}>
        <div ref={toolsRef} className={styles.tools}>
          <ToolbarMenu icon={Heading01Icon} label="Заголовок" disabled={isPreview}>
            {(close) => (
              <div className={styles.headingMenu}>
                {HEADING_LEVELS.map(({ level, icon, label }) => (
                  <button
                    key={level}
                    type="button"
                    className={styles.headingItem}
                    onClick={() => {
                      editor.run({ kind: "heading", level });
                      close();
                    }}
                  >
                    <Icon icon={icon} size={18} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </ToolbarMenu>

          {BUTTON_GROUPS.map((group, index) => (
            <div key={index} className={styles.group}>
              {group.map(({ icon, label, command }) => (
                <button
                  key={label}
                  type="button"
                  className={styles.tool}
                  title={label}
                  aria-label={label}
                  disabled={isPreview}
                  onClick={() => editor.run(command)}
                >
                  <Icon icon={icon} size={18} />
                </button>
              ))}
            </div>
          ))}

          <ToolbarMenu icon={GridTableIcon} label="Таблица" disabled={isPreview}>
            {(close) => (
              <MarkdownTableGrid
                onPick={(rows, columns) => {
                  editor.run({ kind: "table", rows, columns });
                  close();
                }}
              />
            )}
          </ToolbarMenu>
        </div>

        {/*
          Подсказка про колесо. Лежит рядом с лентой, а не внутри неё: прокрутка обрезала бы её.
          С клавиатуры кнопки за краем доступны табом, поэтому для скринридеров скрыта.
        */}
        {isOverflowing && (
          <p className={styles.hint} aria-hidden="true">
            <ScrollingMouse />
            Прокрутите колесом мыши
          </p>
        )}
      </LiquidGlass>

      <LiquidGlass radius={999} displacementScale={GLASS_DISPLACEMENT} className={styles.previewGlass}>
        <button
          type="button"
          className={cn(styles.preview, isPreview && styles.previewActive)}
          title={previewLabel}
          aria-label={previewLabel}
          aria-pressed={isPreview}
          onClick={onTogglePreview}
        >
          <Icon icon={isPreview ? ViewOffIcon : ViewIcon} size={18} />
          <span className={styles.previewLabel}>{previewLabel}</span>
        </button>
      </LiquidGlass>
    </div>
  );
}

/** Мышь с колесом, по которому бежит точка — показывает, каким жестом листать ленту */
function ScrollingMouse() {
  return (
    <svg className={styles.mouse} viewBox="0 0 16 22" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="14" height="20" rx="7" stroke="currentColor" strokeWidth="1.5" />
      <circle className={styles.wheel} cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Колесо мыши прокручивает ленту вбок: полосы прокрутки у неё нет, а смахнуть её,
 * как пальцем, мышью нечем. Слушатель вешаем сами, а не через onWheel: у React он
 * пассивный, и preventDefault в нём не сработал бы.
 *
 * Заодно сообщает, помещаются ли кнопки: если нет — над лентой показывается подсказка.
 */
function useScrollableTools() {
  const ref = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const tools = ref.current;
    if (!tools) return;

    function handleWheel(this: HTMLDivElement, event: WheelEvent) {
      // Горизонтальный жест трекпада браузер прокручивает сам
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const limit = this.scrollWidth - this.clientWidth;
      // У края отдаём прокрутку странице, иначе колесо над лентой переставало бы работать вовсе
      if (limit <= 0) return;
      if (event.deltaY < 0 ? this.scrollLeft <= 0 : this.scrollLeft >= limit) return;

      event.preventDefault();
      this.scrollLeft += event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * WHEEL_LINE_HEIGHT : event.deltaY;
    }

    // Не пассивный: иначе preventDefault не остановит прокрутку страницы
    tools.addEventListener("wheel", handleWheel, { passive: false });

    // Стрелочной, а не объявлением: у поднимаемой функции TypeScript теряет сужение tools
    const measure = () => setIsOverflowing(tools.scrollWidth > tools.clientWidth);

    // Сразу, не дожидаясь кадра: колбэк наблюдателя приходит только вместе с отрисовкой,
    // а её может не быть — например, пока вкладка скрыта
    measure();

    // Дальше ширина ленты меняется вместе с окном
    const observer = new ResizeObserver(measure);
    observer.observe(tools);

    return () => {
      tools.removeEventListener("wheel", handleWheel);
      observer.disconnect();
    };
  }, []);

  return { ref, isOverflowing };
}

interface ToolbarMenuProps {
  icon: IconSvgElement;
  label: string;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
}

/** Отступ меню от кнопки и минимальный зазор до краёв окна, px */
const POPOVER_GAP = 8;

/** Кнопка с всплывающей панелью: закрывается по Escape и по клику мимо */
function ToolbarMenu({ icon, label, disabled, children }: ToolbarMenuProps) {
  const [isRequested, setIsRequested] = useState(false);
  // Панель форматирования гаснет вместе с режимом предпросмотра — меню не должно «зависнуть» открытым
  const isOpen = isRequested && !disabled;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsRequested(false);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setIsRequested(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  /*
   * Меню вынесено из потока ленты (position: fixed), поэтому место над кнопкой считаем сами.
   * Слой до отрисовки: иначе кадр между открытием и расчётом меню показало бы в углу окна.
   */
  useLayoutEffect(() => {
    if (!isOpen) return;

    function place() {
      const trigger = triggerRef.current;
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const anchor = trigger.getBoundingClientRect();
      // У края окна меню упирается в него, а не уезжает за границу
      const maxLeft = window.innerWidth - popover.offsetWidth - POPOVER_GAP;
      popover.style.left = `${Math.max(POPOVER_GAP, Math.min(anchor.left, maxLeft))}px`;
      popover.style.bottom = `${window.innerHeight - anchor.top + POPOVER_GAP}px`;
    }

    place();
    window.addEventListener("resize", place);
    // Захват: лента кнопок и переписка прокручиваются сами, их события до окна не всплывают
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={styles.menu}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(styles.tool, isOpen && styles.toolActive)}
        title={label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        disabled={disabled}
        onClick={() => setIsRequested((open) => !open)}
      >
        <Icon icon={icon} size={18} />
      </button>

      {isOpen && (
        <div ref={popoverRef} id={popoverId} className={styles.popover} role="dialog" aria-label={label}>
          {children(() => setIsRequested(false))}
        </div>
      )}
    </div>
  );
}
