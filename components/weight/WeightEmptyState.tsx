"use client";

import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { PrimaryButton } from "@/components/forms/Button";

type WeightEmptyStateProps = {
  onCreate: () => void;
};

export function WeightEmptyState({ onCreate }: WeightEmptyStateProps) {
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

      {/* Soft chart silhouette — evolution is the promise */}
      <div className="relative mx-auto mb-6 h-28 w-full max-w-[260px]">
        <svg viewBox="0 0 260 112" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="emptyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--traza-primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--traza-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M12 78 C 48 70, 72 42, 108 48 C 144 54, 168 28, 204 34 C 228 38, 244 22, 248 18 L 248 100 L 12 100 Z"
            fill="url(#emptyArea)"
          />
          <path
            d="M12 78 C 48 70, 72 42, 108 48 C 144 54, 168 28, 204 34 C 228 38, 244 22, 248 18"
            fill="none"
            stroke="var(--traza-text-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.35"
          />
          <circle cx="248" cy="18" r="5" fill="var(--traza-primary)" stroke="var(--traza-text-primary)" strokeWidth="2" opacity="0.55" />
        </svg>
      </div>

      <div className="relative mx-auto mb-4 flex size-12 items-center justify-center rounded-[14px] bg-primary-soft text-text-primary">
        <Scale size={22} strokeWidth={1.8} />
      </div>

      <h2 className="relative text-[20px] font-semibold tracking-[-0.02em] text-text-primary">
        Empieza a trazar tu peso
      </h2>
      <p className="relative mx-auto mt-2 max-w-[16rem] text-[14px] leading-snug text-text-secondary">
        Un registro al día basta. Aquí verás cómo evoluciona con el tiempo.
      </p>

      <div className="relative mx-auto mt-6 max-w-xs">
        <PrimaryButton onClick={onCreate}>Registrar primer peso</PrimaryButton>
      </div>
    </motion.section>
  );
}
