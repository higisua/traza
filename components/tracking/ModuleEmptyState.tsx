"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PrimaryButton } from "@/components/forms/Button";
import { fadeSlideVariants } from "@/lib/motion";

type ModuleEmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon: LucideIcon;
  illustration?: ReactNode;
};

export function ModuleEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  illustration,
}: ModuleEmptyStateProps) {
  return (
    <motion.section
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-[24px] bg-surface px-5 pb-6 pt-8 text-center shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)]"
      />

      {illustration ? (
        <div className="relative mx-auto mb-6 h-28 w-full max-w-[260px]">
          {illustration}
        </div>
      ) : null}

      <div className="relative mx-auto mb-4 flex size-12 items-center justify-center rounded-[12px] bg-primary-soft text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <h2 className="relative text-[20px] font-semibold leading-title tracking-[-0.02em] text-text-primary">
        {title}
      </h2>
      <p className="relative mx-auto mt-2 max-w-[16rem] text-[14px] leading-snug text-text-secondary">
        {description}
      </p>

      <div className="relative mx-auto mt-6 max-w-xs">
        <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
      </div>
    </motion.section>
  );
}
