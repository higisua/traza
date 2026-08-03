"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton, SecondaryButton } from "@/components/forms/Button";
import { useToast } from "@/components/feedback/Toast";
import { cn } from "@/lib/utils/cn";
import {
  ALL_EXPORT_CONTENT_KEYS,
  EXPORT_CONTENT_LABELS_ES,
  EXPORT_FORMAT_COPY_ES,
  PDF_DETAIL_COPY_ES,
  PERIOD_PRESET_LABELS_ES,
  runExport,
  type ExportContentKey,
  type ExportFormat,
  type ExportPeriodPreset,
  type PdfDetailLevel,
} from "@/features/data";

const SHARE_FORMATS: ExportFormat[] = ["pdf", "excel", "csv"];

const PERIODS: ExportPeriodPreset[] = [
  "7d",
  "30d",
  "90d",
  "year",
  "all",
  "custom",
];

type Step = 1 | 2 | 3 | 4;

export function ExportScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [period, setPeriod] = useState<ExportPeriodPreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [pdfDetail, setPdfDetail] = useState<PdfDetailLevel>("full");
  const [selected, setSelected] = useState<Set<ExportContentKey>>(
    () => new Set(ALL_EXPORT_CONTENT_KEYS),
  );
  const [busy, setBusy] = useState(false);

  const allSelected = selected.size === ALL_EXPORT_CONTENT_KEYS.length;

  const stepTitle = useMemo(() => {
    if (step === 1) return "1 · Periodo";
    if (step === 2) return "2 · Contenido";
    if (step === 3) return "3 · Formato";
    return "4 · Informe listo";
  }, [step]);

  function toggleContent(key: ExportContentKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll(on: boolean) {
    setSelected(on ? new Set(ALL_EXPORT_CONTENT_KEYS) : new Set());
  }

  async function handleExport() {
    if (selected.size === 0) {
      showToast("Elige al menos un contenido", "danger");
      return;
    }
    if (period === "custom" && (!customStart || !customEnd)) {
      showToast("Indica el rango de fechas", "danger");
      return;
    }

    setBusy(true);
    try {
      const result = await runExport({
        format,
        period,
        customRange: { startDate: customStart, endDate: customEnd },
        content: selected,
        purpose: "analysis",
        pdfDetail: format === "pdf" ? pdfDetail : undefined,
      });
      showToast(`Listo · ${result.filename}`, "success");
      setStep(4);
    } catch (error) {
      console.error(error);
      showToast("No se pudo generar el informe", "danger");
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
          title="Revisar mi evolución"
          onBack={() => {
            if (step > 1 && step < 4) {
              setStep((s) => (s - 1) as Step);
              return;
            }
            if (step === 4) {
              setStep(3);
              return;
            }
            router.push("/more/data");
          }}
        />

        <p className="mt-1 text-label font-semibold uppercase tracking-label text-text-muted">
          {stepTitle}
        </p>
        <p className="mt-1 text-caption text-text-secondary">
          Elige qué periodo y qué datos quieres entender. La copia completa de
          la app está en Copia de seguridad.
        </p>

        {step === 1 ? (
          <section className="mt-5 flex flex-col gap-2">
            <p className="text-caption text-text-secondary">
              ¿Qué periodo quieres revisar?
            </p>
            {PERIODS.map((id) => (
              <ChoiceRow
                key={id}
                selected={period === id}
                title={PERIOD_PRESET_LABELS_ES[id]}
                onClick={() => setPeriod(id)}
              />
            ))}
            {period === "custom" ? (
              <div className="mt-2 grid grid-cols-2 gap-3 rounded-[16px] bg-surface p-4 ring-1 ring-black/[0.03]">
                <label className="flex flex-col gap-1.5">
                  <span className="text-label font-semibold uppercase tracking-label text-text-muted">
                    Desde
                  </span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-[44px] rounded-[12px] border border-border/80 bg-surface-secondary/40 px-3 text-body text-text-primary"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-label font-semibold uppercase tracking-label text-text-muted">
                    Hasta
                  </span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-[44px] rounded-[12px] border border-border/80 bg-surface-secondary/40 px-3 text-body text-text-primary"
                  />
                </label>
              </div>
            ) : null}
            <PrimaryButton className="mt-4" onClick={() => setStep(2)}>
              Continuar
            </PrimaryButton>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="mt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-text-secondary">
                ¿Qué quieres incluir? Todo marcado por defecto.
              </p>
              <button
                type="button"
                className="text-[13px] font-semibold text-text-primary"
                onClick={() => selectAll(!allSelected)}
              >
                {allSelected ? "Ninguno" : "Todos"}
              </button>
            </div>

            <ul className="flex flex-col gap-2">
              {ALL_EXPORT_CONTENT_KEYS.map((key) => {
                const checked = selected.has(key);
                return (
                  <li key={key}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[16px] bg-surface px-4 py-3 ring-1 ring-black/[0.03]",
                        checked && "ring-primary/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleContent(key)}
                        className="size-5 accent-[var(--traza-primary)]"
                      />
                      <span className="text-[15px] font-medium text-text-primary">
                        {EXPORT_CONTENT_LABELS_ES[key]}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>

            <PrimaryButton
              className="mt-2"
              onClick={() => {
                if (selected.size === 0) {
                  showToast("Elige al menos un contenido", "danger");
                  return;
                }
                setStep(3);
              }}
            >
              Continuar
            </PrimaryButton>
            <SecondaryButton onClick={() => setStep(1)}>
              Volver al periodo
            </SecondaryButton>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="mt-5 flex flex-col gap-2">
            <p className="text-caption text-text-secondary">
              ¿Cómo quieres ver o compartir tu evolución?
            </p>
            {SHARE_FORMATS.map((id) => (
              <ChoiceRow
                key={id}
                selected={format === id}
                title={EXPORT_FORMAT_COPY_ES[id].title}
                description={EXPORT_FORMAT_COPY_ES[id].description}
                onClick={() => setFormat(id)}
              />
            ))}

            {format === "pdf" ? (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-label font-semibold uppercase tracking-label text-text-muted">
                  Nivel de detalle
                </p>
                {(Object.keys(PDF_DETAIL_COPY_ES) as PdfDetailLevel[]).map(
                  (level) => (
                    <ChoiceRow
                      key={level}
                      selected={pdfDetail === level}
                      title={PDF_DETAIL_COPY_ES[level].title}
                      description={PDF_DETAIL_COPY_ES[level].description}
                      onClick={() => setPdfDetail(level)}
                    />
                  ),
                )}
              </div>
            ) : null}

            {format === "excel" || format === "csv" ? <AiReadyBlock /> : null}

            <div className="mt-4 flex flex-col gap-2">
              <PrimaryButton onClick={() => void handleExport()} loading={busy}>
                Generar informe
              </PrimaryButton>
              <SecondaryButton onClick={() => setStep(2)}>
                Volver al contenido
              </SecondaryButton>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="mt-5 flex flex-col gap-3">
            <div className="rounded-[20px] bg-primary/20 p-4 ring-1 ring-primary/40">
              <p className="text-[16px] font-semibold text-text-primary">
                Tu informe está listo
              </p>
              <p className="mt-1 text-[13px] text-text-secondary">
                Ya puedes abrirlo, compartirlo o seguir revisando tu evolución
                en este dispositivo.
              </p>
            </div>
            <PrimaryButton onClick={() => router.push("/more/data")}>
              Volver a Datos e informes
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                setStep(1);
              }}
            >
              Revisar otro periodo
            </SecondaryButton>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function AiReadyBlock() {
  return (
    <div className="mt-3 rounded-[16px] bg-surface p-4 ring-1 ring-black/[0.03]">
      <p className="text-[15px] font-semibold text-text-primary">
        Preparado para analizar
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {[
          "Fechas ISO",
          "Columnas normalizadas",
          "Sin abreviaturas ambiguas",
          "Listo para ChatGPT u hojas de cálculo",
        ].map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-[13px] text-text-secondary"
          >
            <Check
              size={16}
              strokeWidth={2.5}
              className="shrink-0 text-text-primary"
            />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-caption text-text-muted">
        TRAZA no envía nada a la nube: solo prepara datos claros para que tú
        los analices donde quieras.
      </p>
    </div>
  );
}

function ChoiceRow({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start rounded-[16px] bg-surface px-4 py-3.5 text-left ring-1 ring-black/[0.03]",
        "transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]",
        selected && "ring-2 ring-primary bg-primary/10",
      )}
    >
      <span className="text-[15px] font-semibold text-text-primary">{title}</span>
      {description ? (
        <span className="mt-0.5 text-[13px] text-text-secondary">{description}</span>
      ) : null}
    </button>
  );
}
