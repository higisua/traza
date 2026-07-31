"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useCalendarDaySummary,
  useCalendarMonth,
  type CalendarModuleOpenIntent,
} from "@/features/calendar";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/components/feedback/Toast";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";
import { MonthToolbar } from "./MonthToolbar";
import { MonthGrid } from "./MonthGrid";
import { DaySummaryPanel } from "./DaySummaryPanel";

/**
 * Phase 2.1 — Temporal navigator + day summary.
 * Calendar is a compact tool; the selected-day summary is the protagonist.
 * No full-day screen, no editing, no statistics.
 */
export function CalendarScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    monthLabel,
    cells,
    selectedDate,
    isCurrentMonthVisible,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    onSelectCell,
  } = useCalendarMonth();

  const { heading, blocks } = useCalendarDaySummary(selectedDate);

  const handleOpenModule = useCallback(
    (intent: CalendarModuleOpenIntent) => {
      // TODO(phase-later): open module for this date (no full-day screen).
      // Intent prepared with module + href; do not force navigation yet.
      void intent;
      showToast("El detalle por módulo llegará más adelante");
    },
    [showToast],
  );

  return (
    <motion.div
      className="relative -mx-5 flex min-h-[calc(100dvh-var(--traza-bottom-nav-height)-env(safe-area-inset-bottom))] min-w-0 flex-col pb-2 sm:-mx-6"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Soft TRAZA wash — same family as ModuleScreen / Home */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col px-5 pt-2 sm:px-6">
        <PageHeader
          title="Calendario"
          onBack={() => router.push("/home")}
          className="shrink-0"
        />

        {/* Zone 1 — temporal navigator (~10–15% more presence; still not protagonist) */}
        <div className="mt-2.5 min-w-0 shrink-0">
          <MonthToolbar
            monthLabel={monthLabel}
            isCurrentMonthVisible={isCurrentMonthVisible}
            onPrev={goToPrevMonth}
            onNext={goToNextMonth}
            onToday={goToToday}
          />

          <div className="mt-2.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={monthLabel}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{
                  duration: motionDuration.normal,
                  ease: motionEase.standard,
                }}
              >
                <MonthGrid
                  cells={cells}
                  selectedDate={selectedDate}
                  onSelectCell={onSelectCell}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Zone 2 — selected day summary (protagonist) */}
        <div className="mt-3.5 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/40 pt-3.5">
          {heading ? (
            <DaySummaryPanel
              date={selectedDate!}
              heading={heading}
              blocks={blocks}
              onOpenModule={handleOpenModule}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
