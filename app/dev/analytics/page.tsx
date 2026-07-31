"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsService } from "@/features/analytics";
import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";

function Section({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) {
  return (
    <section className="mb-8 border-b border-neutral-300 pb-6">
      <h2 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h2>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded bg-neutral-100 p-3 text-xs text-neutral-800">
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}

export default function DevAnalyticsPage() {
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
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
  }, []);

  // Client-only: repositories read localStorage; computedAt must not SSR.
  const snapshot = useMemo(
    () => (ready ? AnalyticsService.getSnapshot() : null),
    [tick, ready],
  );

  async function copyAll() {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-neutral-900">
      <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
        Solo desarrollo
      </p>
      <h1 className="text-2xl font-bold">Motor de analítica — volcado</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Página temporal para verificar métricas derivadas. No forma parte del
        producto. Periodos precomputados: 7d / 30d / 90d / all. Accesores:{" "}
        <code className="text-xs">.delta(&quot;7d&quot;)</code>,{" "}
        <code className="text-xs">.average(&quot;30d&quot;)</code>,{" "}
        <code className="text-xs">.trend(&quot;90d&quot;)</code>.
        {snapshot ? (
          <>
            {" "}
            Calculado a las {snapshot.computedAt} (fecha de referencia{" "}
            {snapshot.asOfDate}).
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
        <button
          type="button"
          onClick={() => void copyAll()}
          className="rounded border border-neutral-400 px-3 py-2 text-sm"
        >
          {copied ? "Copiado" : "Copiar JSON completo"}
        </button>
      </div>

      {!snapshot ? (
        <p className="mt-10 text-sm text-neutral-500">Cargando volcado…</p>
      ) : (
        <div className="mt-10">
          <Section title="Peso (period bags)" data={snapshot.weight} />
          <Section title="Grasa corporal" data={snapshot.bodyFat} />
          <Section
            title="Presión arterial (last + channels)"
            data={snapshot.bloodPressure}
          />
          <Section
            title="Sueño (lastNight + duration/score)"
            data={snapshot.sleep}
          />
          <Section
            title="Pasos (lastDay + period bags)"
            data={snapshot.steps}
          />
          <Section title="Medidas corporales" data={snapshot.measurements} />
          <Section
            title="Entrenamiento (+ personalRecords)"
            data={snapshot.workout}
          />
          <Section title="Rachas transversales" data={snapshot.streaks} />
          <Section
            title="Period API smoke (weight.delta 7d / steps.average 30d)"
            data={{
              weightDelta7d: snapshot.weight.delta("7d"),
              weightTrend90d: snapshot.weight.trend("90d"),
              stepsAverage30d: snapshot.steps.average("30d"),
              sleepDurationDelta7d: snapshot.sleep.duration.delta("7d"),
              sleepScoreTrend30d: snapshot.sleep.score.trend("30d"),
              bpSystolicDelta30d: snapshot.bloodPressure.systolic.delta("30d"),
              bpLast: snapshot.bloodPressure.last,
            }}
          />
          <Section title="Snapshot completo" data={snapshot} />
        </div>
      )}
    </main>
  );
}
