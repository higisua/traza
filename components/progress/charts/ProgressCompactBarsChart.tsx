"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { COMPACT_CHART } from "./chartGeometry";

export type CompactBarPoint = {
  id: string;
  value: number;
  label: string;
  emphasize?: boolean;
};

type ProgressCompactBarsChartProps = {
  points: CompactBarPoint[];
  ariaLabel: string;
  /** Optional horizontal guide (e.g. steps goal). */
  goal?: number;
  fill?: string;
};

export function ProgressCompactBarsChart({
  points,
  ariaLabel,
  goal,
  fill = "var(--traza-text-primary)",
}: ProgressCompactBarsChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const { width, height, padLeft, padRight, padTop, padBottom } = COMPACT_CHART;
    const plotBottom = height - padBottom;
    const plotHeight = plotBottom - padTop;
    const plotWidth = width - padLeft - padRight;
    const maxVal = Math.max(...points.map((p) => p.value), goal ?? 0, 1);
    const span = maxVal;
    const slot = plotWidth / Math.max(points.length, 1);
    const barWidth = Math.min(14, Math.max(4, slot * 0.55));

    const bars = points.map((point, index) => {
      const cx =
        points.length === 1
          ? padLeft + plotWidth / 2
          : padLeft + slot * index + slot / 2;
      const barHeight = (point.value / span) * plotHeight;
      return {
        point,
        x: cx - barWidth / 2,
        y: plotBottom - Math.max(barHeight, point.value > 0 ? 3 : 0),
        height: Math.max(barHeight, point.value > 0 ? 3 : 0),
        width: barWidth,
      };
    });

    const goalY =
      goal != null ? plotBottom - (goal / span) * plotHeight : null;

    return {
      width,
      height,
      bars,
      goalY,
      first: points[0],
      latest: points[points.length - 1],
      padLeft,
      padRight,
    };
  }, [points, goal]);

  if (!geometry) return null;

  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className="h-[56px] w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {geometry.goalY != null ? (
        <line
          x1={geometry.padLeft}
          x2={geometry.width - geometry.padRight}
          y1={geometry.goalY}
          y2={geometry.goalY}
          stroke="var(--traza-primary)"
          strokeWidth="1.25"
          strokeDasharray="3 4"
          opacity="0.85"
        />
      ) : null}

      {geometry.bars.map((bar, index) => (
        <motion.rect
          key={bar.point.id}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={3}
          fill={bar.point.emphasize ? "var(--traza-primary)" : fill}
          opacity={bar.point.emphasize ? 1 : 0.72}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: bar.point.emphasize ? 1 : 0.72 }}
          style={{ transformOrigin: `${bar.x + bar.width / 2}px ${geometry.height - COMPACT_CHART.padBottom}px` }}
          transition={{
            duration: motionDuration.normal,
            delay: 0.04 * index,
            ease: motionEase.standard,
          }}
        />
      ))}

      <text
        x={geometry.padLeft}
        y={geometry.height - 4}
        fill="var(--traza-text-muted)"
        fontSize="8"
        fontWeight="500"
      >
        {geometry.first.label}
      </text>
      {points.length > 1 ? (
        <text
          x={geometry.width - geometry.padRight}
          y={geometry.height - 4}
          textAnchor="end"
          fill="var(--traza-text-muted)"
          fontSize="8"
          fontWeight="500"
        >
          {geometry.latest.label}
        </text>
      ) : null}
    </svg>
  );
}
