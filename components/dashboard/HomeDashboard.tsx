"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Footprints,
  HeartPulse,
  Moon,
  Ruler,
  Scale,
  Settings,
} from "lucide-react";
import { PrimaryButton } from "@/components/forms/Button";
import { useToast } from "@/components/feedback/Toast";
import {
  formatBodyFatPct,
  formatEntryRelativeMeta,
  formatWeightKg,
  useWeightEntries,
} from "@/features/weight";
import {
  formatBloodPressureReading,
  formatPulse,
  useBloodPressureEntries,
} from "@/features/blood-pressure";
import { formatEntryStamp } from "@/lib/tracking/dateTime";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

/**
 * Home — Instrumento Premium (desirability)
 * System: docs/10_HOME_SYSTEM.md v2
 * Frozen layout: only Weight + Blood Pressure cards may change for Phase 1.
 */

function openModuleSoon(
  showToast: (message: string) => void,
  moduleName: string,
) {
  showToast(`El módulo de ${moduleName} llega en la Fase 1`);
}

function IconWell({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <Icon size={16} strokeWidth={2} aria-hidden />
    </span>
  );
}

type ModuleTileProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  tone?: "hero" | "elevated" | "quiet";
  className?: string;
  children: ReactNode;
};

function ModuleTile({
  label,
  icon,
  onClick,
  tone = "elevated",
  className,
  children,
}: ModuleTileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: motionDuration.fast, ease: motionEase.standard }}
      className={cn(
        "relative w-full overflow-hidden text-left",
        "rounded-[18px] p-3.5",
        "ring-1 ring-black/[0.04]",
        "transition-shadow duration-[var(--traza-duration-normal)]",
        tone === "hero" &&
          "bg-surface p-4 shadow-m hover:shadow-l",
        tone === "elevated" &&
          "bg-surface shadow-s hover:shadow-m",
        tone === "quiet" &&
          "bg-surface-secondary/90 shadow-xs hover:bg-surface-secondary",
        className,
      )}
    >
      {tone === "hero" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-primary/25 blur-3xl"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
          {label}
        </span>
        <IconWell icon={icon} />
      </div>
      <div className="relative mt-1.5">{children}</div>
    </motion.button>
  );
}

