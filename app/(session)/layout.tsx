import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell withBottomNav={false}>
      <main>{children}</main>
    </AppShell>
  );
}
