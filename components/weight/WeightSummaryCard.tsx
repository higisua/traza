"use client";

import { motion } from "framer-motion";
import type { WeightSummary } from "@/features/weight";
import {
  formatBodyFatPct,
  formatEntryRelativeMeta,
  formatSignedDeltaBodyFat,
  formatSignedDeltaKg,
  formatWeightKg,
} from "@/features/weight";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type WeightSummaryCardProps = {
  summary: WeightSummary;
};

export function WeightSummaryCard({ summary }: WeightSummaryCardProps) {
  const { latest, previous } = summary;

  if (!latest) return null;

  const weightDelta =
    previous !== null ? latest.weightKg - previous.weightKg : null;
  const bodyFatDelta =
    previous !== null &&
    latest.bodyFatPct !== null &&
    previous.bodyFatPct !== null
      ? latest.bodyFatPct - previous.bodyFatPct
      : null;

  return (
    <motion.section
      key={latest.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.page, ease: motionEase.standard }}
      className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          Último registro
        </p>
        <p className="text-[12px] font-medium text-text-muted">
          {formatEntryRelativeMeta(latest)}
        </p>
      </div>

      <div className="relative mt-3 flex items-baseline gap-1.5">
        <motion.span
          key={`w-${latest.weightKg}`}
          initial={{ opacity: 0.55, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[42px] font-bold leading-none tracking-[-0.035em] text-text-primary tabular-nums"
        >
          {formatWeightKg(latest.weightKg)}
        </motion.span>
        <span className="text-[15px] font-semibold text-text-muted">kg</span>
      </div>

      {weightDelta !== null ? (
        <p
          className={cn(
            "relative mt-2 text-[14px] font-semibold tabular-nums",
            weightDelta < -0.01 && "text-success",
            weightDelta > 0.01 && "text-warning",
            Math.abs(weightDelta) <= 0.01 && "text-text-muted",
          )}
        >
          {formatSignedDeltaKg(weightDelta)}
          <span className="ml-1.5 font-medium text-text-muted">
            respecto al último registro
          </span>
        </p>
      ) : (
        <p className="relative mt-2 text-[13px] font-medium text-text-muted">
          Primer registro
        </p>
      )}

      <div className="relative mt-4 border-t border-border-light pt-3">
        {latest.bodyFatPct !== null ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[16px] font-semibold tabular-nums text-text-primary">
              {formatBodyFatPct(latest.bodyFatPct)} % grasa
            </p>
            {bodyFatDelta !== null ? (
              <p
                className={cn(
                  "text-[13px] font-semibold tabular-nums",
                  bodyFatDelta < -0.05 && "text-success",
                  bodyFatDelta > 0.05 && "text-warning",
                  Math.abs(bodyFatDelta) <= 0.05 && "text-text-muted",
                )}
              >
                {formatSignedDeltaBodyFat(bodyFatDelta)}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[14px] font-medium text-text-muted">
            Sin % de grasa en este registro
          </p>
        )}
      </div>
    </motion.section>
  );
}
