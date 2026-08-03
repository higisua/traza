"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ClipboardList,
  Download,
  FileSpreadsheet,
  HardDrive,
  History,
  Shield,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton } from "@/components/forms/Button";
import { useToast } from "@/components/feedback/Toast";
import { cn } from "@/lib/utils/cn";
import { runExport } from "@/features/data";

export function DataHubScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [busyExcel, setBusyExcel] = useState(false);

  async function exportAllExcel() {
    setBusyExcel(true);
    try {
      const result = await runExport({
        format: "excel",
        period: "all",
        purpose: "analysis",
      });
      showToast(`Excel listo · ${result.filename}`, "success");
    } catch (error) {
      console.error(error);
      showToast("No se pudo generar el Excel", "danger");
    } finally {
      setBusyExcel(false);
    }
  }

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader title="Datos e informes" onBack={() => router.push("/more")} />

        <p className="mt-2 text-caption text-text-secondary">
          Aquí vive tu evolución. Revísala, consérvala, compártela o
          analízala — siempre en local.
        </p>

        <section className="mt-6">
          <p className="text-label font-semibold uppercase tracking-label text-text-muted">
            Acción rápida
          </p>
          <PrimaryButton
            className="mt-3 min-h-[56px] text-[16px]"
            onClick={() => void exportAllExcel()}
            loading={busyExcel}
          >
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet size={20} strokeWidth={2} />
              Exportar todo → Excel
            </span>
          </PrimaryButton>
          <p className="mt-2 text-caption text-text-secondary">
            Formato recomendado para análisis completos. Todo tu historial en
            un solo libro.
          </p>
        </section>

        <section className="mt-8">
          <p className="text-label font-semibold uppercase tracking-label text-text-muted">
            Revisar y analizar
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <HubLink
              href="/more/data/export"
              icon={Download}
              title="Revisar mi evolución"
              description="Elige periodo, contenido y genera un informe"
            />
            <HubLink
              href="/more/data/coach"
              icon={ClipboardList}
              title="Analizar mi evolución"
              description="Genera un informe optimizado para compartir con tu entrenador o analizar con ChatGPT"
            />
          </ul>
        </section>

        <section className="mt-8">
          <p className="text-label font-semibold uppercase tracking-label text-text-muted">
            Conservar
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <HubLink
              href="/more/data/backup"
              icon={Shield}
              title="Copia de seguridad"
              description="Guarda toda la app en un JSON restaurable"
            />
            <HubLink
              href="/more/data/restore"
              icon={Upload}
              title="Restaurar copia"
              description="Reemplazar o fusionar desde un JSON"
            />
          </ul>
        </section>

        <section className="mt-8">
          <p className="text-label font-semibold uppercase tracking-label text-text-muted">
            Mi información
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <HubLink
              href="/more/data/history"
              icon={History}
              title="Historial"
              description="Qué generaste, para qué y cuándo"
            />
            <HubLink
              href="/more/data/storage"
              icon={HardDrive}
              title="Almacenamiento"
              description="Registros, espacio y últimas copias"
            />
          </ul>
        </section>
      </div>
    </div>
  );
}

function HubLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Download;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]",
          "transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]",
        )}
      >
        <span className="flex size-[48px] items-center justify-center rounded-[14px] bg-primary/25 text-text-primary">
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-text-primary">
            {title}
          </span>
          <span className="mt-0.5 block text-[13px] text-text-secondary">
            {description}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-text-muted" />
      </Link>
    </li>
  );
}
