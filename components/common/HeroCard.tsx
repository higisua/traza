"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeSlideVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";
import { PrimaryButton } from "@/components/forms/Button";

type HeroMeta = {
  label: string;
  value: string;
};

type HeroCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  value?: string;
  support?: string;
  meta?: HeroMeta[];
  progress?: number;
  progressLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  /** Optional exercise illustration — adds identity without empty height */
  imageSrc?: string;
  imageAlt?: string;
  children?: ReactNode;
  className?: string;
};

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  value,
  support,
  meta,
  progress,
  progressLabel,
  actionLabel,
  onAction,
  actionLoading,
  imageSrc,
  imageAlt = "",
  children,
  className,
}: HeroCardProps) {
  return (
    <motion.section
      variants={fadeSlideVariants}
      initial={false}
      animate="visible"
      className={cn(
        "relative overflow-hidden",
        "rounded-xl shadow-hero",
        "bg-[linear-gradient(145deg,var(--traza-primary-soft)_0%,var(--traza-surface)_34%,var(--traza-surface)_100%)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-primary"
      />

      <div className="relative grid grid-cols-[1fr_auto] gap-3 px-5 pb-5 pt-5">
        <div className="min-w-0 flex flex-col">
          <div className="flex flex-col gap-0.5">
            {eyebrow ? (
              <p className="text-label font-medium tracking-label text-text-muted uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="text-body font-semibold leading-title tracking-title text-text-primary">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-caption font-medium text-text-muted">{subtitle}</p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {value ? (
              <p className="text-display font-bold leading-display tracking-display text-text-primary tabular-nums">
                {value}
              </p>
            ) : null}

            {meta && meta.length > 0 ? (
              <p className="text-caption font-medium text-text-secondary">
                {meta.map((item, index) => (
                  <span key={`${item.label}-${item.value}`}>
                    {index > 0 ? (
                      <span className="mx-2 text-border-strong">·</span>
                    ) : null}
                    <span className="tabular-nums text-text-primary font-semibold">
                      {item.value}
                    </span>{" "}
                    {item.label}
                  </span>
                ))}
              </p>
            ) : null}

            {support ? (
              <p className="text-caption text-text-secondary">{support}</p>
            ) : null}

            {typeof progress === "number" ? (
              <div className="mt-1 flex items-center gap-3">
                <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={false}
                    animate={{
                      width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
                    }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                {progressLabel ? (
                  <span className="shrink-0 text-label font-medium tracking-label text-text-muted tabular-nums uppercase">
                    {progressLabel}
                  </span>
                ) : null}
              </div>
            ) : null}

            {children}
          </div>
        </div>

        {imageSrc ? (
          <div className="relative -mr-1 -mt-1 h-[132px] w-[108px] shrink-0 self-start">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="108px"
              className="object-contain object-bottom"
              priority
            />
          </div>
        ) : null}
      </div>

      {actionLabel ? (
        <div className="relative px-5 pb-5">
          <PrimaryButton onClick={onAction} loading={actionLoading}>
            {actionLabel}
          </PrimaryButton>
        </div>
      ) : null}
    </motion.section>
  );
}
