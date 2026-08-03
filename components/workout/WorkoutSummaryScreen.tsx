"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/forms/Button";
import {
  WorkoutCatalog,
  computeSessionStats,
  formatDurationMinutes,
  formatVolumeKg,
  useWorkoutSession,
} from "@/features/workout";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";

type WorkoutSummaryScreenProps = {
  sessionId: string;
};

export function WorkoutSummaryScreen({ sessionId }: WorkoutSummaryScreenProps) {
  const router = useRouter();
  const { session, hydrated, finish } = useWorkoutSession(sessionId);
  const finalized = useRef(false);

  useEffect(() => {
    if (!hydrated || !session || finalized.current) return;
    if (session.status !== "completed") {
      finish();
    }
    finalized.current = true;
  }, [hydrated, session, finish]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-[40px] w-[40px] animate-pulse rounded-full bg-primary/50" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-5 pt-safe">
        <p className="mt-12 text-body text-text-secondary">
          Sesión no encontrada.
        </p>
        <PrimaryButton className="mt-6" onClick={() => router.push("/train")}>
          Volver
        </PrimaryButton>
      </div>
    );
  }

  const stats = computeSessionStats(session);
  const routineName = session.templateId
    ? (WorkoutCatalog.getRoutineForSession(session)?.nameEs ?? "Entrenamiento")
    : "Entrenamiento";

  return (
    <motion.div
      className="flex min-h-dvh flex-col bg-[linear-gradient(165deg,#f7f8f3_0%,#fff8ed_42%,#f3f4ef_100%)] px-5 pb-safe pt-safe"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="relative mx-auto flex h-[88px] w-[88px] items-center justify-center">
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/25"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.35, 1.5] }}
            transition={{
              duration: 1.1,
              ease: motionEase.standard,
              times: [0, 0.45, 1],
            }}
          />
          <motion.div
            className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary shadow-train"
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: motionDuration.slow,
              ease: motionEase.spring,
            }}
            aria-hidden
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 34 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M8 17.5L14.2 23.5L26 10.5"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-primary"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.45,
                  ease: motionEase.standard,
                  delay: 0.18,
                }}
              />
            </svg>
          </motion.div>
        </div>

        <motion.p
          className="mt-6 text-center text-label font-medium uppercase tracking-label text-text-muted"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionDuration.normal,
            ease: motionEase.standard,
            delay: 0.05,
          }}
        >
          Entrenamiento completado
        </motion.p>
        <motion.h1
          className="mt-2 text-center text-[34px] font-bold leading-[0.98] tracking-[-0.035em] text-text-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionDuration.slow,
            ease: motionEase.spring,
            delay: 0.08,
          }}
        >
          {routineName}
        </motion.h1>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <SummaryStat
            label="Duración"
            value={formatDurationMinutes(stats.durationMinutes)}
            delay={0.12}
          />
          <SummaryStat
            label="Ejercicios"
            value={`${stats.exercisesCompleted}/${stats.exerciseTotal}`}
            delay={0.16}
          />
          <SummaryStat
            label="Series"
            value={String(stats.setsCompleted)}
            delay={0.2}
          />
          <SummaryStat
            label="Volumen"
            value={`${formatVolumeKg(stats.volumeKg)} kg`}
            delay={0.24}
          />
        </div>
      </div>

      <div className="pb-8">
        <PrimaryButton
          className="h-[56px] text-[17px]"
          onClick={() => router.push("/home")}
        >
          Finalizar entrenamiento
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

function SummaryStat({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      className="rounded-[20px] bg-surface/90 px-4 py-4 shadow-s ring-1 ring-black/[0.04]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionDuration.normal,
        ease: motionEase.standard,
        delay,
      }}
    >
      <p className="text-label font-medium uppercase tracking-label text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-text-primary tabular-nums">
        {value}
      </p>
    </motion.div>
  );
}
