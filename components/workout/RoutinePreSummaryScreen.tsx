"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton } from "@/components/forms/Button";
import {
  WorkoutCatalog,
  WorkoutService,
  formatApproxDuration,
  formatExerciseCount,
  formatLastSessionDate,
  formatVolumeKg,
  useActiveWorkoutSession,
} from "@/features/workout";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";

type RoutinePreSummaryScreenProps = {
  slug: string;
};

export function RoutinePreSummaryScreen({ slug }: RoutinePreSummaryScreenProps) {
  const router = useRouter();
  const routine = WorkoutCatalog.getRoutine(slug);
  const { session: active, hydrated } = useActiveWorkoutSession();
  const lastSummary =
    hydrated && routine
      ? WorkoutService.getLastRoutineSessionSummary(routine.slug)
      : null;

  if (!routine) {
    return (
      <div className="pt-2">
        <PageHeader title="Rutina" onBack={() => router.push("/train")} />
        <p className="mt-6 text-body text-text-secondary">
          No encontramos esa rutina.
        </p>
      </div>
    );
  }

  function handleStart() {
    if (active && active.templateId === routine!.slug) {
      router.push(`/workout/${active.id}`);
      return;
    }
    if (active) {
      router.push(`/workout/${active.id}`);
      return;
    }
    const session = WorkoutService.startSession(routine!.slug);
    if (!session) return;
    window.dispatchEvent(new Event("traza:workout-sessions"));
    router.push(`/workout/${session.id}`);
  }

  return (
    <motion.div
      className="flex h-[calc(100dvh-var(--traza-bottom-nav-height)-env(safe-area-inset-bottom))] flex-col pt-2"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader title={routine.nameEs} onBack={() => router.push("/train")} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mt-3 space-y-4 pb-2">
          <div>
            <p className="text-[15px] text-text-secondary">
              {formatExerciseCount(routine.exerciseCount)} ·{" "}
              {formatApproxDuration(routine.estimatedDurationMinutes)}
            </p>
            {hydrated ? (
              lastSummary ? (
                <p className="mt-2 text-[13px] text-text-muted">
                  Última vez · {formatLastSessionDate(lastSummary.sessionDate)}
                  {lastSummary.volumeKg > 0 ? (
                    <>
                      <span className="mx-1.5 text-text-muted/40">·</span>
                      <span className="tabular-nums">
                        {formatVolumeKg(lastSummary.volumeKg)} kg
                      </span>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-text-muted">
                  Primera vez con esta rutina
                </p>
              )
            ) : (
              <p className="mt-2 h-[18px] text-[13px] text-transparent">.</p>
            )}
          </div>

          <ul className="space-y-2">
            {routine.exercises.map((plan, index) => {
              const exercise = WorkoutCatalog.getExercise(plan.exerciseSlug);
              if (!exercise) return null;
              return (
                <motion.li
                  key={plan.exerciseSlug}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.standard,
                    delay: index * 0.025,
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[12px] bg-surface-secondary/60">
                    <Image
                      src={exercise.image}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-text-primary">
                      {exercise.nameEs}
                    </p>
                    <p className="text-caption text-text-muted">
                      {plan.durationMinutes
                        ? `${plan.durationMinutes} min`
                        : `${plan.sets} series`}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-4">
        <PrimaryButton onClick={handleStart}>
          Comenzar entrenamiento
        </PrimaryButton>
      </div>
    </motion.div>
  );
}
