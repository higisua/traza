"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  formatDistanceToNow,
  isToday,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { PageHeader } from "@/components/common/PageHeader";
import { SecondaryButton } from "@/components/forms/Button";
import {
  contentSummaryEs,
  historyPurposeLabelEs,
  historyTypeLabelEs,
  listExportHistory,
  type ExportHistoryEntry,
} from "@/features/data";

function relativeLabel(iso: string): string {
  try {
    const date = parseISO(iso);
    if (isToday(date)) return "Hoy";
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  } catch {
    return iso;
  }
}

function absoluteLabel(iso: string): string {
  try {
    return format(parseISO(iso), "d MMM yyyy · HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export function ExportHistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<ExportHistoryEntry[] | null>(null);

  useEffect(() => {
    try {
      setEntries(listExportHistory());
    } catch {
      setEntries([]);
    }
  }, []);

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Historial"
          onBack={() => router.push("/more/data")}
        />

        <p className="mt-2 text-caption text-text-secondary">
          La historia de tu información: tipo, propósito, periodo y fecha. Los
          archivos no se guardan en TRAZA.
        </p>

        {entries == null ? (
          <p className="mt-6 text-body text-text-secondary">Cargando…</p>
        ) : entries.length === 0 ? (
          <div className="mt-6 rounded-[20px] bg-surface p-4 ring-1 ring-black/[0.03]">
            <p className="text-[15px] font-semibold text-text-primary">
              Aún no hay informes
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">
              Cuando generes un informe o una copia, aparecerá aquí.
            </p>
            <SecondaryButton
              className="mt-4"
              onClick={() => router.push("/more/data")}
            >
              Ir a Datos e informes
            </SecondaryButton>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold text-text-primary">
                    {relativeLabel(entry.at)}
                  </p>
                  <p className="text-caption text-text-muted">
                    {absoluteLabel(entry.at)}
                  </p>
                </div>
                <p className="mt-2 text-[15px] font-medium text-text-primary">
                  {historyTypeLabelEs(entry.format)}
                </p>
                <p className="mt-0.5 text-[13px] text-text-secondary">
                  {historyPurposeLabelEs(entry)}
                </p>
                <p className="mt-1 text-[13px] text-text-muted">
                  {entry.periodLabel} · {contentSummaryEs(entry.content)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
