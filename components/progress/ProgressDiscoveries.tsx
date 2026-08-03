"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  GitBranch,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { Insight, InsightType } from "@/features/insights";
import {
  oneSentence,
  progressSectionLabelClass,
} from "@/features/progress";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ProgressDiscoveriesProps = {
  featured: Insight[];
  more: Insight[];
  typeLabel: (type: InsightType) => string;
};

const TYPE_ICON: Record<InsightType, LucideIcon> = {
  correlation: GitBranch,
  trend: TrendingUp,
  warning: AlertTriangle,
  recommendation: Lightbulb,
  achievement: Sparkles,
};

function DiscoveryCard({
  insight,
  typeLabel,
  featured,
  compact,
}: {
  insight: Insight;
  typeLabel: (type: InsightType) => string;
  featured?: boolean;
  compact?: boolean;
}) {
  const Icon = TYPE_ICON[insight.type];
  const blurb = oneSentence(insight.description);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[16px]",
        featured
          ? "bg-[linear-gradient(135deg,var(--traza-primary-soft)_0%,var(--traza-surface)_55%,var(--traza-surface-secondary)_100%)] px-3.5 py-2.5 ring-1 ring-black/[0.04] shadow-s"
          : compact
            ? "bg-surface-secondary/55 px-3 py-2 ring-1 ring-black/[0.03]"
            : "bg-surface-secondary/65 px-3.5 py-2.5 ring-1 ring-black/[0.03]",
      )}
    >
      {featured ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-primary/25 blur-2xl"
        />
      ) : null}
      <div className="relative flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex shrink-0 items-center justify-center rounded-[8px]",
            featured
              ? "size-7 bg-surface/90 text-text-primary shadow-xs"
              : "size-6 bg-surface/70 text-text-muted",
          )}
        >
          <Icon size={compact ? 12 : 14} strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={progressSectionLabelClass}>
            {typeLabel(insight.type)}
          </p>
          <h3
            className={cn(
              "mt-0.5 font-semibold leading-snug tracking-[-0.015em] text-text-primary",
              featured ? "text-[15px]" : "text-[13.5px]",
            )}
          >
            {insight.title}
          </h3>
          {blurb ? (
            <p className="mt-0.5 text-caption leading-snug text-text-secondary">
              {blurb}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Discoveries — paints top Insights Engine ranking only.
 * Up to 3 featured (engine order); rest behind Ver más. No category hardcoding.
 */
export function ProgressDiscoveries({
  featured,
  more,
  typeLabel,
}: ProgressDiscoveriesProps) {
  const [open, setOpen] = useState(false);

  if (featured.length === 0) return null;

  const [principal, ...rest] = featured;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionDuration.slow,
        ease: motionEase.standard,
        delay: 0.03,
      }}
    >
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <p className={progressSectionLabelClass}>Descubrimientos</p>
        {more.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-caption font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            Ver más
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <DiscoveryCard
          insight={principal!}
          typeLabel={typeLabel}
          featured
        />
        {rest.map((insight) => (
          <DiscoveryCard
            key={insight.id}
            insight={insight}
            typeLabel={typeLabel}
            compact
          />
        ))}
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Más descubrimientos"
        className="max-h-[min(78dvh,640px)] overflow-y-auto"
      >
        <div className="flex flex-col gap-2">
          {more.map((insight) => (
            <DiscoveryCard
              key={insight.id}
              insight={insight}
              typeLabel={typeLabel}
            />
          ))}
        </div>
      </BottomSheet>
    </motion.section>
  );
}
