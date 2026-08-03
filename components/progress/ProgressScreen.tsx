"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingSkeleton } from "@/components/feedback/LoadingSkeleton";
import { ProgressPeriodSelector } from "@/components/progress/ProgressPeriodSelector";
import { ProgressHero } from "@/components/progress/ProgressHero";
import { ProgressDiscoveries } from "@/components/progress/ProgressDiscoveries";
import { ProgressConceptBlock } from "@/components/progress/ProgressConceptBlock";
import { ProgressCompactLineChart } from "@/components/progress/charts/ProgressCompactLineChart";
import { ProgressMultiLineChart } from "@/components/progress/charts/ProgressMultiLineChart";
import { ProgressCompactBarsChart } from "@/components/progress/charts/ProgressCompactBarsChart";
import {
  useProgressData,
  type ProgressChartSeries,
  type ProgressViewModel,
} from "@/features/progress";
import { fadeSlideVariants } from "@/lib/motion";
import { formatChartDayLabel } from "@/lib/tracking/dateTime";

function compositionChart(
  block: NonNullable<ProgressViewModel["composition"]>,
  charts: ProgressChartSeries,
) {
  if (block.chartKind === "weight" && charts.weight.length >= 2) {
    return (
      <ProgressCompactLineChart
        ariaLabel="Evolución del peso"
        points={charts.weight.map((p) => ({
          id: p.id,
          value: p.weightKg,
          label: p.label,
        }))}
      />
    );
  }
  if (block.chartKind === "measurements" && charts.measurements.length >= 2) {
    return (
      <ProgressMultiLineChart
        points={charts.measurements.map((p) => ({
          id: p.id,
          label: p.label,
          waist: p.waistCm,
          arm: p.armCm,
          leg: p.legCm,
        }))}
      />
    );
  }
  return null;
}

function activityChart(
  block: NonNullable<ProgressViewModel["activity"]>,
  charts: ProgressChartSeries,
) {
  if (block.chartKind === "volume" && charts.weeklyVolume.length >= 1) {
    return (
      <ProgressCompactBarsChart
        ariaLabel="Volumen semanal de entrenamiento"
        fill="var(--traza-primary)"
        points={charts.weeklyVolume.map((p) => ({
          id: p.weekStart,
          value: p.volumeKg,
          label: p.label,
        }))}
      />
    );
  }
  if (block.chartKind === "steps" && charts.steps.length >= 2) {
    return (
      <ProgressCompactBarsChart
        ariaLabel="Evolución de pasos"
        goal={charts.steps[0]?.goal}
        points={charts.steps.map((p) => ({
          id: p.entryDate,
          value: p.totalSteps,
          label: p.label,
          emphasize: p.goalReached,
        }))}
      />
    );
  }
  return null;
}

function recoveryChart(
  block: NonNullable<ProgressViewModel["recovery"]>,
  charts: ProgressChartSeries,
) {
  if (block.chartKind === "sleep" && charts.sleep.length >= 2) {
    return (
      <ProgressCompactLineChart
        ariaLabel="Evolución del sueño"
        points={charts.sleep.map((p) => ({
          id: p.id,
          value: p.durationMinutes,
          label: p.label,
        }))}
      />
    );
  }
  if (
    block.chartKind === "bloodPressure" &&
    charts.bloodPressure.length >= 2
  ) {
    return (
      <ProgressCompactLineChart
        ariaLabel="Evolución de la tensión"
        points={charts.bloodPressure.map((p) => ({
          id: p.id,
          value: p.systolic,
          label: p.label,
        }))}
        secondary={charts.bloodPressure.map((p) => ({
          id: `${p.id}-dia`,
          value: p.diastolic,
          label: p.label,
        }))}
      />
    );
  }
  return null;
}

/**
 * Progress — transversal evolution in &lt;10s.
 * Conceptual blocks (not module cards): Hero → Discoveries → Body → Activity → Recovery.
 */
export function ProgressScreen() {
  const { hydrated, period, setPeriod, charts, viewModel } = useProgressData();

  if (!hydrated || !viewModel || !charts) {
    return (
      <div className="relative -mx-5 flex min-h-[calc(100dvh-var(--traza-bottom-nav-height)-env(safe-area-inset-bottom))] flex-col sm:-mx-6">
        <div className="relative px-5 pt-2 sm:px-6">
          <PageHeader title="Progreso" />
          <div className="mt-4 flex flex-col gap-3">
            <LoadingSkeleton className="h-[36px] w-full rounded-[14px]" />
            <LoadingSkeleton className="h-[140px] w-full rounded-[22px]" />
            <LoadingSkeleton className="h-[88px] w-full rounded-[18px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative -mx-5 flex min-h-[calc(100dvh-var(--traza-bottom-nav-height)-env(safe-area-inset-bottom))] min-w-0 flex-col pb-4 sm:-mx-6"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-80"
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col px-5 pt-2 sm:px-6">
        <PageHeader title="Progreso" className="shrink-0" />

        <div className="mt-3 shrink-0">
          <ProgressPeriodSelector period={period} onChange={setPeriod} />
        </div>

        {!viewModel.hasAnyData ? (
          <EmptyState
            className="mt-8"
            title="Todavía no hay progreso que mostrar"
            description="Registra peso, sueño, pasos o un entrenamiento. Aquí verás qué mejora, qué se estabiliza y qué merece atención."
          />
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <ProgressHero
              hero={viewModel.hero}
              periodLabel={viewModel.periodLabel}
            />

            <ProgressDiscoveries
              featured={viewModel.featuredInsights}
              more={viewModel.moreInsights}
              typeLabel={viewModel.insightTypeLabel}
            />

            {viewModel.composition ? (
              <ProgressConceptBlock
                title="Composición corporal"
                href={viewModel.composition.href}
                metrics={viewModel.composition.metrics}
                density="relevant"
                leadFirst
                sparse={viewModel.composition.sparse}
                sparseMessage={viewModel.composition.sparseMessage}
                chart={compositionChart(viewModel.composition, charts)}
              />
            ) : null}

            {viewModel.activity ? (
              <ProgressConceptBlock
                title="Actividad y rendimiento"
                href={viewModel.activity.href}
                metrics={viewModel.activity.metrics}
                density="medium"
                sparse={viewModel.activity.sparse}
                sparseMessage={viewModel.activity.sparseMessage}
                chart={activityChart(viewModel.activity, charts)}
                footer={
                  viewModel.activity.bestPr ? (
                    <p className="flex items-baseline justify-between gap-2 text-caption">
                      <span className="truncate font-medium text-text-secondary">
                        PR · {viewModel.activity.bestPr.exerciseName}
                      </span>
                      <span className="shrink-0 tabular-nums text-text-muted">
                        {viewModel.activity.bestPr.detail} ·{" "}
                        {formatChartDayLabel({
                          entryDate: viewModel.activity.bestPr.date,
                        })}
                      </span>
                    </p>
                  ) : null
                }
              />
            ) : null}

            {viewModel.recovery ? (
              <ProgressConceptBlock
                title="Recuperación y salud"
                href={viewModel.recovery.href}
                metrics={viewModel.recovery.metrics}
                density="compact"
                sparse={viewModel.recovery.sparse}
                sparseMessage={viewModel.recovery.sparseMessage}
                chart={recoveryChart(viewModel.recovery, charts)}
                footer={
                  viewModel.recovery.disclaimer ? (
                    <p className="text-label text-text-muted">
                      {viewModel.recovery.disclaimer}
                    </p>
                  ) : null
                }
              />
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
