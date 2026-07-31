"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnalyticsService } from "@/features/analytics";
import {
  InsightsService,
  PRIMARY_INSIGHTS_COUNT,
  type Insight,
  type InsightType,
} from "@/features/insights";
import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";

const TYPE_SECTIONS: { type: InsightType; label: string }[] = [
  { type: "correlation", label: "Correlaciones" },
  { type: "trend", label: "Tendencias" },
  { type: "recommendation", label: "Recomendaciones" },
  { type: "warning", label: "Advertencias" },
  { type: "achievement", label: "Logros" },
];

const TYPE_LABEL: Record<InsightType, string> = {
  correlation: "correlación",
  trend: "tendencia",
  recommendation: "recomendación",
  warning: "advertencia",
  achievement: "logro",
};

function InsightBlock({ insight }: { insight: Insight }) {
  return (
    <article className="mb-4 border border-neutral-300 bg-neutral-50 p-3">
      <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
        {TYPE_LABEL[insight.type]}
      </p>
      <h2 className="text-base font-semibold text-neutral-900">{insight.title}</h2>
      <p className="mt-1 text-sm text-neutral-700">{insight.description}</p>
      <p className="mt-2 text-xs text-neutral-600">
        <span className="font-medium">Evidencia:</span> {insight.evidence}
      </p>
      {insight.action ? (
        <p className="mt-1 text-xs text-neutral-600">
          <span className="font-medium">Acción sugerida:</span> {insight.action}
        </p>
      ) : null}
    </article>
  );
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function DevInsightsPage() {
  const isClient = useIsClient();
  const [tick, setTick] = useState(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    const bump = () => setTick((value) => value + 1);
    const unsubs = [
      WeightRepository.subscribe(bump),
      BloodPressureRepository.subscribe(bump),
      SleepRepository.subscribe(bump),
      StepsRepository.subscribe(bump),
      MeasurementRepository.subscribe(bump),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [isClient]);

  const result = useMemo(() => {
    if (!isClient) return null;
    void tick;
    const snapshot = AnalyticsService.getSnapshot();
    return InsightsService.fromSnapshot(snapshot);
  }, [isClient, tick]);

  const primary = useMemo(
    () => result?.insights.slice(0, PRIMARY_INSIGHTS_COUNT) ?? [],
    [result],
  );
  const rest = useMemo(
    () => result?.insights.slice(PRIMARY_INSIGHTS_COUNT) ?? [],
    [result],
  );

  const restByType = useMemo(() => {
    const map = new Map<InsightType, Insight[]>();
    for (const section of TYPE_SECTIONS) map.set(section.type, []);
    for (const insight of rest) {
      const list = map.get(insight.type) ?? [];
      list.push(insight);
      map.set(insight.type, list);
    }
    return map;
  }, [rest]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-neutral-900">
      <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
        Solo desarrollo · Fase 5.1 redefinición
      </p>
      <h1 className="text-2xl font-bold">Motor de insights — volcado</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Página temporal para verificar descubrimientos. Máx.{" "}
        {PRIMARY_INSIGHTS_COUNT} principales; el resto detrás de «Ver más». No
        forma parte del producto.
        {result ? (
          <>
            {" "}
            {result.insights.length} descubrimientos · referencia{" "}
            {result.asOfDate}.
          </>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTick((value) => value + 1)}
          className="rounded border border-neutral-400 px-3 py-2 text-sm"
        >
          Recalcular
        </button>
      </div>

      {!result ? (
        <p className="mt-10 text-sm text-neutral-500">Cargando volcado…</p>
      ) : (
        <div className="mt-10">
          <section className="mb-8 border-b border-neutral-300 pb-6">
            <h2 className="mb-2 text-lg font-semibold">
              Principales{" "}
              <span className="text-sm font-normal text-neutral-500">
                ({primary.length}/{PRIMARY_INSIGHTS_COUNT})
              </span>
            </h2>
            {primary.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Pocos descubrimientos cualifican — silencio preferible a ruido.
              </p>
            ) : (
              primary.map((insight) => (
                <InsightBlock key={insight.id} insight={insight} />
              ))
            )}
          </section>

          {rest.length > 0 ? (
            <section className="mb-8 border-b border-neutral-300 pb-6">
              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="rounded border border-neutral-400 px-3 py-2 text-sm"
              >
                {showMore
                  ? "Ocultar descubrimientos"
                  : `Ver más descubrimientos (${rest.length})`}
              </button>

              {showMore ? (
                <div className="mt-6">
                  {TYPE_SECTIONS.map(({ type, label }) => {
                    const items = restByType.get(type) ?? [];
                    if (items.length === 0) return null;
                    return (
                      <div key={type} className="mb-6">
                        <h3 className="mb-2 text-base font-semibold">
                          {label}{" "}
                          <span className="text-sm font-normal text-neutral-500">
                            ({items.length})
                          </span>
                        </h3>
                        {items.map((insight) => (
                          <InsightBlock key={insight.id} insight={insight} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="mb-8">
            <h2 className="mb-2 text-lg font-semibold">JSON completo</h2>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-neutral-100 p-3 text-xs text-neutral-800">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}
