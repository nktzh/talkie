import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export type { IconSvgElement } from "@hugeicons/react";

export type IconProps = HugeiconsIconProps;

/** Обёртка над Hugeicons с едиными по проекту размером и толщиной линий */
export function Icon({ size = 20, strokeWidth = 1.8, ...props }: IconProps) {
  return <HugeiconsIcon size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...props} />;
}
