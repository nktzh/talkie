"use client";

import { useId, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import styles from "./LiquidGlass.module.css";

/*
 * Liquid Glass — порт подхода rdev/liquid-glass-react:
 * фон под элементом размывается (backdrop-filter), а затем смещается по карте
 * искажений (feDisplacementMap) отдельно по каналам R/G/B — так получается
 * хроматическая аберрация. Сверху — блик по контуру.
 *
 * Отличия от оригинала продиктованы тем, что фильтр здесь работает не как filter,
 * а внутри backdrop-filter: маска краёв из оригинала (feComposite с SourceGraphic)
 * в этом режиме гасит фон целиком, поэтому спад преломления заложен в саму карту.
 *
 * Преломление — дорогой эффект: фильтр пересчитывается в каждом кадре прокрутки, и мобильные GPU
 * на нём дёргаются. Поэтому полная версия включается только в Chromium на устройствах с мышью.
 * На сенсорных экранах, в Safari и Firefox стекло — это размытие с подложкой: url() внутри
 * backdrop-filter WebKit может не понять и отбросить всё объявление вместе с blur().
 * При prefers-reduced-transparency размытия нет вовсе — только плотная подложка (LiquidGlass.module.css).
 */

/**
 * Карта искажений 128×128: R — смещение по X, B — смещение по Y, 128 — «не смещать».
 * Отклонения только у краёв, середина нейтральная — преломление получается
 * линзой по контуру, и маска краёв из оригинала не нужна.
 *
 * Растр, а не SVG: Chromium не берёт векторную картинку в feImage.
 * И строкой, а не файлом: внешнюю картинку feImage грузит асинхронно,
 * а backdrop-filter после её загрузки уже не пересчитывается.
 */
const DISPLACEMENT_MAP =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAB70lEQVR42u3dL4uVQRwF4ONVWBAEg2WDZYvFYjFZLCaLZYvFYDEYBEFYxD+IIAgGg8WwZYvFssliMVksFovFYDEIgrDsrnu8LPgVHGWew/kE73N/E+ad+86i6bIH6X66l+6kP9Mf6ff0W/o1/ZJ+Tj+lH9MP6fv0Xfo2fZNup6/TV+lWupm+TF+kz9Nn6dP0Sfo4fZQ+TB/8V71/2Hvp3XQjvZPeTm+lN9Mb6fX0Wno1XU+vpJfTS+nF9EJ6Pj2Xnk3PpGvp6XQ1PZWeTE+kx9OV9Fh6ND2S5rCLyNAs8odCh3QJcKADawLGT8AvHVgAAADoWIB9HdglwJ4OrAkwAdNPgKcAAIACmBdgVwfWBFiCLEFqCbIEKQAAajfUbqiagOkmwFMYDODNuFMRAHQggBOygw/negpOR899OloG/0NGAAAQAAAEAAABAEAAABAAAAQAAAEAQAAAEAAABAAAAQBAAAAQAAAEAAABAEAAABAAAAQAAAEAQAAAEAAABAAAAQBAAAAQAAAEAAAB8O8B+HytL+eaAB04AT5h7vP1cwO4xsIVJgB0IIDLvFzk5i5JdZekCVAXOgNQAPMB7OrAmgBLkCVILUGWIAUAQAHYDVW7oSZA/+4EeDPuVAQABTAvgCPKTkfPfTjXz9A/ZCbOb9HfwswRwf95AAAAAElFTkSuQmCC";

interface LiquidGlassProps {
  /** Сила преломления у краёв */
  displacementScale?: number;
  /** Радиус размытия фона, px */
  blurAmount?: number;
  /** Насыщенность фона, % */
  saturation?: number;
  /** Сила хроматической аберрации */
  aberrationIntensity?: number;
  /** Скругление, px */
  radius?: number;
  className?: string;
  children: ReactNode;
}

/** Настройки по умолчанию общие для всего стекла в приложении — меняйте их здесь, а не в местах использования */
export function LiquidGlass({
  displacementScale = 48,
  blurAmount = 12,
  saturation = 180,
  aberrationIntensity = 2,
  radius = 999,
  className,
  children,
}: LiquidGlassProps) {
  const filterId = useId();
  const isRefractive = useRefraction();

  const style = { "--glass-radius": `${radius}px` } as CSSProperties;

  /*
   * Ссылка на SVG-фильтр стоит внутри backdrop-filter, а не в filter: элемент с filter
   * сам становится границей для фона, и размывать ему было бы нечего.
   * Свойство задаётся здесь, а не в CSS-модуле: сборщик выбрасывает его, если внутри
   * функций стоит var().
   */
  const blur = `blur(${blurAmount}px) saturate(${saturation}%)`;
  const backdropFilter = isRefractive ? `url(#${filterId}) ${blur}` : blur;

  return (
    <>
      {/* Фильтр обязан лежать вне стекла: на вложенный в него Chromium не ссылается */}
      {isRefractive && (
        <GlassFilter
          id={filterId}
          displacementScale={displacementScale}
          aberrationIntensity={aberrationIntensity}
        />
      )}

      <div className={cn(styles.glass, className)} style={style}>
        <span
          className={styles.warp}
          style={{ backdropFilter, WebkitBackdropFilter: backdropFilter }}
        />
        <span className={styles.tint} />
        <span className={styles.edge} />

        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}

/** Устройство с мышью: не телефон и не планшет */
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
/** Отдельным запросом: браузер, не знающий этот признак, иначе забраковал бы и первый */
const REDUCED_TRANSPARENCY_QUERY = "(prefers-reduced-transparency: reduce)";

let refractionSupported: boolean | undefined;

/**
 * SVG-фильтр внутри backdrop-filter по-настоящему рисует только Chromium. CSS.supports одного
 * синтаксиса мало — Safari принимает url() при разборе, но не применяет, — поэтому ещё проверяем
 * userAgentData: этот API есть только у Chromium
 */
function supportsRefraction(): boolean {
  refractionSupported ??=
    CSS.supports("backdrop-filter", "url(#a) blur(1px)") && "userAgentData" in navigator;
  return refractionSupported;
}

function subscribeToRefractionQueries(onChange: () => void) {
  const lists = [FINE_POINTER_QUERY, REDUCED_TRANSPARENCY_QUERY].map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

/**
 * Включать ли преломление. На сервере и при гидратации — нет: разметка совпадёт с серверной,
 * а на подходящем устройстве эффект добавится сразу после неё
 */
function useRefraction(): boolean {
  return useSyncExternalStore(
    subscribeToRefractionQueries,
    () =>
      supportsRefraction() &&
      window.matchMedia(FINE_POINTER_QUERY).matches &&
      !window.matchMedia(REDUCED_TRANSPARENCY_QUERY).matches,
    () => false,
  );
}

interface GlassFilterProps {
  id: string;
  displacementScale: number;
  aberrationIntensity: number;
}

/** Смещение по краям, отдельно по каналам R/G/B — отсюда хроматическая аберрация */
function GlassFilter({ id, displacementScale, aberrationIntensity }: GlassFilterProps) {
  return (
    <svg className={styles.filterHost} aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feImage
            x="0"
            y="0"
            width="100%"
            height="100%"
            href={DISPLACEMENT_MAP}
            preserveAspectRatio="none"
            result="MAP"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="MAP"
            scale={-displacementScale}
            xChannelSelector="R"
            yChannelSelector="B"
            result="RED_DISPLACED"
          />
          <feColorMatrix
            in="RED_DISPLACED"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="RED_CHANNEL"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="MAP"
            scale={displacementScale * (-1 - aberrationIntensity * 0.05)}
            xChannelSelector="R"
            yChannelSelector="B"
            result="GREEN_DISPLACED"
          />
          <feColorMatrix
            in="GREEN_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="GREEN_CHANNEL"
          />

          <feDisplacementMap
            in="SourceGraphic"
            in2="MAP"
            scale={displacementScale * (-1 - aberrationIntensity * 0.1)}
            xChannelSelector="R"
            yChannelSelector="B"
            result="BLUE_DISPLACED"
          />
          <feColorMatrix
            in="BLUE_DISPLACED"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="BLUE_CHANNEL"
          />

          {/* Каналы собираются обратно через screen */}
          <feBlend in="GREEN_CHANNEL" in2="BLUE_CHANNEL" mode="screen" result="GB_COMBINED" />
          <feBlend in="RED_CHANNEL" in2="GB_COMBINED" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
