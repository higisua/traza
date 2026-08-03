"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/forms/Button";
import { useToast } from "@/components/feedback/Toast";
import { cn } from "@/lib/utils/cn";
import {
  PDF_DETAIL_COPY_ES,
  PERIOD_PRESET_LABELS_ES,
  copyCoachPromptToClipboard,
  resolveExportRange,
  runExport,
  type ExportFormat,
  type ExportPeriodPreset,
  type PdfDetailLevel,
} from "@/features/data";

const PERIODS: ExportPeriodPreset[] = ["7d", "30d", "90d", "year", "all"];

type Phase = "setup" | "ready";

export function CoachReportScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>("setup");
  const [period, setPeriod] = useState<ExportPeriodPreset>("30d");
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [pdfDetail, setPdfDetail] = useState<PdfDetailLevel>("full");
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    try {
      const result = await runExport({
        format: format as ExportFormat,
        period,
        historyKind: "coach",
        purpose: "chatgpt",
        pdfDetail: format === "pdf" ? pdfDetail : undefined,
      });
      setFilename(result.filename);
      setPhase("ready");
      showToast("Informe generado", "success");
    } catch (error) {
      console.error(error);
      showToast("No se pudo generar el informe", "danger");
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt() {
    const range = resolveExportRange(period);
    const ok = await copyCoachPromptToClipboard({
      range,
      preset: period,
      format,
      filename,
    });
    showToast(
      ok ? "Prompt copiado" : "No se pudo copiar el portapapeles",
      ok ? "success" : "danger",
    );
  }

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Analizar mi evolución"
          onBack={() => router.push("/more/data")}
        />

        <p className="mt-2 text-caption text-text-secondary">
          Genera un informe optimizado para compartir con tu entrenador o
          analizar con ChatGPT. TRAZA no habla con ninguna IA: solo prepara el
          archivo y un prompt que pegas tú.
        </p>

        {phase === "setup" ? (
          <div className="mt-6 flex flex-col gap-5">
            <section>
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Periodo
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {PERIODS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPeriod(id)}
                    className={cn(
                      "rounded-[16px] bg-surface px-4 py-3.5 text-left text-[15px] font-semibold text-text-primary ring-1 ring-black/[0.03]",
                      period === id && "bg-primary/10 ring-2 ring-primary",
                    )}
                  >
                    {PERIOD_PRESET_LABELS_ES[id]}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                Formato del informe
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("excel")}
                  className={cn(
                    "rounded-[16px] bg-surface px-4 py-3.5 text-left ring-1 ring-black/[0.03]",
                    format === "excel" && "bg-primary/10 ring-2 ring-primary",
                  )}
                >
                  <span className="block text-[15px] font-semibold text-text-primary">
                    Excel
                  </span>
                  <span className="mt-0.5 block text-[13px] text-text-secondary">
                    Formato recomendado para análisis completos
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={cn(
                    "rounded-[16px] bg-surface px-4 py-3.5 text-left ring-1 ring-black/[0.03]",
                    format === "pdf" && "bg-primary/10 ring-2 ring-primary",
                  )}
                >
                  <span className="block text-[15px] font-semibold text-text-primary">
                    Informe TRAZA
                  </span>
                  <span className="mt-0.5 block text-[13px] text-text-secondary">
                    Informe narrativo de tu evolución
                  </span>
                </button>
              </div>
            </section>

            {format === "pdf" ? (
              <section>
                <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                  Nivel de detalle
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {(Object.keys(PDF_DETAIL_COPY_ES) as PdfDetailLevel[]).map(
                    (level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPdfDetail(level)}
                        className={cn(
                          "rounded-[16px] bg-surface px-4 py-3.5 text-left ring-1 ring-black/[0.03]",
                          pdfDetail === level &&
                            "bg-primary/10 ring-2 ring-primary",
                        )}
                      >
                        <span className="block text-[15px] font-semibold text-text-primary">
                          {PDF_DETAIL_COPY_ES[level].title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-text-secondary">
                          {PDF_DETAIL_COPY_ES[level].description}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <PrimaryButton onClick={() => void generate()} loading={busy}>
              Generar informe
            </PrimaryButton>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <div className="rounded-[20px] bg-primary/20 p-4 ring-1 ring-primary/40">
              <p className="text-[16px] font-semibold text-text-primary">
                Tu informe está listo para analizarlo
              </p>
              <p className="mt-1 text-[13px] text-text-secondary">
                Adjunta el archivo ({filename ?? "informe"}) y pega el prompt.
                ChatGPT no está integrado en TRAZA.
              </p>
            </div>

            <PrimaryButton onClick={() => void copyPrompt()}>
              Copiar prompt
            </PrimaryButton>
            <SecondaryButton onClick={() => void generate()} loading={busy}>
              Generar de nuevo
            </SecondaryButton>
            <SecondaryButton onClick={() => router.push("/more/data")}>
              Volver a Datos e informes
            </SecondaryButton>
          </div>
        )}
      </div>
    </div>
  );
}
