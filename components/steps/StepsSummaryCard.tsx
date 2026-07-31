"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { StepsSummary } from "@/features/steps";
import { formatStepsCount } from "@/features/steps";
import { cn } from "@/lib/utils/cn";

type StepsSummaryCardProps = {
  summary: StepsSummary;
};

export function StepsSummaryCard({ summary }: StepsSummaryCardProps) {
  const { today } = summary;

  return (
    <motion.section
      key={`${today.entryDate}-${today.totalSteps}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/28 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          Hoy
        </p>
        <p className="text-[12px] font-medium text-text-muted">
          Objetivo {formatStepsCount(today.goal)}
        </p>
      </div>

      <div className="relative mt-3 flex items-baseline gap-1.5">
        <motion.span
          key={today.totalSteps}
          initial={{ opacity: 0.5, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[42px] font-bold leading-none tracking-[-0.035em] text-text-primary tabular-nums"
        >
          {formatStepsCount(today.totalSteps)}
        </motion.span>
        <span className="text-[15px] font-semibold text-text-muted">pasos</span>
      </div>

      {/* Progress track */}
      <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-surface-secondary">
        <motion.div
          className={cn(
            "h-full rounded-full",
            today.goalReached ? "bg-primary" : "bg-text-primary",
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(today.progress * 100, today.totalSteps > 0 ? 2 : 0)}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {today.goalReached ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.08 }}
            className="flex size-5 items-center justify-center rounded-full bg-primary text-text-primary"
          >
            <Check size={13} strokeWidth={2.6} />
          </motion.span>
          <span className="text-[13px] font-semibold text-text-primary">
            Objetivo conseguido
          </span>
        </motion.div>
      ) : (
        <p className="relative mt-3 text-[14px] font-semibold tabular-nums text-text-secondary">
          {formatStepsCount(today.remaining)}{" "}
          <span className="font-medium text-text-muted">
            para alcanzar el objetivo
          </span>
        </p>
      )}
    </motion.section>
  );
}
