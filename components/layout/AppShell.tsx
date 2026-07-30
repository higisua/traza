import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  withBottomNav?: boolean;
};

export function AppShell({
  children,
  className,
  withBottomNav = true,
}: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <div
        className={cn(
          "mx-auto min-h-dvh w-full max-w-[length:var(--traza-content-max)]",
          withBottomNav && "pb-[calc(var(--traza-bottom-nav-height)+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
