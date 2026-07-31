"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, SkipForward } from "lucide-react";
import { formatRestClock, formatSetProgress } from "@/features/workout";
import type { RestNextContext, RestState } from "@/features/workout";
import { GhostButton, SecondaryButton } from "@/components/forms/Button";
import { motionDuration, motionEase, scaleInVariants } from "@/lib/motion";

type RestTimerOverlayProps = {
  rest: RestState;
  next?: RestNextContext | null;
  onSkip: () => void;
  onComplete: () => void;
  onPause: () => void;
  onResume: () => void;
};

export function RestTimerOverlay({
  rest,
  next,
  onSkip,
  onComplete,
  onPause,
  onResume,
}: RestTimerOverlayProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (rest.pausedRemainingMs != null) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [rest.pausedRemainingMs, rest.endsAt]);

  const remainingMs =
    rest.pausedRemainingMs != null
      ? rest.pausedRemainingMs
      : Math.max(0, rest.endsAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = 1 - remainingMs / (rest.totalSeconds * 1000);

  useEffect(() => {
    if (rest.pausedRemainingMs != null) return;
    if (remainingMs <= 0) {
      onComplete();
    }
    // Intentionally only react to clock reaching zero
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs <= 0, rest.pausedRemainingMs]);

  const paused = rest.pausedRemainingMs != null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[var(--traza-z-sheet)] flex flex-col bg-[#121412]/92 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: motionDuration.fast }}
      >
        <motion.div
          className="mx-auto flex h-full w-full max-w-[length:var(--traza-content-max)] flex-col px-5 pb-safe pt-safe"
          variants={scaleInVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between pt-4">
            <p className="text-label font-medium uppercase tracking-label text-white/55">
              Descanso
            </p>
            <GhostButton
              fullWidth={false}
              className="h-[40px] min-w-0 px-3 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={onSkip}
            >
              Seguir
            </GhostButton>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="relative flex h-[240px] w-[240px] items-center justify-center">
              <svg
                className="absolute inset-0 h-full w-full -rotate-90"
                viewBox="0 0 240 240"
                aria-hidden
              >
                <circle
                  cx="120"
                  cy="120"
                  r="108"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="108"
                  fill="none"
                  stroke="var(--traza-primary)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 108}
                  strokeDashoffset={2 * Math.PI * 108 * (1 - Math.min(1, Math.max(0, progress)))}
                  transition={{ duration: 0.2, ease: motionEase.standard }}
                />
              </svg>
              <p className="text-[64px] font-bold leading-none tracking-[-0.04em] text-white tabular-nums">
                {formatRestClock(remainingSeconds)}
              </p>
            </div>

            {next ? (
              <div className="mt-6 max-w-[280px] text-center">
                <p className="text-label font-medium uppercase tracking-label text-white/45">
                  {next.kind === "next_exercise"
                    ? "Siguiente ejercicio"
                    : "Siguiente"}
                </p>
                <p className="mt-1.5 text-[20px] font-semibold leading-tight tracking-[-0.02em] text-white">
                  {next.exerciseName}
                </p>
                <p className="mt-1.5 text-[15px] text-white/60">
                  {formatSetProgress(next.setNumber, next.plannedSets)}
                </p>
              </div>
            ) : (
              <p className="mt-6 text-body text-white/60">
                Prepárate para la siguiente serie
              </p>
            )}
          </div>

          <div className="flex gap-3 pb-6">
            <SecondaryButton
              className="border-white/15 bg-white/10 text-white hover:bg-white/16"
              onClick={paused ? onResume : onPause}
            >
              {paused ? (
                <span className="inline-flex items-center gap-2">
                  <Play size={18} strokeWidth={2.2} />
                  Reanudar
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Pause size={18} strokeWidth={2.2} />
                  Pausar
                </span>
              )}
            </SecondaryButton>
            <PrimarySkip onClick={onSkip} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PrimarySkip({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.988 }}
      className="inline-flex h-[length:var(--traza-button-height)] w-full items-center justify-center gap-2 rounded-m bg-primary text-text-primary shadow-train"
    >
      <SkipForward size={18} strokeWidth={2.2} />
      Saltar
    </motion.button>
  );
}
