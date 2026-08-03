"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BlockMetric } from "@/features/progress";
import { progressSectionLabelClass, variationClass } from "@/features/progress";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ProgressConceptBlockProps = {
  title: string;
  href: string;
  metrics: BlockMetric[];
  chart?: ReactNode;
  sparse?: boolean;
  sparseMessage?: string;
  footer?: ReactNode;
  density?: "relevant" | "medium" | "compact";
  /** When true, first metric is emphasized (composition lead). */
  leadFirst?: boolean;
  className?: string;
};

/**
 * Conceptual Progress block — one reading, primary deep-link, chevron CTA.
 * Sub-metrics may deep-link elsewhere without nested buttons.
 */
export function ProgressConceptBlock({
  title,
  href,
  metrics,
  chart,
  sparse,
  sparseMessage,
  footer,
  density = "medium",
  leadFirst = false,
  className,
}: ProgressConceptBlockProps) {
  const router = useRouter();
  const lead = leadFirst && metrics.length > 0 ? metrics[0] : null;
  const rest = lead ? metrics.slice(1) : metrics;

  return (
    <motion.section
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionDuration.normal, ease: motionEase.standard }}
      className={cn(
        "w-full overflow-hidden ring-1 ring-black/[0.04]",
        density === "relevant" &&
          "rounded-[20px] bg-surface p-3 shadow-s",
        density === "medium" &&
          "rounded-[18px] bg-surface/95 px-3 py-2.5 shadow-xs",
        density === "compact" &&
          "rounded-[16px] bg-surface-secondary/70 px-3 py-2 shadow-none ring-black/[0.03]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => router.push(href)}
        className="flex w-full items-start justify-between gap-2 text-left"
      >
        <p className={progressSectionLabelClass}>{title}</p>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-[7px] text-text-muted",
            density === "compact"
              ? "bg-surface/80"
              : "bg-surface-secondary/80",
          )}
        >
          <ChevronRight size={14} strokeWidth={2} aria-hidden />
        </span>
      </button>

      {lead ? (
        <button
          type="button"
          onClick={() => router.push(lead.href ?? href)}
          className="mt-2 flex w-full items-baseline justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-caption font-medium text-text-muted">
              {lead.label}
            </p>
            <p className="mt-0.5 text-[20px] font-bold tracking-[-0.03em] tabular-nums text-text-primary">
              {lead.value}
            </p>
          </div>
          {lead.detail ? (
            <p
              className={cn(
                "shrink-0 text-[15px] font-semibold tabular-nums",
                variationClass(lead.tone),
              )}
            >
              {lead.detail}
            </p>
          ) : null}
        </button>
      ) : null}

      {rest.length > 0 ? (
        <ul
          className={cn(
            "grid gap-x-3 gap-y-1.5",
            lead ? "mt-2.5 border-t border-black/[0.04] pt-2.5" : "mt-2",
            rest.length >= 4 ? "grid-cols-4" : rest.length === 3 ? "grid-cols-3" : "grid-cols-2",
          )}
        >
          {rest.map((metric) => {
            const target = metric.href ?? href;
            return (
              <li key={metric.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => router.push(target)}
                  className="block w-full min-w-0 text-left"
                >
                  <p className="truncate text-label font-medium text-text-muted">
                    {metric.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 truncate font-semibold tracking-[-0.02em] tabular-nums text-text-primary",
                      density === "compact" ? "text-[14px]" : "text-[15px]",
                    )}
                  >
                    {metric.value}
                  </p>
                  {metric.detail ? (
                    <p
                      className={cn(
                        "mt-0.5 truncate text-label font-medium tabular-nums",
                        variationClass(metric.tone),
                      )}
                    >
                      {metric.detail}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {sparse ? (
        <button
          type="button"
          onClick={() => router.push(href)}
          className="mt-2 w-full text-left text-caption leading-snug text-text-muted"
        >
          {sparseMessage}
        </button>
      ) : chart ? (
        <button
          type="button"
          onClick={() => router.push(href)}
          className="mt-1.5 -mx-0.5 block w-[calc(100%+4px)] text-left"
        >
          {chart}
        </button>
      ) : null}

      {footer ? <div className="mt-1.5">{footer}</div> : null}
    </motion.section>
  );
}
