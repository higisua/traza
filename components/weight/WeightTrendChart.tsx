"use client";

import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import type { WeightChartPoint } from "@/features/weight";
import { formatWeightKg } from "@/features/weight";

type WeightTrendChartProps = {
  points: WeightChartPoint[];
};

function buildSmoothLine(coords: Array<{ x: number; y: number }>): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;
  }

  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;

  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
}

export function WeightTrendChart({ points }: WeightTrendChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 360;
    const height = 188;
    const padLeft = 44;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 28;
    const values = points.map((point) => point.weightKg);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const padding =
      points.length === 1
        ? 0.8
        : Math.max((dataMax - dataMin) * 0.22, 0.35);
    const min = dataMin - padding;
    const max = dataMax + padding;
    const span = Math.max(max - min, 0.5);
    const plotBottom = height - padBottom;

    const coords = points.map((point, index) => {
      const x =
        points.length === 1
          ? padLeft + (width - padLeft - padRight) / 2
          : padLeft +
            (index / (points.length - 1)) * (width - padLeft - padRight);
      const y = padTop + (1 - (point.weightKg - min) / span) * (plotBottom - padTop);
      return { x, y, point };
    });

    const line = buildSmoothLine(coords);
    const area =
      coords.length > 0
        ? `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${plotBottom} L ${coords[0].x.toFixed(2)} ${plotBottom} Z`
        : "";

    const guideRatios = points.length === 1 ? [0.5] : [0, 0.5, 1];
    const guides = guideRatios.map((ratio) => {
      const value = max - span * ratio;
      const y = padTop + ratio * (plotBottom - padTop);
      return {
        y,
        value,
        label: formatWeightKg(points.length === 1 ? dataMin : value),
      };
    });

    return {
      width,
      height,
      coords,
      line,
      area,
      guides,
      plotBottom,
      padLeft,
      latest: points[points.length - 1],
      first: points[0],
      delta:
        points.length > 1
          ? points[points.length - 1].weightKg - points[0].weightKg
          : null,
    };
  }, [points]);

  if (!geometry) return null;

  const rangeLabel =
    geometry.delta === null
      ? "Primer registro"
      : geometry.delta === 0
        ? "Sin cambio en el periodo"
        : geometry.delta < 0
          ? `${formatWeightKg(Math.abs(geometry.delta))} kg menos en el periodo`
          : `${formatWeightKg(geometry.delta)} kg más en el periodo`;

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
            {rangeLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-bold tabular-nums tracking-[-0.02em] text-text-primary">
            {formatWeightKg(geometry.latest.weightKg)}
            <span className="ml-1 text-[12px] font-semibold text-text-muted">
              kg
            </span>
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-text-muted">
            Último
          </p>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="h-[188px] w-full"
          role="img"
          aria-label="Evolución del peso"
        >
          <defs>
            <linearGradient id={`weightArea-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.28" />
              <stop offset="55%" stopColor="var(--traza-primary)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {geometry.guides.map((guide) => (
            <g key={guide.y}>
              <line
                x1={geometry.padLeft}
                x2={geometry.width - 16}
                y1={guide.y}
                y2={guide.y}
                stroke="var(--traza-border)"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.7"
              />
              <text
                x={geometry.padLeft - 8}
                y={guide.y + 3}
                textAnchor="end"
                fill="var(--traza-text-muted)"
                fontSize="10"
                fontWeight="500"
              >
                {guide.label}
              </text>
            </g>
          ))}

          <motion.path
            d={geometry.area}
            fill={`url(#weightArea-${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: motionDuration.slow, delay: 0.12 }}
          />

          <motion.path
            d={geometry.line}
            fill="none"
            stroke="var(--traza-text-primary)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: motionDuration.chart, ease: motionEase.standard }}
          />

          {geometry.coords.map((coord, index) => {
            const isLast = index === geometry.coords.length - 1;
            const showPoint = isLast || geometry.coords.length <= 6;
            if (!showPoint) return null;

            return (
              <motion.circle
                key={coord.point.id}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 5.5 : 3.5}
                fill={isLast ? "var(--traza-primary)" : "var(--traza-surface)"}
                stroke={isLast ? "var(--traza-text-primary)" : "var(--traza-text-primary)"}
                strokeWidth={isLast ? 2 : 1.75}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.04, duration: motionDuration.normal }}
              />
            );
          })}

          <text
            x={geometry.coords[0].x}
            y={geometry.height - 8}
            textAnchor={geometry.coords.length === 1 ? "middle" : "start"}
            fill="var(--traza-text-muted)"
            fontSize="11"
            fontWeight="500"
          >
            {geometry.first.label}
          </text>
          {geometry.coords.length > 1 ? (
            <text
              x={geometry.coords[geometry.coords.length - 1].x}
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
