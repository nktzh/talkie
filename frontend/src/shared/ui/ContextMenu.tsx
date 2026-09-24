"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import { isMobileViewport } from "@/shared/routing";
import { Icon, type IconSvgElement } from "./Icon";
import { LiquidGlass } from "./LiquidGlass";
import styles from "./ContextMenu.module.css";

/** Отступ меню от краёв окна, px */
const VIEWPORT_GAP = 8;
/** Отступ меню от элемента, над которым оно открыто долгим нажатием, px */
const ANCHOR_GAP = 8;
/** Атрибут элемента, для которого сейчас открыто меню: по нему строка подсвечивается в CSS */
const MENU_OPEN_ATTRIBUTE = "data-menu-open";

export interface ContextMenuState<T> {
  target: T;
  x: number;
  y: number;
  /** Элемент, по которому кликнули: ему вернётся фокус после закрытия с клавиатуры */
  trigger: HTMLElement;
  /**
   * Открыто долгим нажатием: встаёт над элементом (или под ним), а не у пальца, который его закрыл бы.
   * Фокус в меню не переводится — иначе на телефоне спряталась бы клавиатура и сдвинула ленту
   */
  isTouch?: boolean;
  /**
   * Меню кнопки, открытое обычным кликом: как и при долгом нажатии, встаёт у самой кнопки,
   * но фокус, в отличие от касания, переходит на первый пункт
   */
  isAnchored?: boolean;
}

/**
 * Состояние контекстного меню для набора однотипных элементов: одно меню на весь список,
 * а не по экземпляру на каждую строку.
 * open — правый клик, только на десктопе: на мобильных у долгого нажатия на ссылках остаётся
 * системное поведение. Где меню нужно и на телефоне (сообщения, список чатов), долгое нажатие
 * подключают явно — useLongPress + openByLongPress.
 */
export function useContextMenu<T>() {
  const [menu, setMenu] = useState<ContextMenuState<T> | null>(null);

  function open(event: MouseEvent<HTMLElement>, target: T) {
    if (isMobileViewport()) return;
    event.preventDefault();

    const trigger = event.currentTarget;
    let { clientX: x, clientY: y } = event;

    // Меню, вызванное с клавиатуры (Shift+F10), может прийти без координат — открываем у элемента
    if (x === 0 && y === 0) {
      const rect = trigger.getBoundingClientRect();
      x = rect.left + Math.min(rect.width / 2, 24);
      y = rect.top + rect.height / 2;
    }

    setMenu({ target, x, y, trigger });
  }

  /** Меню кнопки: открывается левым кликом и работает одинаково на десктопе и на телефоне */
  function openAtTrigger(event: MouseEvent<HTMLElement>, target: T) {
    const trigger = event.currentTarget;
    const { left, bottom, width } = trigger.getBoundingClientRect();
    setMenu({ target, x: left + width / 2, y: bottom, trigger, isAnchored: true });
  }

  /** Долгое нажатие (useLongPress): trigger — элемент, над которым встанет меню, x и y — точка касания */
  function openByLongPress(target: T, trigger: HTMLElement, x: number, y: number) {
    setMenu({ target, x, y, trigger, isTouch: true });
  }

  return { menu, open, openAtTrigger, openByLongPress, close: () => setMenu(null) };
}

interface ContextMenuProps {
  /** null — меню закрыто */
  menu: Pick<ContextMenuState<unknown>, "x" | "y" | "trigger" | "isTouch" | "isAnchored"> | null;
  onClose: () => void;
  /** Доступное имя меню */
  label: string;
  children: ReactNode;
}

export function ContextMenu({ menu, onClose, label, children }: ContextMenuProps) {
  if (!menu) return null;

  // Портал: лента сообщений прокручивается и обрезает содержимое, а стеклу нужен фон всего окна.
  // Меню, открытое в модальном окне, переносим в него же: всё за пределами окна браузер
  // делает неинтерактивным, и пункты перестали бы нажиматься
  return createPortal(
    <ContextMenuPopup key={`${menu.x}:${menu.y}`} menu={menu} onClose={onClose} label={label}>
      {children}
    </ContextMenuPopup>,
    menu.trigger.closest("dialog") ?? document.body,
  );
}

const CloseMenuContext = createContext<(restoreFocus: boolean) => void>(() => {});

type ContextMenuPopupProps = Omit<ContextMenuProps, "menu"> & { menu: NonNullable<ContextMenuProps["menu"]> };

