"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/forms/Button";
import { RestTimerOverlay } from "@/components/workout/RestTimerOverlay";
import {
  LoadStepper,
  RirChips,
  SessionProgressBar,
  SetProgressDots,
  StepperField,
} from "@/components/workout/SetControls";
import {
  WorkoutCatalog,
  WorkoutService,
  formatExerciseProgress,
  formatSetProgress,
  formatSetSnapshotLine,
  useWorkoutSession,
} from "@/features/workout";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";

type WorkoutSessionScreenProps = {
  sessionId: string;
};

export function WorkoutSessionScreen({ sessionId }: WorkoutSessionScreenProps) {
  const router = useRouter();
  const {
    session,
    hydrated,
    activeExerciseIndex,
    nextPendingTarget,
    draft,
    setDraft,
    error,
    rest,
    editingLast,
    justLogged,
    clearJustLogged,
    goToExercise,
    goToNextPending,
    logSet,
    skipRest,
    completeRest,
    pauseRest,
    resumeRest,
    beginEditLast,
    cancelEdit,
    finish,
  } = useWorkoutSession(sessionId);

  const [showCheck, setShowCheck] = useState(false);
  const closingRef = useRef(false);

  const exercise = session?.exercises[activeExerciseIndex] ?? null;
  const catalog = exercise
    ? WorkoutCatalog.getExercise(exercise.exerciseId)
    : null;
  const plannedSets = session
    ? WorkoutService.plannedSets(session, activeExerciseIndex)
    : 1;
  const exerciseComplete = session
    ? WorkoutService.isExerciseComplete(session, activeExerciseIndex)
    : false;
  const currentSetNumber = exerciseComplete
    ? plannedSets
    : Math.min((exercise?.sets.length ?? 0) + (editingLast ? 0 : 1), plannedSets);
  const logContext = session
    ? WorkoutService.getExerciseLogContext(session, activeExerciseIndex)
    : { lastSession: null, priorSet: null };
  const restNext = session && rest
    ? WorkoutService.getRestNextContext(session, rest)
    : null;
  const progress = useMemo(() => {
    if (!session) return null;
    return WorkoutService.sessionProgress(session, activeExerciseIndex);
  }, [session, activeExerciseIndex]);
  const sessionWorkDone = session
    ? WorkoutService.isSessionWorkComplete(session)
    : false;
  const hasPendingAhead =
    session != null &&
    WorkoutService.nextPendingTarget(session, activeExerciseIndex) != null;
  const canBrowseBack = activeExerciseIndex > 0;
  const canBrowseForward =
    session != null && activeExerciseIndex < session.exercises.length - 1;

  useEffect(() => {
    if (!justLogged) return;
    setShowCheck(true);
    const id = window.setTimeout(() => {
      setShowCheck(false);
      clearJustLogged();
    }, 520);
    return () => window.clearTimeout(id);
  }, [justLogged, clearJustLogged]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f3f4ef]">
        <div className="h-[40px] w-[40px] animate-pulse rounded-full bg-primary/50" />
      </div>
    );
  }

  if (!session || !exercise || !catalog) {
    return (
      <div className="px-5 pt-safe">
        <PageHeader title="Sesión" onBack={() => router.push("/train")} />
        <p className="mt-8 text-body text-text-secondary">
          Esta sesión ya no está disponible.
        </p>
        <PrimaryButton className="mt-6" onClick={() => router.push("/train")}>
          Volver a Entrenar
        </PrimaryButton>
      </div>
    );
  }

  const isDuration =
    catalog.trackingType === "Time" || catalog.trackingType === "Cardio";
  const isRepsOnly = catalog.trackingType === "Repetitions";
  const canEdit = exercise.sets.length > 0 && !editingLast;

  async function handleFinish() {
    const done = finish();
    if (!done) return;
    router.push(`/workout/${sessionId}/summary`);
  }

  function handleRegister() {
    if (closingRef.current) return;
    const outcome = logSet();
    if (!outcome) return;

    if (outcome.kind === "logged" && outcome.sessionComplete) {
      closingRef.current = true;
      window.setTimeout(() => {
        const done = finish();
        if (done) router.push(`/workout/${sessionId}/summary`);
      }, 480);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-[linear-gradient(180deg,#f7f8f3_0%,#eef1e8_48%,#f3f4ef_100%)]">
      <div className="px-5 pt-safe">
        <PageHeader
          title={
            session.templateId
              ? (WorkoutCatalog.getRoutine(session.templateId)?.nameEs ??
                "Sesión")
              : "Sesión"
          }
          onBack={() => router.push("/train")}
          action={
            <GhostButton
              fullWidth={false}
              className="h-[40px] min-w-0 px-3 text-caption"
              onClick={handleFinish}
            >
              Finalizar
            </GhostButton>
          }
        />
      </div>

      <div className="flex items-center justify-between px-5 pb-1">
        <button
          type="button"
          aria-label="Ejercicio anterior"
          disabled={!canBrowseBack}
          onClick={() => goToExercise(activeExerciseIndex - 1)}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] text-text-primary disabled:opacity-30"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <div className="text-center">
          <p className="text-label font-medium uppercase tracking-label text-text-muted">
            Ejercicio
          </p>
          <p className="text-caption font-semibold text-text-secondary tabular-nums">
            {formatExerciseProgress(
              activeExerciseIndex + 1,
              session.exercises.length,
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label="Ejercicio siguiente"
          disabled={!canBrowseForward}
          onClick={() => goToExercise(activeExerciseIndex + 1)}
          className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] text-text-primary disabled:opacity-30"
        >
          <ChevronRight size={22} strokeWidth={2} />
        </button>
      </div>

      {progress ? (
        <div className="mb-3">
          <SessionProgressBar
            exercises={progress.exercises}
            activeIndex={activeExerciseIndex}
          />
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={exercise.id}
          className="relative flex flex-1 flex-col px-5 pb-6"
          variants={fadeSlideVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <AnimatePresence>
            {showCheck ? (
              <motion.div
                className="pointer-events-none absolute inset-x-0 top-[72px] z-10 flex justify-center"
                initial={{ opacity: 0, scale: 0.7, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{
                  duration: motionDuration.fast,
                  ease: motionEase.spring,
                }}
              >
                <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-primary shadow-train">
                  <Check
                    size={22}
                    strokeWidth={2.6}
                    className="text-text-primary"
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="relative mx-auto h-[112px] w-[100px]">
            <Image
              src={catalog.image}
              alt=""
              fill
              sizes="100px"
              className="object-contain drop-shadow-[0_12px_22px_rgba(20,23,20,0.12)]"
              priority
            />
          </div>

          <div className="mt-1 text-center">
            <h2 className="text-[24px] font-bold leading-tight tracking-[-0.03em] text-text-primary">
              {catalog.nameEs}
            </h2>
            <p className="mt-1 text-[14px] font-semibold text-text-secondary">
              {exerciseComplete && !editingLast
                ? "Completado"
                : formatSetProgress(currentSetNumber, plannedSets)}
            </p>
            <SetProgressDots
              current={currentSetNumber}
              total={plannedSets}
              complete={exerciseComplete && !editingLast}
            />
          </div>

          {exerciseComplete && !editingLast ? (
            <div className="mt-auto space-y-2.5 pt-8">
              <p className="text-center text-[14px] text-text-secondary">
                {sessionWorkDone
                  ? "Todo listo en esta sesión."
                  : hasPendingAhead ||
                      nextPendingTarget !== activeExerciseIndex
                    ? "Este ejercicio ya está hecho. Seguimos con lo pendiente."
                    : "Este ejercicio ya está hecho."}
              </p>
              {!sessionWorkDone ? (
                <PrimaryButton
                  onClick={goToNextPending}
                  className="h-[56px] text-[17px] shadow-train"
                >
                  Continuar
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={handleFinish}
                  className="h-[56px] text-[17px] shadow-train"
                >
                  Ver resumen
                </PrimaryButton>
              )}
              {canEdit ? (
                <SecondaryButton onClick={beginEditLast}>
                  Editar última serie
                </SecondaryButton>
              ) : null}
            </div>
          ) : (
            <>
              {!editingLast &&
              (logContext.lastSession || logContext.priorSet) ? (
                <div className="mt-3 space-y-1.5 rounded-[16px] bg-surface/70 px-3.5 py-2.5 ring-1 ring-border-light/70">
                  {logContext.lastSession ? (
                    <p className="text-[13px] leading-snug text-text-secondary">
                      <span className="font-medium text-text-muted">
                        Última sesión
                      </span>
                      <span className="mx-1.5 text-text-muted/50">·</span>
                      <span className="tabular-nums text-text-primary">
                        {formatSetSnapshotLine(logContext.lastSession)}
                      </span>
                    </p>
                  ) : null}
                  {logContext.priorSet ? (
                    <p className="text-[13px] leading-snug text-text-secondary">
                      <span className="font-medium text-text-muted">
                        Serie anterior
                      </span>
                      <span className="mx-1.5 text-text-muted/50">·</span>
                      <span className="tabular-nums text-text-primary">
                        {formatSetSnapshotLine(logContext.priorSet)}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 space-y-3.5">
                {isDuration ? (
                  <StepperField
                    label="Duración"
                    value={draft.durationSeconds}
                    unit="s"
                    step={5}
                    onChange={(durationSeconds) =>
                      setDraft({ ...draft, durationSeconds })
                    }
                  />
                ) : (
                  <>
                    {!isRepsOnly ? (
                      <LoadStepper
                        value={draft.load}
                        onChange={(load) => setDraft({ ...draft, load })}
                      />
                    ) : null}
                    <StepperField
                      label="Reps"
                      value={draft.repetitions}
                      step={1}
                      onChange={(repetitions) =>
                        setDraft({ ...draft, repetitions })
                      }
                    />
                    <RirChips
                      value={draft.rir}
                      onChange={(rir) => setDraft({ ...draft, rir })}
                    />
                  </>
                )}
              </div>

              {error ? (
                <p className="mt-3 text-center text-caption text-danger">
                  {error}
                </p>
              ) : null}

              <div className="mt-auto space-y-2.5 pt-5">
                <motion.div
                  key={editingLast ? "save" : "register"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: motionDuration.fast,
                    ease: motionEase.standard,
                  }}
                >
                  <PrimaryButton
                    onClick={handleRegister}
                    className="h-[56px] text-[17px] shadow-train"
                  >
                    {editingLast ? "Guardar cambios" : "Registrar serie"}
                  </PrimaryButton>
                </motion.div>

                {editingLast ? (
                  <SecondaryButton onClick={cancelEdit}>
                    Cancelar
                  </SecondaryButton>
                ) : canEdit ? (
                  <SecondaryButton onClick={beginEditLast}>
                    Editar
                  </SecondaryButton>
                ) : null}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {rest ? (
        <RestTimerOverlay
          rest={rest}
          next={restNext}
          onSkip={skipRest}
          onComplete={completeRest}
          onPause={pauseRest}
          onResume={resumeRest}
        />
      ) : null}
    </div>
  );
}
