import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Иконка для «На экран Домой» в iOS. Отдельно от icon.svg, потому что iOS не понимает SVG
 * и заливает прозрачный фон чёрным — поэтому знак кладём на белую подложку с отступами
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <svg width="116" height="116" viewBox="0 0 96 96" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48 0C74.5097 0 96 21.4903 96 48C96 74.5097 74.5097 96 48 96H8C3.58172 96 1.28855e-07 92.4183 0 88V48C0 21.4903 21.4903 0 48 0ZM30 36C26.6863 36 24 38.6863 24 42V54C24 57.3137 26.6863 60 30 60C33.3137 60 36 57.3137 36 54V42C36 38.6863 33.3137 36 30 36ZM66 36C62.6863 36 60 38.6863 60 42V54C60 57.3137 62.6863 60 66 60C69.3137 60 72 57.3137 72 54V42C72 38.6863 69.3137 36 66 36Z"
            fill="#3F8FF2"
          />
        </svg>
      </div>
    ),
    size,
  );
}
