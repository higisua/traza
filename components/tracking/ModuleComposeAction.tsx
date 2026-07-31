"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { pressAnimation } from "@/lib/motion";

type ModuleComposeActionProps = {
  label: string;
  onClick: () => void;
};

/** Full-width docked capture CTA — shared across tracking modules. */
export function ModuleComposeAction({
  label,
  onClick,
}: ModuleComposeActionProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--traza-z-nav)]">
      <div className="mx-auto w-full max-w-[length:var(--traza-content-max)] bg-gradient-to-t from-background via-background/95 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-8">
        <motion.button
          type="button"
          aria-label={label}
          onClick={onClick}
          whileTap={pressAnimation.whileTap}
          transition={pressAnimation.transition}
          className="pointer-events-auto flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-primary text-[15px] font-semibold tracking-[-0.01em] text-text-primary shadow-train"
        >
          <Plus size={20} strokeWidth={2.2} />
          {label}
        </motion.button>
      </div>
    </div>
  );
}
