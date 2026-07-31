"use client";

import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import type { BloodPressureChartPoint } from "@/features/blood-pressure";

type BloodPressureTrendChartProps = {
  points: BloodPressureChartPoint[];
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

export function BloodPressureTrendChart({ points }: BloodPressureTrendChartProps) {
  const uid = useId().replace(/:/g, "");
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 360;
    const height = 188;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 28;
    const values = points.flatMap((p) => [p.systolic, p.diastolic]);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const padding =
      points.length === 1
        ? 12
        : Math.max((dataMax - dataMin) * 0.18, 8);
    const min = dataMin - padding;
    const max = dataMax + padding;
    const span = Math.max(max - min, 10);
    const plotBottom = height - padBottom;

    const plotX = (index: number) =>
      points.length === 1
        ? padLeft + (width - padLeft - padRight) / 2
        : padLeft + (index / (points.length - 1)) * (width - padLeft - padRight);

    const plotY = (value: number) =>
      padTop + (1 - (value - min) / span) * (plotBottom - padTop);

    const sysCoords = points.map((point, index) => ({
      x: plotX(index),
      y: plotY(point.systolic),
      point,
    }));
    const diaCoords = points.map((point, index) => ({
      x: plotX(index),
      y: plotY(point.diastolic),
      point,
    }));

    const guideRatios = points.length === 1 ? [0.5] : [0, 0.5, 1];
    const guides = guideRatios.map((ratio) => {
      const value = max - span * ratio;
      return {
        y: padTop + ratio * (plotBottom - padTop),
        label: String(Math.round(points.length === 1 ? dataMin : value)),
      };
    });

    return {
      width,
      height,
      sysCoords,
      diaCoords,
      sysLine: buildSmoothLine(sysCoords),
      diaLine: buildSmoothLine(diaCoords),
      guides,
      padLeft,
      latest: points[points.length - 1],
      first: points[0],
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
            Sistólica y diastólica
          </p>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2 rounded-full bg-text-primary" />
            SYS
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2 rounded-full bg-primary" />
            DIA
          </span>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="h-[188px] w-full"
          role="img"
          aria-label="Evolución de la tensión arterial"
        >
          <defs>
            <linearGradient id={`bpSys-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--traza-text-primary)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--traza-text-primary)" stopOpacity="0" />
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
            d={geometry.diaLine}
            fill="none"
            stroke="var(--traza-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          />
          <motion.path
            d={geometry.sysLine}
            fill="none"
            stroke="var(--traza-text-primary)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.35 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />

          {geometry.diaCoords.map((coord, index) => {
            const isLast = index === geometry.diaCoords.length - 1;
            if (!isLast && geometry.diaCoords.length > 6) return null;
            return (
              <circle
                key={`d-${coord.point.id}`}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 4.5 : 3}
                fill={isLast ? "var(--traza-primary)" : "var(--traza-surface)"}
                stroke="var(--traza-primary)"
                strokeWidth="2"
              />
            );
          })}
          {geometry.sysCoords.map((coord, index) => {
            const isLast = index === geometry.sysCoords.length - 1;
            if (!isLast && geometry.sysCoords.length > 6) return null;
            return (
              <circle
                key={`s-${coord.point.id}`}
                cx={coord.x}
                cy={coord.y}
                r={isLast ? 5 : 3.25}
                fill={isLast ? "var(--traza-text-primary)" : "var(--traza-surface)"}
                stroke="var(--traza-text-primary)"
                strokeWidth="2"
              />
            );
          })}

          <text
            x={geometry.sysCoords[0].x}
            y={geometry.height - 8}
            textAnchor={geometry.sysCoords.length === 1 ? "middle" : "start"}
            fill="var(--traza-text-muted)"
            fontSize="11"
            fontWeight="500"
          >
            {geometry.first.label}
          </text>
          {geometry.sysCoords.length > 1 ? (
            <text
              x={geometry.sysCoords[geometry.sysCoords.length - 1].x}
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
