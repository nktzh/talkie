import { MobileRouteGuard } from "@/shared/routing";

export default function AccountLayout({ children }: LayoutProps<"/app/account">) {
  return (
    <>
      <MobileRouteGuard />
      {children}
    </>
  );
}
