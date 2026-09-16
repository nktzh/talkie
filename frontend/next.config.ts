import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    /*
     * Открытый раз чат при возврате к нему показывается из кеша роутера, без запроса к серверу.
     * Устаревания бояться не нужно: всё, что изменилось за сессию (отправка, удаление, реакции,
     * блокировка), живёт в сторе и накладывается поверх снимка страницы
     */
    staleTimes: {
      dynamic: 300,
    },
  },
};

export default nextConfig;
