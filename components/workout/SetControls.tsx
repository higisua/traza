"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Minus, Plus } from "lucide-react";
import { formatLoadDisplay } from "@/features/workout";
import { cn } from "@/lib/utils/cn";

type StepperFieldProps = {
  label: string;
  value: string;
  unit?: string;
  step?: number;
  min?: number;
  decimals?: number;
  onChange: (value: string) => void;
  className?: string;
};

type LoadStepperProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function parseValue(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatValue(n: number, decimals: number): string {
  if (decimals <= 0) {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
    }).format(Math.round(n));
  }
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(n.toFixed(decimals)));
}

function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function useHoldRepeat(action: () => void) {
  const actionRef = useRef(action);
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      if (intervalRef.current != null) window.clearInterval(intervalRef.current);
    };
  }, []);

  function clear() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function start() {
    clear();
    actionRef.current();
    timerRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        actionRef.current();
      }, 70);
    }, 320);
  }

  return {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      start();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
  };
}

export function StepperField({
  label,
  value,
  unit,
  step = 1,
  min = 0,
  decimals = 0,
  onChange,
  className,
}: StepperFieldProps) {
  const valueRef = useRef(value);
  valueRef.current = value;

  function nudge(direction: 1 | -1) {
    const current = parseValue(valueRef.current) ?? 0;
    const next = Math.max(min, current + direction * step);
    const formatted = formatValue(next, decimals);
    valueRef.current = formatted;
    onChange(formatted);
  }

  const downHold = useHoldRepeat(() => nudge(-1));
  const upHold = useHoldRepeat(() => nudge(1));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-center text-label font-medium uppercase tracking-label text-text-muted">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Bajar ${label}`}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-surface-secondary text-text-primary active:scale-[0.97]"
          {...downHold}
        >
          <Minus size={20} strokeWidth={2.2} />
        </button>
        <div
          className="relative flex h-[56px] min-w-0 flex-1 items-center justify-center rounded-[16px] border border-border/80 bg-surface px-3 shadow-xs"
          aria-live="polite"
        >
          <span className="text-[28px] font-bold tracking-[-0.03em] text-text-primary tabular-nums">
            {value || "0"}
          </span>
          {unit ? (
            <span className="absolute inset-y-0 right-3 flex items-center text-caption font-medium text-text-muted">
              {unit}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Subir ${label}`}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-surface-secondary text-text-primary active:scale-[0.97]"
          {...upHold}
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

/**
 * Gym load without keyboard.
 * Fine ±1 kg / coarse ±10 kg + vertical scrub on the value (drag up/down).
 * Spanish display (52,5). Hold to repeat.
 */
export function LoadStepper({
  label = "Carga",
  value,
  onChange,
  className,
}: LoadStepperProps) {
  const fine = 1;
  const coarse = 10;
  const valueRef = useRef(value);
  valueRef.current = value;

  const dragRef = useRef<{
    startY: number;
    startValue: number;
    pointerId: number;
  } | null>(null);

  function nudge(step: number, direction: 1 | -1) {
    const current = parseValue(valueRef.current) ?? 0;
    const snapped = snapToStep(current, fine);
    const aligned = Math.abs(current - snapped) < 0.001;
    const next = Math.max(0, aligned ? snapped + direction * step : snapped);
    const formatted = formatLoadDisplay(Number(next.toFixed(1)));
    valueRef.current = formatted;
    onChange(formatted);
  }

  function applyAbsolute(next: number) {
    const safe = Math.max(0, snapToStep(next, fine));
    const formatted = formatLoadDisplay(Number(safe.toFixed(1)));
    valueRef.current = formatted;
    onChange(formatted);
  }

  const fineDown = useHoldRepeat(() => nudge(fine, -1));
  const fineUp = useHoldRepeat(() => nudge(fine, 1));
  const coarseDown = useHoldRepeat(() => nudge(coarse, -1));
  const coarseUp = useHoldRepeat(() => nudge(coarse, 1));

  function onScrubPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const current = parseValue(valueRef.current) ?? 0;
    dragRef.current = {
      startY: event.clientY,
      startValue: current,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onScrubPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    // Drag up = heavier; ~8px per kg for fast gym adjustments.
    const deltaY = drag.startY - event.clientY;
    const deltaKg = Math.round(deltaY / 8);
    applyAbsolute(drag.startValue + deltaKg);
  }

  function onScrubPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-center text-label font-medium uppercase tracking-label text-text-muted">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Bajar 10 kg"
          className="flex h-[52px] w-[44px] shrink-0 flex-col items-center justify-center rounded-[14px] bg-surface-secondary text-text-secondary active:scale-[0.97]"
          {...coarseDown}
        >
          <span className="text-[11px] font-semibold leading-none">−10</span>
        </button>
        <button
          type="button"
          aria-label="Bajar 1 kg"
          className="flex h-[52px] w-[48px] shrink-0 items-center justify-center rounded-[16px] bg-surface-secondary text-text-primary active:scale-[0.97]"
          {...fineDown}
        >
          <Minus size={20} strokeWidth={2.2} />
        </button>
        <div
          role="slider"
          aria-label="Carga en kilogramos. Arrastra arriba o abajo para ajustar."
          aria-valuemin={0}
          aria-valuenow={parseValue(value) ?? 0}
          aria-valuetext={`${value || "0"} kilogramos`}
          tabIndex={0}
          onPointerDown={onScrubPointerDown}
          onPointerMove={onScrubPointerMove}
          onPointerUp={onScrubPointerUp}
          onPointerCancel={onScrubPointerUp}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowRight") {
              event.preventDefault();
              nudge(fine, 1);
            } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
              event.preventDefault();
              nudge(fine, -1);
            } else if (event.key === "PageUp") {
              event.preventDefault();
              nudge(coarse, 1);
            } else if (event.key === "PageDown") {
              event.preventDefault();
              nudge(coarse, -1);
            }
          }}
          className="relative flex h-[56px] min-w-0 flex-1 touch-none select-none items-center justify-center rounded-[16px] border border-border/80 bg-surface px-3 shadow-xs active:bg-surface-secondary/40"
        >
          <span className="text-[28px] font-bold tracking-[-0.03em] text-text-primary tabular-nums">
            {value || "0"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption font-medium text-text-muted">
            kg
          </span>
        </div>
        <button
          type="button"
          aria-label="Subir 1 kg"
          className="flex h-[52px] w-[48px] shrink-0 items-center justify-center rounded-[16px] bg-surface-secondary text-text-primary active:scale-[0.97]"
          {...fineUp}
        >
          <Plus size={20} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          aria-label="Subir 10 kg"
          className="flex h-[52px] w-[44px] shrink-0 flex-col items-center justify-center rounded-[14px] bg-surface-secondary text-text-secondary active:scale-[0.97]"
          {...coarseUp}
        >
          <span className="text-[11px] font-semibold leading-none">+10</span>
        </button>
      </div>
    </div>
  );
}

type RirChipsProps = {
  value: number | null;
  onChange: (value: number) => void;
};

export function RirChips({ value, onChange }: RirChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-label font-medium uppercase tracking-label text-text-muted">
        RIR
      </p>
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4].map((rir) => {
          const active = value === rir;
          return (
            <button
              key={rir}
              type="button"
              onClick={() => onChange(rir)}
              className={cn(
                "flex h-[52px] w-[52px] items-center justify-center rounded-[16px] text-[18px] font-semibold tabular-nums transition-colors",
                active
                  ? "bg-primary text-text-primary shadow-train"
                  : "bg-surface-secondary text-text-secondary",
              )}
            >
              {rir}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type SetProgressDotsProps = {
  current: number;
  total: number;
  /** When true, all sets for this exercise are already logged. */
  complete?: boolean;
};

/** Serie ● ● ◉ ○ — done / current / pending. Never ambiguous. */
export function SetProgressDots({
  current,
  total,
  complete = false,
}: SetProgressDotsProps) {
  const safeTotal = Math.max(1, total);
  const filled = complete
    ? safeTotal
    : Math.min(Math.max(1, current), safeTotal);

  return (
    <div
      className="mt-2.5 flex items-center justify-center gap-2.5"
      aria-label={`Serie ${filled} de ${safeTotal}`}
    >
      {Array.from({ length: safeTotal }, (_, index) => {
        const setNumber = index + 1;
        const done = complete ? true : setNumber < filled;
        const active = !complete && setNumber === filled;
        return (
          <span
            key={index}
            className={cn(
              "inline-flex items-center justify-center rounded-full transition-all duration-[var(--traza-duration-fast)]",
              active
                ? "h-[14px] w-[14px] bg-text-primary shadow-[0_0_0_3px_rgba(20,23,20,0.12)]"
                : done
                  ? "h-[10px] w-[10px] bg-primary"
                  : "h-[10px] w-[10px] bg-text-primary/16 ring-1 ring-text-primary/10",
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

type SessionProgressBarProps = {
  exercises: { done: number; total: number; state: string }[];
  activeIndex: number;
};

/** Segmented session progress — one cell per exercise, fill by sets. */
export function SessionProgressBar({
  exercises,
  activeIndex,
}: SessionProgressBarProps) {
  return (
    <div
      className="mx-auto flex w-full gap-1.5 px-5"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={exercises.reduce((sum, item) => sum + item.total, 0)}
      aria-valuenow={exercises.reduce((sum, item) => sum + item.done, 0)}
      aria-label="Progreso de la sesión"
    >
      {exercises.map((item, index) => {
        const ratio =
          item.total > 0 ? Math.min(1, item.done / item.total) : 0;
        const isActive = index === activeIndex;
        const isDone = item.done >= item.total && item.total > 0;
        const isPartial = item.done > 0 && !isDone;

        return (
          <div
            key={index}
            className={cn(
              "relative h-[5px] flex-1 overflow-hidden rounded-full bg-text-primary/[0.08]",
              isActive && "ring-1 ring-text-primary/25",
            )}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-[var(--traza-duration-normal)]",
                isDone
                  ? "bg-primary"
                  : isPartial
                    ? "bg-text-primary/55"
                    : isActive
                      ? "bg-text-primary/30"
                      : "bg-transparent",
              )}
              style={{ width: `${Math.max(isActive && ratio === 0 ? 8 : 0, ratio * 100)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
