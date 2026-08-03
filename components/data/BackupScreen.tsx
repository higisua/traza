"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/forms/Button";
import { useToast } from "@/components/feedback/Toast";
import {
  APP_VERSION,
  TRAZA_EXPORT_SCHEMA_VERSION,
  runExport,
} from "@/features/data";

export function BackupScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [doneFilename, setDoneFilename] = useState<string | null>(null);

  async function createBackup() {
    setBusy(true);
    try {
      const result = await runExport({
        format: "json",
        period: "all",
        historyKind: "backup",
      });
      setDoneFilename(result.filename);
      showToast("Copia de seguridad lista", "success");
    } catch (error) {
      console.error(error);
      showToast("No se pudo crear la copia", "danger");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Copia de seguridad"
          onBack={() => router.push("/more/data")}
        />

        <p className="mt-2 text-caption text-text-secondary">
          Guarda absolutamente toda la aplicación: seguimiento, entrenamientos,
          biblioteca, rutinas y ajustes. Es el único formato restaurable.
        </p>

        <div className="mt-6 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
          <p className="text-label font-semibold uppercase tracking-label text-text-muted">
            Qué incluye
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-[15px] text-text-primary">
            <li>Todos los registros de salud y actividad</li>
            <li>Sesiones, ejercicios y rutinas</li>
            <li>Configuración del perfil</li>
            <li>
              Esquema v{TRAZA_EXPORT_SCHEMA_VERSION} · App {APP_VERSION}
            </li>
          </ul>
        </div>

        <p className="mt-4 text-caption text-text-secondary">
          Esto no es un informe para leer: es una copia completa para conservar
          o restaurar. Para revisar o analizar tu evolución, usa Revisar mi
          evolución o Analizar mi evolución.
        </p>

        {doneFilename ? (
          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-[20px] bg-primary/20 p-4 ring-1 ring-primary/40">
              <p className="text-[16px] font-semibold text-text-primary">
                Copia creada
              </p>
              <p className="mt-1 break-all text-[13px] text-text-secondary">
                {doneFilename}
              </p>
            </div>
            <PrimaryButton onClick={() => router.push("/more/data")}>
              Volver a Datos e informes
            </PrimaryButton>
            <SecondaryButton onClick={() => void createBackup()} loading={busy}>
              Crear otra copia
            </SecondaryButton>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <PrimaryButton onClick={() => void createBackup()} loading={busy}>
              Crear copia JSON
            </PrimaryButton>
            <SecondaryButton onClick={() => router.push("/more/data/export")}>
              Prefiero revisar mi evolución
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
