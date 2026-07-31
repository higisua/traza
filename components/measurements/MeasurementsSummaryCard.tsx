"use client";

import { motion } from "framer-motion";
import type { MeasurementMetricDelta, MeasurementSummary } from "@/features/measurements";
import { formatCm, formatSignedDeltaCm } from "@/features/measurements";
import { formatEntryStamp } from "@/lib/tracking/dateTime";
import { cn } from "@/lib/utils/cn";

type MeasurementsSummaryCardProps = {
  summary: MeasurementSummary;
};

function DeltaLine({
  delta,
  emphasize,
}: {
  delta: number | null;
  emphasize?: boolean;
}) {
  if (delta === null) {
    return (
      <p className="mt-1 text-[12px] font-medium text-text-muted">
        Primera medición
      </p>
    );
  }

  return (
    <p
      className={cn(
        "mt-1 text-[13px] font-semibold tabular-nums",
        emphasize && delta < -0.05 && "text-success",
        emphasize && delta > 0.05 && "text-warning",
        (!emphasize || Math.abs(delta) <= 0.05) && "text-text-secondary",
      )}
    >
      {formatSignedDeltaCm(delta)}
    </p>
  );
}

function MetricBlock({
  label,
  metric,
  featured = false,
}: {
  label: string;
  metric: MeasurementMetricDelta;
  featured?: boolean;
}) {
  return (
    <div className={cn(featured ? "pb-3" : "pt-3")}>
      <p
        className={cn(
          "font-semibold tracking-[0.08em] text-text-muted uppercase",
          featured ? "text-[11px]" : "text-[10px]",
        )}
      >
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <motion.span
          key={metric.current}
          initial={{ opacity: 0.55, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "font-bold leading-none tracking-[-0.03em] text-text-primary tabular-nums",
            featured ? "text-[36px]" : "text-[22px]",
          )}
        >
          {formatCm(metric.current)}
        </motion.span>
        <span
          className={cn(
            "font-semibold text-text-muted",
            featured ? "text-[14px]" : "text-[12px]",
          )}
        >
          cm
        </span>
      </div>
      <DeltaLine delta={metric.delta} emphasize={featured} />
    </div>
  );
}

export function MeasurementsSummaryCard({
  summary,
}: MeasurementsSummaryCardProps) {
  const { latest, waist, arm, leg } = summary;
  if (!latest || !waist || !arm || !leg) return null;

  return (
    <motion.section
      key={latest.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/18 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          Última medición
        </p>
        <p className="text-[12px] font-medium text-text-muted">
          {formatEntryStamp(latest)}
        </p>
      </div>

      <div className="relative mt-3">
        <MetricBlock label="Cintura" metric={waist} featured />
        <div className="border-t border-border-light" />
        <div className="grid grid-cols-2 gap-3">
          <MetricBlock label="Brazo" metric={arm} />
          <MetricBlock label="Pierna" metric={leg} />
        </div>
      </div>
    </motion.section>
  );
}
