"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/forms/Button";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import {
  applyBackup,
  parseBackupJson,
  type RestoreMode,
  type RestoreSummary,
  type TrazaBackupPayload,
} from "@/features/data";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Phase = "idle" | "preview" | "done";

function contentLines(summary: RestoreSummary): string[] {
  const c = summary.recordCounts;
  const lines: string[] = [];
  if (c.weightEntries) lines.push(`Peso (${c.weightEntries})`);
  if (c.bloodPressureEntries) lines.push(`Tensión (${c.bloodPressureEntries})`);
  if (c.sleepEntries) lines.push(`Sueño (${c.sleepEntries})`);
  if (c.stepEntries) lines.push(`Pasos (${c.stepEntries})`);
  if (c.bodyMeasurements) lines.push(`Medidas (${c.bodyMeasurements})`);
  if (c.workoutSessions) lines.push(`Entrenamientos (${c.workoutSessions})`);
  if (c.exercises) lines.push(`Ejercicios (${c.exercises})`);
  if (c.routines) lines.push(`Rutinas (${c.routines})`);
  if (c.routineVersions) lines.push(`Versiones de rutina (${c.routineVersions})`);
  if (lines.length === 0) return ["Sin registros de dominio"];
  return lines;
}

export function RestoreScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [payload, setPayload] = useState<TrazaBackupPayload | null>(null);
  const [summary, setSummary] = useState<RestoreSummary | null>(null);
  const [confirmMode, setConfirmMode] = useState<RestoreMode | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseBackupJson(text);
      if (!result.ok) {
        showToast(result.error, "danger");
        return;
      }
      setFileName(file.name);
      setPayload(result.payload);
      setSummary(result.summary);
      setPhase("preview");
    } catch {
      showToast("No se pudo leer el archivo", "danger");
    }
  }

  function runApply(mode: RestoreMode) {
    if (!payload) return;
    setBusy(true);
    try {
      applyBackup(payload, mode);
      setPhase("done");
      setConfirmMode(null);
      showToast(
        mode === "replace"
          ? "Datos reemplazados con la copia"
          : "Datos fusionados con la copia",
        "success",
      );
    } catch (error) {
      console.error(error);
      showToast("No se pudo restaurar", "danger");
    } finally {
      setBusy(false);
    }
  }

  const exportedLabel = summary?.exportedAt
    ? (() => {
        try {
          return format(parseISO(summary.exportedAt), "d MMM yyyy · HH:mm", {
            locale: es,
          });
        } catch {
          return summary.exportedAt;
        }
      })()
    : "—";

  const totalRecords = summary
    ? Object.values(summary.recordCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader title="Restaurar copia" onBack={() => router.push("/more/data")} />

        <p className="mt-2 text-caption text-text-secondary">
          Solo se aceptan copias JSON de TRAZA. Nunca se restaura
          automáticamente: revisas el resumen y eliges reemplazar, fusionar o
          cancelar.
        </p>

        {phase === "idle" ? (
          <div className="mt-6 flex flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
            <PrimaryButton onClick={() => inputRef.current?.click()}>
              Elegir copia JSON
            </PrimaryButton>
            <SecondaryButton onClick={() => router.push("/more/data/backup")}>
              Crear una copia primero
            </SecondaryButton>
          </div>
        ) : null}

        {phase === "preview" && summary ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Resumen antes de restaurar
              </p>
              <dl className="mt-3 flex flex-col gap-2 text-[15px]">
                <Row label="Archivo" value={fileName ?? "—"} />
                <Row
                  label="Versión"
                  value={`App ${summary.appVersion} · esquema v${summary.schemaVersion}`}
                />
                <Row label="Fecha" value={exportedLabel} />
                <Row label="Registros" value={String(totalRecords)} />
              </dl>

              <p className="mt-4 text-label font-semibold uppercase tracking-label text-text-muted">
                Contenido
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {contentLines(summary).map((line) => (
                  <li key={line} className="text-[13px] text-text-secondary">
                    {line}
                  </li>
                ))}
              </ul>

              {summary.warnings.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {summary.warnings.map((w) => (
                    <li key={w} className="text-[13px] text-warning">
                      {w}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <p className="text-caption text-text-secondary">
              <strong className="font-semibold text-text-primary">Reemplazar</strong>{" "}
              borra los datos actuales y deja solo la copia.{" "}
              <strong className="font-semibold text-text-primary">Fusionar</strong>{" "}
              une por id (si hay conflicto, gana el registro más reciente).
            </p>

            <p className="text-label font-semibold uppercase tracking-label text-text-muted">
              Acciones
            </p>
            <DangerButton onClick={() => setConfirmMode("replace")} disabled={busy}>
              Reemplazar
            </DangerButton>
            <PrimaryButton onClick={() => setConfirmMode("merge")} disabled={busy}>
              Fusionar
            </PrimaryButton>
            <GhostButton
              onClick={() => {
                setPhase("idle");
                setPayload(null);
                setSummary(null);
                setFileName(null);
              }}
            >
              Cancelar
            </GhostButton>
          </div>
        ) : null}

        {phase === "done" ? (
          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-[20px] bg-primary/20 p-4 ring-1 ring-primary/40">
              <p className="text-[16px] font-semibold text-text-primary">
                Restauración completada
              </p>
              <p className="mt-1 text-[13px] text-text-secondary">
                Los datos ya están en este dispositivo. Revisa Progreso o
                Calendario para comprobarlos.
              </p>
            </div>
            <PrimaryButton onClick={() => router.push("/more/data")}>
              Volver a Mis datos
            </PrimaryButton>
            <SecondaryButton onClick={() => router.push("/")}>
              Ir a Inicio
            </SecondaryButton>
          </div>
        ) : null}
      </div>

      <ConfirmationDialog
        open={confirmMode === "replace"}
        title="¿Reemplazar todos los datos?"
        description="Se borrarán los datos actuales de este dispositivo y se cargará la copia. Esta acción no se puede deshacer."
        confirmLabel="Reemplazar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={() => runApply("replace")}
        onCancel={() => setConfirmMode(null)}
      />

      <ConfirmationDialog
        open={confirmMode === "merge"}
        title="¿Fusionar con tus datos?"
        description="Se añadirán registros nuevos de la copia. Si un id ya existe, se conserva el más reciente. No se inventan identificadores."
        confirmLabel="Fusionar"
        cancelLabel="Cancelar"
        tone="neutral"
        onConfirm={() => runApply("merge")}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-text-secondary">{label}</dt>
      <dd className="max-w-[65%] break-all text-right font-semibold tabular-nums text-text-primary">
        {value}
      </dd>
    </div>
  );
}
