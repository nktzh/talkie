"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MOBILE_MEDIA_QUERY } from "./breakpoints";

/**
 * Вкладки «Контакты» и «Аккаунт» существуют только на мобильных: на широком экране
 * их роль выполняют модалки из навигационной панели. Поэтому при расширении окна
 * (или при открытии такой ссылки на десктопе) возвращаем пользователя к чатам.
 * Поворот телефона в ландшафт раскладку не меняет и сюда не относится.
 */
export function MobileRouteGuard() {
  const router = useRouter();

  useEffect(() => {
    const isMobile = window.matchMedia(MOBILE_MEDIA_QUERY);

    function redirectFromDesktop() {
      if (!isMobile.matches) router.replace("/app");
    }

    redirectFromDesktop();
    isMobile.addEventListener("change", redirectFromDesktop);
    return () => isMobile.removeEventListener("change", redirectFromDesktop);
  }, [router]);

  return null;
}
