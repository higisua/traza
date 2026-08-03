"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { SecondaryButton } from "@/components/forms/Button";
import {
  APP_VERSION,
  EXPORT_TYPE_LABELS_ES,
  formatBytesEs,
  getStorageInfo,
  TRAZA_EXPORT_SCHEMA_VERSION,
  type ExportFormat,
  type StorageInfo,
} from "@/features/data";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function formatWhen(iso: string | null): string {
  if (!iso) return "Nunca";
  try {
    return format(parseISO(iso), "d MMM yyyy · HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

function typeLabel(formatId: string | null): string {
  if (!formatId) return "—";
  return (
    EXPORT_TYPE_LABELS_ES[formatId as ExportFormat] ?? formatId
  );
}

export function StorageInfoScreen() {
  const router = useRouter();
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    try {
      setInfo(getStorageInfo());
      setLoadError(false);
    } catch {
      setInfo(null);
      setLoadError(true);
    }
  }, []);

  const rows = useMemo(() => {
    if (!info) return [];
    const c = info.recordCounts;
    return [
      ["Peso", c.weightEntries],
      ["Tensión", c.bloodPressureEntries],
      ["Sueño", c.sleepEntries],
      ["Pasos", c.stepEntries],
      ["Medidas", c.bodyMeasurements],
      ["Entrenamientos", c.workoutSessions],
      ["Plantillas legacy", c.workoutTemplates],
      ["Ejercicios", c.exercises],
      ["Rutinas", c.routines],
      ["Versiones de rutina", c.routineVersions],
    ] as const;
  }, [info]);

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Almacenamiento"
          onBack={() => router.push("/more/data")}
        />

        <p className="mt-2 text-caption text-text-secondary">
          Toda tu información vive en este dispositivo. Sin nube en esta fase.
        </p>

        {loadError ? (
          <p className="mt-6 text-body text-text-secondary">
            No se ha podido leer el almacenamiento local.
          </p>
        ) : !info ? (
          <p className="mt-6 text-body text-text-secondary">Cargando…</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Última exportación
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                <Row label="Tipo" value={typeLabel(info.lastExportFormat)} />
                <Row label="Fecha" value={formatWhen(info.lastExportAt)} />
                <Row
                  label="Periodo"
                  value={info.lastExportPeriodLabel ?? "—"}
                />
              </dl>
            </div>

            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Última copia
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                <Row label="Fecha" value={formatWhen(info.lastBackupAt)} />
                <Row
                  label="Versión"
                  value={info.lastBackupAppVersion ?? APP_VERSION}
                />
                <Row
                  label="schemaVersion"
                  value={
                    info.lastBackupSchemaVersion != null
                      ? String(info.lastBackupSchemaVersion)
                      : "—"
                  }
                />
              </dl>
            </div>

            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Espacio y registros
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                <Row
                  label="Tamaño aprox."
                  value={formatBytesEs(info.approximateBytes)}
                />
                <Row
                  label="Total registros"
                  value={String(info.totalRecords)}
                />
              </dl>
            </div>

            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Versiones
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                <Row label="App" value={info.appVersion} />
                <Row
                  label="Esquema actual"
                  value={`schemaVersion ${TRAZA_EXPORT_SCHEMA_VERSION}`}
                />
                <Row label="Prefijo local" value={info.storagePrefix} />
                <Row label="Perfil" value={info.settingsDisplayName || "—"} />
              </dl>
            </div>

            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Detalle por dominio
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                {rows.map(([label, count]) => (
                  <Row key={label} label={label} value={String(count)} />
                ))}
              </dl>
            </div>

            <SecondaryButton onClick={() => router.push("/more/data/backup")}>
              Crear copia de seguridad
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="max-w-[55%] truncate text-right font-semibold tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}