function ContextMenuPopup({ menu, onClose, label, children }: ContextMenuPopupProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function close(restoreFocus: boolean) {
    if (restoreFocus) menu.trigger.focus();
    onClose();
  }

  const dismiss = useEffectEvent(close);

  // Подсветка элемента, для которого открыто меню, — атрибутом прямо на нём: через состояние списка
  // открытие меню перерисовывало бы все строки, и на телефоне меню появлялось бы с задержкой
  useLayoutEffect(() => {
    menu.trigger.setAttribute(MENU_OPEN_ATTRIBUTE, "");
    return () => menu.trigger.removeAttribute(MENU_OPEN_ATTRIBUTE);
  }, [menu.trigger]);

  // Меню открывается у курсора, но не вылезает за окно: у правого и нижнего края — разворачивается.
  // Содержимое может менять размер (например, раскрыться палитра реакций) — тогда позиция пересчитывается
  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    // Элемент запоминаем при открытии: к моменту раскрытия палитры он мог сдвинуться вместе с лентой
    const anchor = menu.isTouch || menu.isAnchored ? menu.trigger.getBoundingClientRect() : null;

    function place(target: HTMLDivElement) {
      const { width, height } = target.getBoundingClientRect();
      const maxX = window.innerWidth - width - VIEWPORT_GAP;
      const maxY = window.innerHeight - height - VIEWPORT_GAP;
      let x = menu.x > maxX ? menu.x - width : menu.x;
      let y = menu.y > maxY ? menu.y - height : menu.y;

      if (anchor) {
        x = anchor.left + anchor.width / 2 - width / 2;
        const above = anchor.top - ANCHOR_GAP - height;
        const below = anchor.bottom + ANCHOR_GAP;
        // Над элементом, если помещается; иначе под ним; длинный пост не оставляет места — у пальца
        y = above >= VIEWPORT_GAP ? above : below <= maxY ? below : menu.y - height / 2;
      }

      target.style.left = `${Math.max(VIEWPORT_GAP, Math.min(x, maxX))}px`;
      target.style.top = `${Math.max(VIEWPORT_GAP, Math.min(y, maxY))}px`;
    }

    // Верхний слой: меню, открытое внутри модального окна, иначе оказалось бы под ним.
    // Показываем до расстановки — у спрятанного попровера нулевые размеры, и считать её не по чему
    layer.togglePopover?.(true);
    place(layer);
    layer.style.visibility = "visible";
    if (!menu.isTouch) getContextMenuItems(listRef.current)[0]?.focus({ preventScroll: true });

    // Первый вызов наблюдателя приходит сразу после observe и повторяет уже сделанную расстановку:
    // лишний раз считать раскладку при открытии меню как раз и незачем
    let isPlaced = false;
    const observer = new ResizeObserver(() => {
      if (isPlaced) place(layer);
      isPlaced = true;
    });
    observer.observe(layer);
    return () => observer.disconnect();
  }, [menu.x, menu.y, menu.isTouch, menu.isAnchored, menu.trigger]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!layerRef.current?.contains(event.target as Node)) dismiss(false);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss(true);
      }
    }

    // Меню привязано к точке на экране: после прокрутки или смены размеров окна оно указывало бы мимо
    function handleDismiss() {
      dismiss(false);
    }

    // На телефоне высота окна меняется от панели адреса и клавиатуры — закрываемся только при повороте
    const initialWidth = window.innerWidth;
    function handleResize() {
      if (!menu.isTouch || window.innerWidth !== initialWidth) dismiss(false);
    }

    // Прокрутка внутри самого меню (длинная палитра) его не закрывает
    function handleScroll(event: Event) {
      if (!layerRef.current?.contains(event.target as Node)) dismiss(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    window.addEventListener("blur", handleDismiss);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handleDismiss);
    };
  }, [menu.isTouch]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Составной пункт (например, сетка реакций) сам обработал стрелки
    if (event.defaultPrevented) return;

    const items = getContextMenuItems(listRef.current);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);

    const nextIndex = {
      ArrowDown: (current + 1) % items.length,
      ArrowUp: (current - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key];

    if (nextIndex !== undefined) {
      event.preventDefault();
      items[nextIndex]?.focus();
    } else if (event.key === "Tab") {
      event.preventDefault();
      close(true);
    }
  }

  return (
    <div
      ref={layerRef}
      // Меню закрывается нашими обработчиками: у manual нет ни своего «клика мимо», ни Esc
      popover="manual"
      className={styles.layer}
      style={{ left: menu.x, top: menu.y, visibility: "hidden" }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <LiquidGlass radius={16}>
        <div ref={listRef} role="menu" aria-label={label} className={styles.menu} onKeyDown={handleKeyDown}>
          <CloseMenuContext value={close}>{children}</CloseMenuContext>
        </div>
      </LiquidGlass>
    </div>
  );
}

/** Пункты меню, включая menuitemradio и menuitemcheckbox, — в порядке документа */
export function getContextMenuItems(list: Element | null): HTMLButtonElement[] {
  return list ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)')) : [];
}

/**
 * Закрыть меню из собственного пункта — например, из палитры реакций.
 * restoreFocus: вернуть фокус элементу, на котором меню открыли (нужно при выборе с клавиатуры)
 */
export function useCloseContextMenu() {
  return useContext(CloseMenuContext);
}

interface ContextMenuItemProps {
  icon: IconSvgElement;
  label: string;
  /** Необратимое действие подсвечивается красным */
  isDanger?: boolean;
  /** Пункт открывает диалог — например, подтверждение удаления */
  opensDialog?: boolean;
  onSelect: () => void;
}

export function ContextMenuItem({ icon, label, isDanger = false, opensDialog = false, onSelect }: ContextMenuItemProps) {
  const close = useContext(CloseMenuContext);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    // Фокус возвращаем, только если пункт выбран с клавиатуры: после клика мышью рамка фокуса лишняя
    close(event.detail === 0);
    onSelect();
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-haspopup={opensDialog ? "dialog" : undefined}
      className={cn(styles.item, isDanger && styles.danger)}
      onClick={handleClick}
    >
      <Icon icon={icon} size={18} className={styles.icon} />
      <span className={styles.label}>{label}</span>
    </button>
  );
}

export function ContextMenuSeparator() {
  return <div role="separator" className={styles.separator} />;
}
