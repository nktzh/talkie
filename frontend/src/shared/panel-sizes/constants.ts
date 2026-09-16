export interface ResizablePanelConfig {
  /** Кука с шириной, выбранной пользователем: сервер сразу отрисует панель нужного размера */
  cookieName: string;
  /** CSS-переменная на <html>. Пока её нет, панель берёт ширину по умолчанию из токенов */
  cssVariable: string;
  minWidth: number;
  maxWidth: number;
}

export const RESIZABLE_PANELS = {
  sidebar: {
    cookieName: "talkie-sidebar-width",
    cssVariable: "--sidebar-custom-width",
    minWidth: 280,
    maxWidth: 560,
  },
  infoPanel: {
    cookieName: "talkie-info-panel-width",
    cssVariable: "--info-panel-custom-width",
    minWidth: 320,
    maxWidth: 600,
  },
} as const satisfies Record<string, ResizablePanelConfig>;

export type ResizablePanelId = keyof typeof RESIZABLE_PANELS;

export function clampPanelWidth(panel: ResizablePanelId, width: number): number {
  const { minWidth, maxWidth } = RESIZABLE_PANELS[panel];
  return Math.round(Math.min(Math.max(width, minWidth), maxWidth));
}

/** Ширина из куки. null — значение отсутствует или испорчено, остаётся ширина по умолчанию */
export function parsePanelWidth(panel: ResizablePanelId, value: string | undefined): number | null {
  const width = Number(value);
  return value && Number.isFinite(width) ? clampPanelWidth(panel, width) : null;
}
