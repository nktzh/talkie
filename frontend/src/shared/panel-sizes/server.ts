import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { RESIZABLE_PANELS, parsePanelWidth, type ResizablePanelId } from "./constants";

/** CSS-переменные с шириной панелей, которую пользователь выставил раньше. Вешаются на <html> */
export async function getPanelSizesStyle(): Promise<CSSProperties> {
  const cookieStore = await cookies();
  const style: Record<string, string> = {};

  for (const panel of Object.keys(RESIZABLE_PANELS) as ResizablePanelId[]) {
    const { cookieName, cssVariable } = RESIZABLE_PANELS[panel];
    const width = parsePanelWidth(panel, cookieStore.get(cookieName)?.value);
    if (width !== null) style[cssVariable] = `${width}px`;
  }

  return style as CSSProperties;
}
