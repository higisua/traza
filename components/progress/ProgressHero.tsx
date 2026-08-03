"use client";

import { motion } from "framer-motion";
import type { HeroSummary } from "@/features/progress";
import { progressSectionLabelClass, variationClass } from "@/features/progress";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ProgressHeroProps = {
  hero: HeroSummary;
  periodLabel: string;
};

/**
 * Editorial cover — one dominant period signal + sparse supporting context.
 * Content comes from HeroSummary (Analytics), not a fixed KPI list.
 */
export function ProgressHero({ hero, periodLabel }: ProgressHeroProps) {
  if (!hero.primary) {
    return (
      <section className="rounded-[22px] bg-surface/85 px-4 py-3 ring-1 ring-black/[0.03]">
        <p className={progressSectionLabelClass}>Resumen · {periodLabel}</p>
        <p className="mt-1.5 text-[15px] font-medium leading-snug text-text-secondary">
          Aún no hay cambios claros en {periodLabel}. Sigue registrando: el
          resumen aparecerá cuando haya datos suficientes.
        </p>
      </section>
    );
  }

  const { primary, supporting } = hero;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.slow, ease: motionEase.standard }}
      className="relative overflow-hidden rounded-[22px] bg-surface px-4 py-3 shadow-hero ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-primary/22 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-36 rounded-full bg-[linear-gradient(135deg,var(--traza-primary-soft),transparent)] opacity-90 blur-2xl"
      />

      <p className={cn("relative", progressSectionLabelClass)}>
        Resumen · {periodLabel}
      </p>

      <div className="relative mt-2">
        <p className="text-caption font-medium text-text-muted">
          {primary.label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-[36px] font-bold leading-none tracking-[-0.04em] tabular-nums",
            variationClass(primary.tone),
          )}
        >
          {primary.primary}
        </p>
        {primary.secondary ? (
          <p className="mt-1 text-caption font-medium text-text-secondary">
            {primary.secondary}
          </p>
        ) : null}
      </div>

      {supporting.length > 0 ? (
        <ul
          className={cn(
            "relative mt-2.5 grid gap-x-4 gap-y-1.5 border-t border-black/[0.04] pt-2",
            supporting.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {supporting.map((metric) => (
            <li key={metric.id} className="min-w-0">
              <p className="truncate text-caption font-medium text-text-muted">
                {metric.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 truncate text-[15px] font-semibold tracking-[-0.02em] tabular-nums",
                  variationClass(metric.tone),
                )}
              >
                {metric.primary}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </motion.section>
  );
}
