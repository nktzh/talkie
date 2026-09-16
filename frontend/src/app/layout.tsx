import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { getPanelSizesStyle } from "@/shared/panel-sizes/server";
import { getPreferredTheme } from "@/shared/theme/server";
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

export const viewport: Viewport = {
  // Страница заходит под вырезы и полосу «домой», иначе env(safe-area-inset-*) в iOS всегда 0.
  // Отступы от них расставлены в вёрстке через --safe-area-* из tokens.css
  viewportFit: "cover",
  // Chrome на Android (108+) по умолчанию не сжимает layout viewport под клавиатуру — поле ввода уходило бы под неё
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#070708" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [theme, panelSizes] = await Promise.all([getPreferredTheme(), getPanelSizesStyle()]);

  return (
    <html
      lang="ru"
      className={`${inter.variable} ${robotoMono.variable}`}
      data-theme={theme ?? undefined}
      style={panelSizes}
    >
      <body>{children}</body>
    </html>
  );
}