export function HomeDashboard() {
  const { showToast } = useToast();
  const router = useRouter();
  const { summary } = useWeightEntries();
  const { summary: bpSummary } = useBloodPressureEntries();
  const latestWeight = summary.latest;
  const latestBp = bpSummary.latest;

  return (
    <div className="relative -mx-5 flex min-h-[calc(100dvh-var(--traza-bottom-nav-height)-env(safe-area-inset-bottom))] flex-col">
      {/* Atmospheric page wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-90"
      />

      {/* Header — memorable brand moment */}
      <header className="relative px-5 pb-2 pt-6">
        <div className="flex items-center gap-3.5">
          <div className="relative flex size-14 items-center justify-center">
            <div
              aria-hidden
              className="absolute inset-0 rounded-[16px] bg-primary shadow-train"
            />
            <div className="relative flex size-[52px] items-center justify-center rounded-[14px] bg-primary-soft">
              <Image
                src="/logos/logo-isotipo.svg"
                alt=""
                width={34}
                height={34}
                priority
                className="size-[34px]"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[24px] font-bold leading-none tracking-[-0.035em] text-text-primary">
              TRAZA
            </p>
            <p className="mt-2 text-[13px] font-medium tracking-[0.02em] text-text-secondary">
              Jueves · 30 de julio
            </p>
          </div>

          <Link
            href="/more"
            aria-label="Ajustes"
            className="flex size-11 items-center justify-center text-text-secondary transition-colors hover:text-text-primary"
          >
            <Settings size={20} strokeWidth={1.7} />
          </Link>
        </div>
      </header>

      {/* Estado — composed instruments with unequal visual weight */}
      <section className="relative px-5 pt-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
            Estado
          </p>
          <p className="text-[11px] font-medium text-text-muted">Hoy</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <ModuleTile
            tone="hero"
            label="Peso"
            icon={Scale}
            onClick={() => router.push("/weight")}
          >
            {latestWeight ? (
              <motion.div
                key={latestWeight.id}
                initial={{ opacity: 0.72, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: motionDuration.normal,
                  ease: motionEase.standard,
                }}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-text-primary tabular-nums">
                    {formatWeightKg(latestWeight.weightKg)}
                  </span>
                  <span className="text-[15px] font-semibold text-text-muted">
                    kg
                  </span>
                </div>
                <p className="mt-1 text-[14px] font-medium leading-snug text-text-secondary tabular-nums">
                  {latestWeight.bodyFatPct !== null
                    ? `${formatBodyFatPct(latestWeight.bodyFatPct)} % grasa`
                    : "Sin % de grasa"}
                  <span className="mx-1.5 text-border-strong">·</span>
                  <span className="text-text-muted">
                    {formatEntryRelativeMeta(latestWeight)}
                  </span>
                </p>
              </motion.div>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-text-muted">
                    —
                  </span>
                  <span className="text-[15px] font-semibold text-text-muted">
                    kg
                  </span>
                </div>
                <p className="mt-1 text-[14px] font-medium leading-snug text-text-muted">
                  Sin registro
                </p>
              </>
            )}
          </ModuleTile>

          <div className="grid grid-cols-2 gap-2.5">
            <ModuleTile
              tone="elevated"
              label="Tensión"
              icon={HeartPulse}
              onClick={() => router.push("/blood-pressure")}
            >
              {latestBp ? (
                <motion.div
                  key={latestBp.id}
                  initial={{ opacity: 0.72, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: motionDuration.normal,
                    ease: motionEase.standard,
                  }}
                >
                  <p className="text-[24px] font-bold leading-none tracking-[-0.02em] text-text-primary tabular-nums">
                    {formatBloodPressureReading(
                      latestBp.systolic,
                      latestBp.diastolic,
                    )}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-text-secondary tabular-nums">
                    {formatPulse(latestBp.pulse)}
                    <span className="mx-1.5 text-border-strong">·</span>
                    <span className="text-text-muted">
                      {formatEntryStamp(latestBp)}
                    </span>
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-[24px] font-bold leading-none tracking-[-0.02em] text-text-muted">
                    — / —
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-text-muted">
                    Sin registro
                  </p>
                </>
              )}
            </ModuleTile>

            <ModuleTile
              tone="elevated"
              label="Sueño"
              icon={Moon}
              onClick={() => openModuleSoon(showToast, "sueño")}
            >
              <p className="text-[24px] font-bold leading-none tracking-[-0.02em] text-text-primary tabular-nums">
                7 h 21
              </p>
              <p className="mt-1 text-[13px] font-medium text-text-secondary tabular-nums">
                78 puntos
                <span className="mx-1.5 text-border-strong">·</span>
                <span className="text-text-muted">Hoy</span>
              </p>
            </ModuleTile>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <ModuleTile
              tone="quiet"
              label="Pasos"
              icon={Footprints}
              onClick={() => openModuleSoon(showToast, "pasos")}
            >
              <p className="text-[20px] font-bold leading-none tracking-[-0.015em] text-text-primary tabular-nums">
                12.483
              </p>
              <p className="mt-1 text-[13px] font-medium text-text-muted">Hoy</p>
            </ModuleTile>

            <ModuleTile
              tone="quiet"
              label="Medidas"
              icon={Ruler}
              onClick={() => openModuleSoon(showToast, "medidas")}
            >
              <p className="text-[20px] font-bold leading-none tracking-[-0.015em] text-text-primary tabular-nums">
                86{" "}
                <span className="text-[13px] font-semibold text-text-muted">cm</span>
              </p>
              <p className="mt-1 text-[13px] font-medium text-text-muted">
                Hace 6 días
              </p>
            </ModuleTile>
          </div>
        </div>
      </section>

      {/* Entrenamiento — special material, lime CTA as the desire magnet */}
      <section className="relative mt-auto px-5 pb-2.5 pt-3">
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: motionDuration.fast, ease: motionEase.standard }}
          className="relative overflow-hidden rounded-[22px] bg-surface-warm shadow-m ring-1 ring-black/[0.04]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 top-0 size-40 rounded-full bg-primary/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 bottom-0 size-32 rounded-full bg-primary/20 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
          />

          <div className="relative grid grid-cols-[1fr_112px] items-end gap-1 pl-4 pr-1 pt-4">
            <div className="min-w-0 pb-0.5">
              <p className="text-[20px] font-bold leading-tight tracking-[-0.025em] text-text-primary">
                Entrenamiento
              </p>
              <p className="mt-1.5 max-w-[12rem] text-[13px] leading-snug text-text-secondary">
                Entra en modo sesión. La rutina se elige después.
              </p>
            </div>
            <div className="relative h-[108px] w-[112px] drop-shadow-[0_12px_24px_rgba(20,23,20,0.12)]">
              <Image
                src="/exercises/hack-squat.png"
                alt=""
                fill
                sizes="112px"
                className="object-contain object-bottom"
                priority
              />
            </div>
          </div>

          <div className="relative px-4 pb-4 pt-2">
            <PrimaryButton
              onClick={() => showToast("El entrenamiento llega en la Fase 2")}
            >
              Comenzar entrenamiento
            </PrimaryButton>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
