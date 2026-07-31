"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PrimaryButton } from "@/components/forms/Button";

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] bg-surface px-5 pb-6 pt-8 text-center shadow-m ring-1 ring-black/[0.04]"
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

      <div className="relative mx-auto mb-4 flex size-12 items-center justify-center rounded-[14px] bg-primary-soft text-text-primary">
        <Icon size={22} strokeWidth={1.8} />
      </div>

      <h2 className="relative text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
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
