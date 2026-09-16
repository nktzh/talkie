import { useCallback, useSyncExternalStore } from "react";

/**
 * Совпадает ли медиазапрос, с подпиской на изменения.
 * На сервере и при гидратации — false, чтобы разметка совпала с серверной
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
