"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { buildSmoothLine, COMPACT_CHART } from "./chartGeometry";

export type MultiLinePoint = {
  id: string;
  label: string;
  waist: number;
  arm: number;
  leg: number;
};

const COLORS = {
  waist: "var(--traza-text-primary)",
  arm: "var(--traza-info)",
  leg: "var(--traza-primary)",
} as const;

type ProgressMultiLineChartProps = {
  points: MultiLinePoint[];
};

export function ProgressMultiLineChart({ points }: ProgressMultiLineChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const { width, height, padLeft, padRight, padTop, padBottom } = COMPACT_CHART;
    const values = points.flatMap((p) => [p.waist, p.arm, p.leg]);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const padding =
      points.length === 1 ? 4 : Math.max((dataMax - dataMin) * 0.2, 1.5);
    const min = dataMin - padding;
    const max = dataMax + padding;
    const span = Math.max(max - min, 2);
    const plotBottom = height - padBottom;
    const plotWidth = width - padLeft - padRight;

    const plotX = (index: number) =>
      points.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (index / (points.length - 1)) * plotWidth;
    const plotY = (value: number) =>
      padTop + (1 - (value - min) / span) * (plotBottom - padTop);

    const series = {
      waist: points.map((p, i) => ({ x: plotX(i), y: plotY(p.waist) })),
      arm: points.map((p, i) => ({ x: plotX(i), y: plotY(p.arm) })),
      leg: points.map((p, i) => ({ x: plotX(i), y: plotY(p.leg) })),
    };

    return {
      width,
      height,
      lines: {
        waist: buildSmoothLine(series.waist),
        arm: buildSmoothLine(series.arm),
        leg: buildSmoothLine(series.leg),
      },
      first: points[0],
      latest: points[points.length - 1],
      lastWaist: series.waist[series.waist.length - 1],
    };
  }, [points]);

  if (!geometry) return null;

  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className="h-[56px] w-full"
      role="img"
      aria-label="Evolución de medidas corporales"
    >
      {(
        [
          ["leg", geometry.lines.leg, COLORS.leg, 1.6],
          ["arm", geometry.lines.arm, COLORS.arm, 1.6],
          ["waist", geometry.lines.waist, COLORS.waist, 2.4],
        ] as const
      ).map(([key, d, color, width]) => (
        <motion.path
          key={key}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.35 }}
          animate={{ pathLength: 1, opacity: key === "waist" ? 1 : 0.7 }}
          transition={{ duration: motionDuration.chart, ease: motionEase.standard }}
        />
      ))}
      {geometry.lastWaist ? (
        <circle
          cx={geometry.lastWaist.x}
          cy={geometry.lastWaist.y}
          r={3.5}
          fill="var(--traza-primary)"
          stroke="var(--traza-text-primary)"
          strokeWidth="1.5"
        />
      ) : null}
      <text
        x={COMPACT_CHART.padLeft}
        y={geometry.height - 4}
        fill="var(--traza-text-muted)"
        fontSize="8"
        fontWeight="500"
      >
        {geometry.first.label}
      </text>
      {points.length > 1 ? (
        <text
          x={geometry.width - COMPACT_CHART.padRight}
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
