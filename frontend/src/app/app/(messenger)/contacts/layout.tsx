import { MobileRouteGuard } from "@/shared/routing";

export default function ContactsLayout({ children }: LayoutProps<"/app/contacts">) {
  return (
    <>
      <MobileRouteGuard />
      {children}
    </>
  );
}
