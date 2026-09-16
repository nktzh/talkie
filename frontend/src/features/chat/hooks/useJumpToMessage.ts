"use client";

import { useCallback } from "react";
import type { MessageId } from "../model/types";

/** id элемента ленты: по нему к сообщению переходят из панели «Информация» */
export function getMessageElementId(messageId: MessageId): string {
  return `message-${messageId}`;
}

/**
 * Прокручивает ленту к сообщению и коротко подсвечивает его, как в Telegram.
 * Подсветка живёт в data-атрибуте, а не в состоянии: так она перезапускается
 * при повторном клике по тому же сообщению и не перерисовывает всю ленту.
 */
export function useJumpToMessage() {
  return useCallback((messageId: MessageId) => {
    const row = document.getElementById(getMessageElementId(messageId));
    if (!row) return;

    row.scrollIntoView({ block: "center", behavior: "smooth" });

    delete row.dataset.highlighted;
    // Чтение layout сбрасывает анимацию — иначе повторная подсветка не проиграется
    void row.offsetWidth;
    row.dataset.highlighted = "";

    // animationend всплывает от вложенных элементов (плееры, картинки) — ждём именно подсветку строки
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target !== row) return;
      delete row.dataset.highlighted;
      row.removeEventListener("animationend", handleAnimationEnd);
    };
    row.addEventListener("animationend", handleAnimationEnd);
  }, []);
}
