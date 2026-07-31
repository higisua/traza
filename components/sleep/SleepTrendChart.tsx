"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { motionDuration, motionEase } from "@/lib/motion";
import type { SleepChartPoint } from "@/features/sleep";
import { formatSleepDuration } from "@/features/sleep";

type SleepTrendChartProps = {
  points: SleepChartPoint[];
};

/**
 * Night bars for duration + optional score beads.
 * Distinct from Weight (line) and Blood Pressure (dual line).
 */
export function SleepTrendChart({ points }: SleepTrendChartProps) {
  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const width = 360;
    const height = 188;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 24;
    const padBottom = 28;
    const plotBottom = height - padBottom;
    const plotHeight = plotBottom - padTop;
    const plotWidth = width - padLeft - padRight;

    const durations = points.map((p) => p.durationMinutes);
    const maxDuration = Math.max(...durations, 8 * 60);
    const minDuration = 0;
    const span = Math.max(maxDuration - minDuration, 60);

    const slot = plotWidth / Math.max(points.length, 1);
    const barWidth = Math.min(22, Math.max(10, slot * 0.55));

    const bars = points.map((point, index) => {
      const cx =
        points.length === 1
          ? padLeft + plotWidth / 2
          : padLeft + slot * index + slot / 2;
      const barHeight = (point.durationMinutes / span) * plotHeight;
      const y = plotBottom - barHeight;
      const scoreY =
        point.score !== null
          ? padTop + (1 - point.score / 100) * plotHeight
          : null;
      return { point, cx, y, barHeight, scoreY };
    });

    const guideHours = [8, 6, 4].filter((h) => h * 60 <= maxDuration + 60);
    const guides = (guideHours.length > 0 ? guideHours : [8, 4]).map((hours) => {
      const minutes = hours * 60;
      const y = plotBottom - (minutes / span) * plotHeight;
      return { y, label: `${hours} h` };
    });

    return {
      width,
      height,
      bars,
      guides,
      padLeft,
      first: points[0],
      latest: points[points.length - 1],
      avgMinutes: Math.round(
        durations.reduce((sum, value) => sum + value, 0) / durations.length,
      ),
    };
  }, [points]);

  if (!geometry) return null;

  const hasScores = points.some((point) => point.score !== null);

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
            Media {formatSleepDuration(geometry.avgMinutes)}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
            <span className="size-2.5 rounded-[3px] bg-text-primary/80" />
            Duración
          </span>
          {hasScores ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
              <span className="size-2 rounded-full bg-primary" />
              Puntos
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="h-[188px] w-full"
          role="img"
          aria-label="Evolución del sueño"
        >
          {geometry.guides.map((guide) => (
            <g key={guide.label}>
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

          {geometry.bars.map((bar, index) => (
            <g key={bar.point.id}>
              <motion.rect
                x={bar.cx - 11}
                y={bar.y}
                width={22}
                height={Math.max(bar.barHeight, 4)}
                rx={8}
                fill="var(--traza-text-primary)"
                opacity={index === geometry.bars.length - 1 ? 0.88 : 0.22}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: index === geometry.bars.length - 1 ? 0.88 : 0.22,
                }}
                style={{ originY: 1, originX: 0.5 }}
                transition={{
                  delay: index * 0.04,
                  duration: motionDuration.slow,
                  ease: motionEase.standard,
                }}
              />
              {bar.scoreY !== null ? (
                <motion.circle
                  cx={bar.cx}
                  cy={bar.scoreY}
                  r={4.5}
                  fill="var(--traza-primary)"
                  stroke="var(--traza-text-primary)"
                  strokeWidth="1.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.04, duration: motionDuration.normal }}
                />
              ) : null}
            </g>
          ))}

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
