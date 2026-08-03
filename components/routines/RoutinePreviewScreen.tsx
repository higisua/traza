"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import {
  type RoutineBlock,
  useRoutines,
} from "@/features/routines";
import {
  WorkoutCatalog,
  formatApproxDuration,
  formatExerciseCount,
  formatRepRange,
} from "@/features/workout";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";

type RoutinePreviewScreenProps = {
  routineId?: string;
  draft?: boolean;
};

type PreviewModel = {
  name: string;
  description: string;
  goal: string | null;
  estimatedDurationMinutes: number;
  versionLabel: string;
  blocks: RoutineBlock[];
  backHref: string;
};

export function RoutinePreviewScreen({
  routineId,
  draft = false,
}: RoutinePreviewScreenProps) {
  const router = useRouter();
  const { getWithCurrentVersion } = useRoutines();
  const [hydrated, setHydrated] = useState(false);
  const [model, setModel] = useState<PreviewModel | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (draft) {
      try {
        const raw = sessionStorage.getItem("traza:routine-preview-draft");
        if (!raw) {
          setModel(null);
          return;
        }
        const parsed = JSON.parse(raw) as {
          name: string;
          description: string;
          goal: string;
          estimatedDurationMinutes: number;
          blocks: RoutineBlock[];
          backHref?: string;
        };
        setModel({
          name: parsed.name,
          description: parsed.description,
          goal: parsed.goal || null,
          estimatedDurationMinutes: parsed.estimatedDurationMinutes,
          versionLabel: "Borrador",
          blocks: parsed.blocks ?? [],
          backHref: parsed.backHref ?? "/more/training/routines/new",
        });
      } catch {
        setModel(null);
      }
      return;
    }

    if (!routineId) {
      setModel(null);
      return;
    }

    const pack = getWithCurrentVersion(routineId);
    if (!pack) {
      setModel(null);
      return;
    }

    setModel({
      name: pack.routine.nameEs,
      description: pack.routine.description,
      goal: pack.routine.goal,
      estimatedDurationMinutes: pack.version.estimatedDurationMinutes,
      versionLabel: "Programa",
      blocks: [...pack.version.blocks].sort((a, b) => a.order - b.order),
      backHref: `/more/training/routines/${routineId}`,
    });
  }, [hydrated, draft, routineId, getWithCurrentVersion]);

  if (!hydrated) {
    return (
      <div className="px-5 pt-2">
        <PageHeader title="Vista previa" onBack={() => router.back()} />
        <div className="mt-6 h-[120px] rounded-[20px] bg-surface/60" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Vista previa"
          onBack={() => router.push("/more/training/routines")}
        />
        <p className="mt-8 text-center text-body text-text-secondary">
          No hay nada que previsualizar.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="relative min-h-dvh px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-2"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative">
        <PageHeader
          title="Vista previa"
          onBack={() => router.push(model.backHref)}
        />

        <p className="mt-1 text-caption text-text-secondary">
          Así se verá al empezar la sesión · solo lectura
        </p>

        <div className="mt-5 overflow-hidden rounded-[24px] bg-surface-warm p-5 shadow-m ring-1 ring-black/[0.04]">
          <p className="text-label font-medium uppercase tracking-label text-text-muted">
            {model.versionLabel}
          </p>
          <h2 className="mt-1 text-[24px] font-bold tracking-[-0.02em] text-text-primary">
            {model.name}
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            {formatExerciseCount(model.blocks.length)} ·{" "}
            {formatApproxDuration(model.estimatedDurationMinutes)}
          </p>
          {model.goal ? (
            <p className="mt-2 text-[13px] font-medium text-text-primary">
              Objetivo · {model.goal}
            </p>
          ) : null}
          {model.description ? (
            <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
              {model.description}
            </p>
          ) : null}
        </div>

        <ul className="mt-4 space-y-2">
          {model.blocks.map((block, index) => {
            const exercise = WorkoutCatalog.getExercise(block.exerciseSlug);
            const range =
              block.repMin != null || block.repMax != null
                ? formatRepRange(
                    block.repMin ?? block.repMax ?? 0,
                    block.repMax ?? block.repMin ?? 0,
                  )
                : null;
            return (
              <motion.li
                key={block.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionDuration.fast,
                  ease: motionEase.standard,
                  delay: index * 0.03,
                }}
                className="flex items-center gap-3 rounded-[16px] bg-surface px-3 py-3 shadow-xs ring-1 ring-black/[0.03]"
              >
                <div className="relative size-[48px] shrink-0 overflow-hidden rounded-[14px] bg-surface-secondary/70">
                  {exercise ? (
                    <Image
                      src={exercise.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain p-0.5"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-text-primary">
                    {exercise?.nameEs ?? block.exerciseSlug}
                  </p>
                  <p className="mt-0.5 text-caption text-text-muted">
                    {block.durationMinutes
                      ? `${block.durationMinutes} min`
                      : block.durationSeconds
                        ? `${block.durationSeconds} s × ${block.sets}`
                        : `${block.sets} series`}
                    {range ? (
                      <>
                        <span className="mx-1.5 text-text-muted/40">·</span>
                        {range}
                      </>
                    ) : null}
                    {block.rirMin != null || block.rirMax != null ? (
                      <>
                        <span className="mx-1.5 text-text-muted/40">·</span>
                        RIR {block.rirMin ?? "–"}–{block.rirMax ?? "–"}
                      </>
                    ) : null}
                  </p>
                  {block.comment ? (
                    <p className="mt-1 text-[12px] text-text-secondary">
                      {block.comment}
                    </p>
                  ) : null}
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-text-muted">
                  {index + 1}
                </span>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-[12px] text-text-muted">
          La sesión real usará esta estructura en el momento de empezar.
        </p>
      </div>
    </motion.div>
  );
}
