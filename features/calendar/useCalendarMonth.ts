"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { nowDateInputValue } from "@/lib/tracking/dateTime";
import { monthHasAnyPresence } from "./aggregateMonthPresence";
import { buildMonthGrid, monthPrefix } from "./buildMonthGrid";
import { useCalendarDaySelection } from "./useCalendarDaySelection";
import { useCalendarPresence } from "./useCalendarPresence";
import type { CalendarDayNavIntent } from "./CalendarTypes";

function formatMonthLabel(month: Date): string {
  const raw = format(month, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

type UseCalendarMonthOptions = {
  onNavigateIntent?: (intent: CalendarDayNavIntent) => void;
};

export function useCalendarMonth(options: UseCalendarMonthOptions = {}) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const presenceByDate = useCalendarPresence();
  const { selectedDate, selectDay, clearSelection } = useCalendarDaySelection({
    onNavigateIntent: options.onNavigateIntent,
  });

  const cells = useMemo(
    () => buildMonthGrid(visibleMonth, presenceByDate),
    [visibleMonth, presenceByDate],
  );

  const hasMonthData = useMemo(
    () => monthHasAnyPresence(presenceByDate, monthPrefix(visibleMonth)),
    [presenceByDate, visibleMonth],
  );

  const goToPrevMonth = useCallback(() => {
    setVisibleMonth((current) => startOfMonth(addMonths(current, -1)));
  }, []);

  const goToNextMonth = useCallback(() => {
    setVisibleMonth((current) => startOfMonth(addMonths(current, 1)));
  }, []);

  const goToToday = useCallback(() => {
    const today = startOfMonth(new Date());
    setVisibleMonth(today);
    const todayKey = nowDateInputValue();
    const presence = presenceByDate.get(todayKey) ?? {
      date: todayKey,
      modules: [],
    };
    selectDay(todayKey, presence);
  }, [presenceByDate, selectDay]);

  const onSelectCell = useCallback(
    (date: string, inCurrentMonth: boolean) => {
      if (!inCurrentMonth) {
        const [y, m] = date.split("-").map(Number);
        setVisibleMonth(startOfMonth(new Date(y, m - 1, 1)));
      }
      const presence = presenceByDate.get(date) ?? { date, modules: [] };
      selectDay(date, presence);
    },
    [presenceByDate, selectDay],
  );

  const isCurrentMonthVisible = isSameMonth(visibleMonth, new Date());

  return {
    visibleMonth,
    monthLabel: formatMonthLabel(visibleMonth),
    cells,
    hasMonthData,
    selectedDate,
    isCurrentMonthVisible,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    onSelectCell,
    clearSelection,
    presenceByDate,
  };
}
