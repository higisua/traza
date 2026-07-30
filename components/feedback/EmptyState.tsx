"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeSlideVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";
import { PrimaryButton } from "@/components/forms/Button";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeSlideVariants}
      initial={false}
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center px-4 py-8 text-center",
        className,
      )}
    >
      {illustration ? (
        <div className="mb-5">{illustration}</div>
      ) : null}

      <h2 className="max-w-xs text-card-title font-semibold leading-title tracking-title text-text-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-caption text-text-secondary">{description}</p>

      {actionLabel ? (
        <div className="mt-6 w-full max-w-xs">
          <PrimaryButton onClick={onAction}>{actionLabel}</PrimaryButton>
        </div>
      ) : null}
    </motion.div>
  );
}
