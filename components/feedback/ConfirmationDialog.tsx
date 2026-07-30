"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { DangerButton, GhostButton, SecondaryButton } from "@/components/forms/Button";
import { backdropVariants, scaleInVariants } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  className?: string;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
  children,
  className,
}: ConfirmationDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[var(--traza-z-dialog)] flex items-center justify-center px-5">
          <motion.button
            type="button"
            aria-label="Cerrar diálogo"
            className="absolute inset-0 bg-text-primary/30"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onCancel}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-description"
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 w-full max-w-[length:var(--traza-forms-max)]",
              "rounded-l bg-surface p-6 shadow-l",
              className,
            )}
          >
            <h2
              id="confirm-title"
              className="text-card-title font-semibold leading-title tracking-title text-text-primary"
            >
              {title}
            </h2>
            <p
              id="confirm-description"
              className="mt-3 text-body text-text-secondary"
            >
              {description}
            </p>
            {children}
            <div className="mt-6 flex flex-col gap-3">
              {tone === "danger" ? (
                <DangerButton onClick={onConfirm}>{confirmLabel}</DangerButton>
              ) : (
                <SecondaryButton onClick={onConfirm}>{confirmLabel}</SecondaryButton>
              )}
              <GhostButton onClick={onCancel}>{cancelLabel}</GhostButton>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
