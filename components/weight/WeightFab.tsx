"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { pressAnimation } from "@/lib/motion";

type WeightComposeActionProps = {
  onClick: () => void;
  variant?: "dock" | "inline";
};

/** Primary capture CTA — docked to the module, not a floating orphan. */
export function WeightComposeAction({
  onClick,
  variant = "dock",
}: WeightComposeActionProps) {
  if (variant === "inline") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={pressAnimation.whileTap}
        transition={pressAnimation.transition}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-border-strong/80 bg-surface-secondary/40 px-4 py-3.5 text-[14px] font-semibold text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
      >
        <Plus size={18} strokeWidth={2} />
        Registrar peso
      </motion.button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--traza-z-nav)]">
      <div className="mx-auto w-full max-w-[length:var(--traza-content-max)] px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-background via-background/95 to-transparent">
        <motion.button
          type="button"
          aria-label="Registrar peso"
          onClick={onClick}
          whileTap={pressAnimation.whileTap}
          transition={pressAnimation.transition}
          className="pointer-events-auto flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-[15px] font-semibold tracking-[-0.01em] text-text-primary shadow-train"
        >
          <Plus size={20} strokeWidth={2.2} />
          Registrar peso
        </motion.button>
      </div>
    </div>
  );
}
