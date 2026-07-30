import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function ModulesLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell withBottomNav={false}>
      <main className="pt-safe">{children}</main>
    </AppShell>
  );
}
