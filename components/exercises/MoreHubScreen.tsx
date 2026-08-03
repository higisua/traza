"use client";

import Link from "next/link";
import { ChevronRight, Database, Dumbbell, Settings2 } from "lucide-react";

export function MoreHubScreen() {
  return (
    <div className="flex flex-col pt-6 pb-8">
      <h1 className="text-section font-bold leading-title tracking-title text-text-primary">
        Más
      </h1>
      <p className="mt-2 text-caption text-text-secondary">
        Gestión de entrenamiento, datos y ajustes.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        <li>
          <Link
            href="/more/training"
            className="flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03] transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]"
          >
            <span className="flex size-[48px] items-center justify-center rounded-[14px] bg-primary/25 text-text-primary">
              <Dumbbell size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-text-primary">
                Gestión de entrenamiento
              </span>
              <span className="mt-0.5 block text-[13px] text-text-secondary">
                Biblioteca de ejercicios y rutinas
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Link>
        </li>
        <li>
          <Link
            href="/more/data"
            className="flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03] transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]"
          >
            <span className="flex size-[48px] items-center justify-center rounded-[14px] bg-primary/25 text-text-primary">
              <Database size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-text-primary">
                Datos e informes
              </span>
              <span className="mt-0.5 block text-[13px] text-text-secondary">
                Revisar · analizar · conservar · restaurar
              </span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-text-muted" />
          </Link>
        </li>
        <li>
          <div className="flex items-center gap-3 rounded-[20px] bg-surface/70 p-4 ring-1 ring-black/[0.03] opacity-70">
            <span className="flex size-[48px] items-center justify-center rounded-[14px] bg-surface-secondary text-text-muted">
              <Settings2 size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-text-primary">
                Ajustes
              </span>
              <span className="mt-0.5 block text-[13px] text-text-secondary">
                Próximamente
              </span>
            </span>
          </div>
        </li>
      </ul>
    </div>
  );
}
