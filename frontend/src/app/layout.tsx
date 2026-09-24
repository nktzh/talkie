import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { getPanelSizesStyle } from "@/shared/panel-sizes/server";
import { FaviconLink, THEME_BACKGROUNDS } from "@/shared/theme";
import { getPreferredAccent, getPreferredTheme } from "@/shared/theme/server";
import "@/shared/styles/tokens.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/**
 * Моноширинный шрифт для кода в markdown-сообщениях. Нужен редко, поэтому не предзагружается:
 * файл скачается, только когда на экране появится блок кода
 */
const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Talkie",
    template: "%s · Talkie",
  },
  description: "Мессенджер Talkie",
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getPreferredTheme();

  return {
    // Страница заходит под вырезы и полосу «домой», иначе env(safe-area-inset-*) в iOS всегда 0.
    // Отступы от них расставлены в вёрстке через --safe-area-* из tokens.css
    viewportFit: "cover",
    // Chrome на Android (108+) по умолчанию не сжимает layout viewport под клавиатуру — поле ввода уходило бы под неё
    interactiveWidget: "resizes-content",
    /*
     * Строка состояния (часы, заряд) на мобильных красится в фон приложения.
     * Тема выбрана вручную — цвет один и тот же при любой системной настройке,
     * выбора нет — отдаём обе и идём за системой
     */
    themeColor: theme
      ? THEME_BACKGROUNDS[theme]
      : [
          { media: "(prefers-color-scheme: light)", color: THEME_BACKGROUNDS.light },
          { media: "(prefers-color-scheme: dark)", color: THEME_BACKGROUNDS.dark },
        ],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [theme, accent, panelSizes] = await Promise.all([
    getPreferredTheme(),
    getPreferredAccent(),
    getPanelSizesStyle(),
  ]);

  return (
    <html
      lang="ru"
      className={`${inter.variable} ${robotoMono.variable}`}
      data-theme={theme ?? undefined}
      data-accent={accent}
      style={panelSizes}
    >
      <body>
        <FaviconLink theme={theme} accent={accent} />
        {children}
      </body>
    </html>
  );
}
