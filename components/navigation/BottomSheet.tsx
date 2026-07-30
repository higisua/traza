"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { backdropVariants, sheetVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[var(--traza-z-sheet)] flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-text-primary/30"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 w-full max-w-[length:var(--traza-content-max)]",
              "rounded-t-xl bg-surface shadow-l",
              "px-5 pb-[max(env(safe-area-inset-bottom),24px)] pt-4",
              className,
            )}
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-border-strong" />
            {title ? (
              <h2 className="mb-5 text-card-title font-semibold leading-title tracking-title text-text-primary">
                {title}
              </h2>
            ) : null}
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
