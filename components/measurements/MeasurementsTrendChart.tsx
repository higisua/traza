"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { MeasurementChartPoint } from "@/features/measurements";
import { formatCm } from "@/features/measurements";

type MeasurementsTrendChartProps = {
  points: MeasurementChartPoint[];
};

/** Soft TRAZA palette — waist darkest (priority), arm cool muted, leg lime. */
const COLORS = {
  waist: "var(--traza-text-primary)",
  arm: "var(--traza-info)",
  leg: "var(--traza-primary)",
} as const;

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

export function MeasurementsTrendChart({ points }: MeasurementsTrendChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 360;
    const height = 196;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 28;
    const values = points.flatMap((p) => [p.waistCm, p.armCm, p.legCm]);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const padding =
      points.length === 1
        ? 4
        : Math.max((dataMax - dataMin) * 0.2, 1.5);
    const min = dataMin - padding;
    const max = dataMax + padding;
    const span = Math.max(max - min, 2);
    const plotBottom = height - padBottom;

    const plotX = (index: number) =>
      points.length === 1
        ? padLeft + (width - padLeft - padRight) / 2
        : padLeft +
          (index / (points.length - 1)) * (width - padLeft - padRight);

    const plotY = (value: number) =>
      padTop + (1 - (value - min) / span) * (plotBottom - padTop);

    const series = {
      waist: points.map((point, index) => ({
        x: plotX(index),
        y: plotY(point.waistCm),
        point,
      })),
      arm: points.map((point, index) => ({
        x: plotX(index),
        y: plotY(point.armCm),
        point,
      })),
      leg: points.map((point, index) => ({
        x: plotX(index),
        y: plotY(point.legCm),
        point,
      })),
    };

    const guideRatios = points.length === 1 ? [0.5] : [0, 0.5, 1];
    const guides = guideRatios.map((ratio) => {
      const value = max - span * ratio;
      return {
        y: padTop + ratio * (plotBottom - padTop),
        label: formatCm(points.length === 1 ? dataMin : value),
      };
    });

    return {
      width,
      height,
      series,
      guides,
      padLeft,
      first: points[0],
      latest: points[points.length - 1],
      waistLine: buildSmoothLine(series.waist),
      armLine: buildSmoothLine(series.arm),
      legLine: buildSmoothLine(series.leg),
    };
  }, [points]);

  if (!geometry) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[24px] bg-surface shadow-s ring-1 ring-black/[0.04]"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Evolución
          </p>
          <p className="mt-1 text-[13px] font-medium text-text-secondary">
            Transformación corporal
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2 rounded-full bg-text-primary" />
            Cintura
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2 rounded-full bg-info" />
            Brazo
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2 rounded-full bg-primary" />
            Pierna
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="h-[196px] w-full"
          role="img"
          aria-label="Evolución de las medidas corporales"
        >
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

          {(
            [
              ["leg", geometry.legLine, COLORS.leg, 2.4],
              ["arm", geometry.armLine, COLORS.arm, 2.4],
              ["waist", geometry.waistLine, COLORS.waist, 2.9],
            ] as const
          ).map(([key, d, stroke, width], seriesIndex) => (
            <motion.path
              key={key}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.35 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 0.7,
                delay: seriesIndex * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          ))}

          {geometry.series.leg.map((coord, index) => {
            const isLast = index === geometry.series.leg.length - 1;
            if (!isLast && geometry.series.leg.length > 8) return null;
            return (
              <circle
                key={`l-${coord.point.id}`}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 4 : 2.75}
                fill={isLast ? COLORS.leg : "var(--traza-surface)"}
                stroke={COLORS.leg}
                strokeWidth="1.75"
              />
            );
          })}
          {geometry.series.arm.map((coord, index) => {
            const isLast = index === geometry.series.arm.length - 1;
            if (!isLast && geometry.series.arm.length > 8) return null;
            return (
              <circle
                key={`a-${coord.point.id}`}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 4 : 2.75}
                fill={isLast ? COLORS.arm : "var(--traza-surface)"}
                stroke={COLORS.arm}
                strokeWidth="1.75"
              />
            );
          })}
          {geometry.series.waist.map((coord, index) => {
            const isLast = index === geometry.series.waist.length - 1;
            if (!isLast && geometry.series.waist.length > 8) return null;
            return (
              <circle
                key={`w-${coord.point.id}`}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 5 : 3.25}
                fill={isLast ? COLORS.waist : "var(--traza-surface)"}
                stroke={COLORS.waist}
                strokeWidth="2"
              />
            );
          })}

          <text
            x={geometry.series.waist[0].x}
            y={geometry.height - 8}
            textAnchor={geometry.series.waist.length === 1 ? "middle" : "start"}
            fill="var(--traza-text-muted)"
            fontSize="11"
            fontWeight="500"
          >
            {geometry.first.label}
          </text>
          {geometry.series.waist.length > 1 ? (
            <text
              x={geometry.series.waist[geometry.series.waist.length - 1].x}
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
