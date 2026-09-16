import { useState } from "react";

/**
 * Полная предзагрузка ссылки, когда пользователь к ней потянулся: наведение, касание или фокус.
 * Link на динамический маршрут по умолчанию загружает только оболочку до loading.tsx — переход показывает
 * скелет и ждёт сервер (а React держит скелет минимум 300 мс). Грузить целиком все видимые ссылки накладно,
 * поэтому целиком — только ту, по которой вот-вот нажмут: к клику страница уже на клиенте.
 */
export function usePrefetchOnIntent() {
  const [hasIntent, setHasIntent] = useState(false);
  const markIntent = () => setHasIntent(true);

  return {
    /** Для <Link prefetch>: true — загрузить страницу целиком, null — поведение по умолчанию */
    prefetch: hasIntent ? true : null,
    intentHandlers: { onMouseEnter: markIntent, onTouchStart: markIntent, onFocus: markIntent },
  };
}
