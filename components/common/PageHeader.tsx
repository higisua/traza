"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ title, onBack, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-[length:var(--traza-page-header-height)] items-center gap-2",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] text-text-primary transition-colors duration-[var(--traza-duration-fast)] hover:bg-surface-secondary/80"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
      ) : (
        <div className="w-2" />
      )}

      <h1 className="min-w-0 flex-1 truncate text-section font-semibold leading-title tracking-title text-text-primary">
        {title}
      </h1>

      {action ? <div className="shrink-0">{action}</div> : <div className="w-2" />}
    </header>
  );
}
