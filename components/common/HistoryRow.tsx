"use client";

import { motion } from "framer-motion";
import { cardMotion } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type HistoryRowProps = {
  date: string;
  value: string;
  onClick?: () => void;
  className?: string;
};

export function HistoryRow({ date, value, onClick, className }: HistoryRowProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...cardMotion}
      className={cn(
        "flex h-[length:var(--traza-history-row-height)] w-full items-center gap-3",
        "rounded-l bg-surface px-4 text-left shadow-xs",
        "hover:bg-surface-hover",
        className,
      )}
    >
      <span className="min-w-0 flex-1 text-caption font-medium text-text-muted">
        {date}
      </span>
      <span className="text-body font-semibold tracking-title text-text-primary tabular-nums">
        {value}
      </span>
    </motion.button>
  );
}
