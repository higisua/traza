"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton } from "@/components/forms/Button";
import { useRoutines } from "@/features/routines";
import {
  WorkoutCatalog,
  WorkoutService,
  formatApproxDuration,
  formatExerciseCount,
  formatLastTrainedLabel,
  useActiveWorkoutSession,
} from "@/features/workout";
import { listItemVariants, motionDuration, motionEase } from "@/lib/motion";

export function RoutineSelectionScreen() {
  const router = useRouter();
  const { active } = useRoutines({ status: "active" });
  const routines = useMemo(
    () =>
      active
        .map((routine) => WorkoutCatalog.getRoutine(routine.slug))
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [active],
  );
  const { session: activeSession, hydrated } = useActiveWorkoutSession();

  return (
    <div className="relative flex flex-col pb-8 pt-2">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative">
        <PageHeader title="Entrenar" onBack={() => router.push("/home")} />
      </div>

      {hydrated && activeSession ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: motionDuration.normal,
            ease: motionEase.standard,
          }}
          className="relative mb-5 overflow-hidden rounded-[20px] bg-primary/25 p-4 ring-1 ring-primary/40"
        >
          <p className="text-label font-medium uppercase tracking-label text-text-secondary">
            Sesión en curso
          </p>
          <p className="mt-1 text-card-title font-semibold text-text-primary">
            Continúa donde lo dejaste
          </p>
          <PrimaryButton
            className="mt-3"
            onClick={() => router.push(`/workout/${activeSession.id}`)}
          >
            Continuar entrenamiento
          </PrimaryButton>
        </motion.div>
      ) : null}

      <ul className="relative mt-2 flex flex-col gap-3">
        <AnimatePresence>
          {routines.map((routine, index) => {
            const lastDate = hydrated
              ? WorkoutService.getLastRoutineSessionDate(routine.slug)
              : null;
            const lastLabel = lastDate
              ? formatLastTrainedLabel(lastDate)
              : null;

            return (
              <motion.li
                key={routine.slug}
                custom={index}
                variants={listItemVariants}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href={`/train/${routine.slug}`}
                  className="group relative flex items-stretch overflow-hidden rounded-[24px] bg-surface-warm shadow-m ring-1 ring-black/[0.04] transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-8 top-0 h-[120px] w-[120px] rounded-full bg-primary/20 blur-3xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-4 bottom-0 h-[96px] w-[96px] rounded-full bg-primary/14 blur-2xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  />

                  <div className="relative flex min-w-0 flex-1 flex-col justify-center py-4 pl-4 pr-2">
                    <h2 className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-text-primary">
                      {routine.nameEs}
                    </h2>
                    <p className="mt-1.5 text-[13px] text-text-secondary">
                      {formatExerciseCount(routine.exerciseCount)} ·{" "}
                      {formatApproxDuration(routine.estimatedDurationMinutes)}
                    </p>
                    {lastLabel ? (
                      <p className="mt-1 text-[12px] text-text-muted">
                        {lastLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="relative h-[112px] w-[112px] shrink-0 drop-shadow-[0_12px_24px_rgba(20,23,20,0.12)]">
                    <Image
                      src={routine.coverImage}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-contain object-bottom transition-transform duration-[var(--traza-duration-normal)] group-hover:scale-[1.03]"
                    />
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
