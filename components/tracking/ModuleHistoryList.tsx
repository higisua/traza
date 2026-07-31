"use client";

import { AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type ModuleHistoryListProps = {
  count: number;
  children: ReactNode;
  footer?: ReactNode;
  hint?: string;
};

export function ModuleHistoryList({
  count,
  children,
  footer,
  hint = "Pulsa para editar · Desliza para eliminar",
}: ModuleHistoryListProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Historial
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-text-muted">{hint}</p>
        </div>
        <p className="shrink-0 text-[11px] font-medium text-text-muted">
          {count} {count === 1 ? "registro" : "registros"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {children}
        </AnimatePresence>
        {footer}
      </div>
    </section>
  );
}
