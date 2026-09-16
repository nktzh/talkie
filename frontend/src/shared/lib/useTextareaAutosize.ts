import { useLayoutEffect, useRef, type RefObject } from "react";

let fieldSizingSupported: boolean | undefined;

/** field-sizing: content есть только в Chromium; Safari и Firefox его пока не знают */
function supportsFieldSizing(): boolean {
  fieldSizingSupported ??= CSS.supports("field-sizing", "content");
  return fieldSizingSupported;
}

/**
 * Запасная автовысота для textarea, где CSS полагается на field-sizing: content.
 * Там, где свойство поддерживается, хук ничего не делает. В остальных браузерах после каждого
 * изменения текста выставляет высоту по содержимому; min-height и max-height из CSS её ограничивают,
 * а сверх max-height поле прокручивается внутри.
 * layoutKey — всё, что меняет высоту помимо текста (класс с другим min-height) или заменяет
 * сам элемент (поле скрывали и показали снова): при его смене высота считается заново.
 */
export function useTextareaAutosize(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  layoutKey?: unknown,
) {
  const widthRef = useRef(0);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || supportsFieldSizing()) return;

    fitToContent(textarea);
  }, [textareaRef, value, layoutKey]);

  // Ширина меняется (поворот телефона, панель информации) — строки переносятся иначе
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || supportsFieldSizing()) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      // Свою же смену высоты пропускаем: иначе замер вызывал бы новый замер
      if (width === widthRef.current) return;

      widthRef.current = width;
      fitToContent(textarea);
    });

    observer.observe(textarea);
    return () => observer.disconnect();
  }, [textareaRef, layoutKey]);
}

function fitToContent(textarea: HTMLTextAreaElement) {
  // Сброс высоты прокручивает длинный текст к началу — запоминаем, где был пользователь
  const { scrollTop } = textarea;
  // Сначала сбрасываем высоту: иначе scrollHeight не уменьшится, когда текст стёрли
  textarea.style.height = "auto";
  // box-sizing: border-box — к высоте содержимого с padding добавляем рамку
  const border = textarea.offsetHeight - textarea.clientHeight;
  textarea.style.height = `${textarea.scrollHeight + border}px`;
  textarea.scrollTop = scrollTop;
}
