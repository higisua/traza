"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cardMotion } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type TrendDirection = "up" | "down" | "flat";
type MetricSize = "featured" | "default" | "quiet";

type MetricCardProps = {
  label: string;
  value: string;
  unit?: string;
  trendLabel?: string;
  trendDirection?: TrendDirection;
  size?: MetricSize;
  onClick?: () => void;
  className?: string;
};

function MetricContent({
  label,
  value,
  unit,
  trendLabel,
  trendDirection,
  size,
}: {
  label: string;
  value: string;
  unit?: string;
  trendLabel?: string;
  trendDirection: TrendDirection;
  size: MetricSize;
}) {
  const isFeatured = size === "featured";
  const isQuiet = size === "quiet";

  return (
    <>
      <span className="text-label font-medium tracking-label text-text-muted uppercase">
        {label}
      </span>

      <div className={cn("flex items-baseline gap-1", isFeatured ? "mt-3" : "mt-2.5")}>
        <span
          className={cn(
            "font-bold leading-display tracking-display text-text-primary tabular-nums",
            isFeatured && "text-hero-number",
            size === "default" && "text-section",
            isQuiet && "text-card-title",
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-caption font-medium text-text-muted">{unit}</span>
        ) : null}
      </div>

      {trendLabel ? (
        <p
          className={cn(
            "mt-2 text-caption font-medium tabular-nums",
            trendDirection === "down" && "text-success",
            trendDirection === "up" && "text-text-secondary",
            trendDirection === "flat" && "text-text-muted",
          )}
        >
          {trendLabel}
        </p>
      ) : null}
    </>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  trendLabel,
  trendDirection = "flat",
  size = "default",
  onClick,
  className,
}: MetricCardProps) {
  const classes = cn(
    "flex flex-col items-start justify-start text-left",
    size === "featured" && "rounded-l bg-surface px-5 py-4 shadow-s",
    size === "default" && "rounded-l bg-surface px-4 py-4 shadow-xs",
    size === "quiet" && "rounded-l bg-surface-secondary/60 px-4 py-3.5 shadow-none",
    onClick && "cursor-pointer",
    className,
  );

  const content: ReactNode = (
    <MetricContent
      label={label}
      value={value}
      unit={unit}
      trendLabel={trendLabel}
      trendDirection={trendDirection}
      size={size}
    />
  );

  if (onClick) {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        {...cardMotion}
        className={classes}
      >
        {content}
      </motion.button>
    );
  }

  return <div className={classes}>{content}</div>;
}
