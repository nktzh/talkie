import { AccountPanelSkeleton } from "@/features/settings";

/**
 * Страница вкладки лежит в группе (overview), чтобы у неё и у разделов [section] были свои
 * границы загрузки: общая loading.tsx в account показывала бы заглушку вкладки и при переходе в раздел
 */
export default function AccountLoading() {
  return <AccountPanelSkeleton />;
}
