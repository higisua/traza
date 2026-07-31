"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import type { StepsChartPoint } from "@/features/steps";
import { formatStepsCount } from "@/features/steps";

type StepsTrendChartProps = {
  points: StepsChartPoint[];
};

/**
 * Daily activity bars + goal baseline.
 * Distinct from Weight (line), BP (dual line), Sleep (night bars + score beads).
 */
export function StepsTrendChart({ points }: StepsTrendChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 360;
    const height = 188;
    const padLeft = 40;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 28;
    const plotBottom = height - padBottom;
    const plotHeight = plotBottom - padTop;
    const plotWidth = width - padLeft - padRight;
    const goal = points[0]?.goal ?? 10_000;
    const maxSteps = Math.max(...points.map((p) => p.totalSteps), goal);
    const span = Math.max(maxSteps, goal * 0.2);

    const slot = plotWidth / Math.max(points.length, 1);

    const bars = points.map((point, index) => {
      const cx =
        points.length === 1
          ? padLeft + plotWidth / 2
          : padLeft + slot * index + slot / 2;
      const barHeight = (point.totalSteps / span) * plotHeight;
      const y = plotBottom - barHeight;
      return {
        point,
        cx,
        y,
        barHeight: Math.max(barHeight, point.totalSteps > 0 ? 4 : 0),
      };
    });

    const goalY = plotBottom - (goal / span) * plotHeight;

    return {
      width,
      height,
      bars,
      goalY,
      goal,
      padLeft,
      first: points[0],
      latest: points[points.length - 1],
      daysReached: points.filter((p) => p.goalReached).length,
    };
  }, [points]);

  if (!geometry) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.slow, ease: motionEase.standard }}
      className="overflow-hidden rounded-[24px] bg-surface shadow-s ring-1 ring-black/[0.04]"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Evolución
          </p>
          <p className="mt-1 text-[13px] font-medium text-text-secondary">
            {geometry.daysReached} de {points.length} días con objetivo
          </p>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2.5 rounded-[3px] bg-primary" />
            Pasos
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="h-px w-3 bg-text-muted" />
            Meta
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="h-[188px] w-full"
          role="img"
          aria-label="Evolución de los pasos diarios"
        >
          <line
            x1={geometry.padLeft}
            x2={geometry.width - 16}
            y1={geometry.goalY}
            y2={geometry.goalY}
            stroke="var(--traza-text-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            opacity="0.85"
          />
          <text
            x={geometry.padLeft - 6}
            y={geometry.goalY + 3}
            textAnchor="end"
            fill="var(--traza-text-muted)"
            fontSize="9"
            fontWeight="600"
          >
            {formatStepsCount(geometry.goal)}
          </text>

          {geometry.bars.map((bar, index) => {
            const isLast = index === geometry.bars.length - 1;
            const reached = bar.point.goalReached;
            return (
              <motion.rect
                key={bar.point.entryDate}
                x={bar.cx - 10}
                y={bar.y}
                width={20}
                height={Math.max(bar.barHeight, 2)}
                rx={7}
                fill={
                  reached
                    ? "var(--traza-primary)"
                    : "var(--traza-text-primary)"
                }
                opacity={isLast ? (reached ? 1 : 0.75) : reached ? 0.7 : 0.2}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: isLast ? (reached ? 1 : 0.75) : reached ? 0.7 : 0.2,
                }}
                style={{ originY: 1 }}
                transition={{
                  delay: index * 0.035,
                  duration: motionDuration.slow,
                  ease: motionEase.standard,
                }}
              />
            );
          })}

          <text
            x={geometry.bars[0].cx}
            y={geometry.height - 8}
            textAnchor={geometry.bars.length === 1 ? "middle" : "start"}
            fill="var(--traza-text-muted)"
            fontSize="11"
            fontWeight="500"
          >
            {geometry.first.label}
          </text>
          {geometry.bars.length > 1 ? (
            <text
              x={geometry.bars[geometry.bars.length - 1].cx}
              y={geometry.height - 8}
              textAnchor="end"
              fill="var(--traza-text-muted)"
              fontSize="11"
              fontWeight="500"
            >
              {geometry.latest.label}
            </text>
          ) : null}
        </svg>
      </div>
    </motion.section>
  );
}
