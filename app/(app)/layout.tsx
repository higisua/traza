import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <main className="px-5 pt-safe sm:px-6">{children}</main>
      <BottomNavigation />
    </AppShell>
  );
}
