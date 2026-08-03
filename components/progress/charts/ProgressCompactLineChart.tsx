"use client";

import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import { buildSmoothLine, COMPACT_CHART } from "./chartGeometry";

export type CompactLinePoint = {
  id: string;
  value: number;
  label: string;
};

type ProgressCompactLineChartProps = {
  points: CompactLinePoint[];
  ariaLabel: string;
  /** Optional second series (e.g. diastolic) drawn muted. */
  secondary?: CompactLinePoint[];
  stroke?: string;
  secondaryStroke?: string;
};

export function ProgressCompactLineChart({
  points,
  ariaLabel,
  secondary,
  stroke = "var(--traza-text-primary)",
  secondaryStroke = "var(--traza-info)",
}: ProgressCompactLineChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    const { width, height, padLeft, padRight, padTop, padBottom } = COMPACT_CHART;
    const allValues = [
      ...points.map((p) => p.value),
      ...(secondary?.map((p) => p.value) ?? []),
    ];
    const dataMin = Math.min(...allValues);
    const dataMax = Math.max(...allValues);
    const padding =
      points.length === 1
        ? Math.max(Math.abs(dataMin) * 0.02, 0.4)
        : Math.max((dataMax - dataMin) * 0.22, 0.35);
    const min = dataMin - padding;
    const max = dataMax + padding;
    const span = Math.max(max - min, 0.5);
    const plotBottom = height - padBottom;
    const plotWidth = width - padLeft - padRight;

    const toCoords = (series: CompactLinePoint[]) =>
      series.map((point, index) => {
        const x =
          series.length === 1
            ? padLeft + plotWidth / 2
            : padLeft + (index / (series.length - 1)) * plotWidth;
        const y = padTop + (1 - (point.value - min) / span) * (plotBottom - padTop);
        return { x, y, point };
      });

    const coords = toCoords(points);
    const line = buildSmoothLine(coords);
    const area =
      coords.length > 0
        ? `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${plotBottom} L ${coords[0].x.toFixed(2)} ${plotBottom} Z`
        : "";
    const secondaryCoords = secondary ? toCoords(secondary) : null;
    const secondaryLine = secondaryCoords
      ? buildSmoothLine(secondaryCoords)
      : null;

    return {
      width,
      height,
      coords,
      line,
      area,
      secondaryLine,
      secondaryCoords,
      plotBottom,
      first: points[0],
      latest: points[points.length - 1],
    };
  }, [points, secondary]);

  if (!geometry) return null;

  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      className="h-[56px] w-full"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={`progArea-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={geometry.area}
        fill={`url(#progArea-${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: motionDuration.slow, delay: 0.08 }}
      />

      {geometry.secondaryLine ? (
        <motion.path
          d={geometry.secondaryLine}
          fill="none"
          stroke={secondaryStroke}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: motionDuration.chart, ease: motionEase.standard }}
        />
      ) : null}

      <motion.path
        d={geometry.line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: motionDuration.chart, ease: motionEase.standard }}
      />

      {geometry.coords.length > 0 ? (
        <circle
          cx={geometry.coords[geometry.coords.length - 1].x}
          cy={geometry.coords[geometry.coords.length - 1].y}
          r={4}
          fill="var(--traza-primary)"
          stroke="var(--traza-text-primary)"
          strokeWidth="1.5"
        />
      ) : null}

      <text
        x={geometry.coords[0].x}
        y={geometry.height - 4}
        textAnchor={geometry.coords.length === 1 ? "middle" : "start"}
        fill="var(--traza-text-muted)"
        fontSize="8"
        fontWeight="500"
      >
        {geometry.first.label}
      </text>
      {geometry.coords.length > 1 ? (
        <text
          x={geometry.coords[geometry.coords.length - 1].x}
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
