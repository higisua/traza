"use client";

import { useCallback, useState } from "react";
import { nowDateInputValue } from "@/lib/tracking/dateTime";
import type { CalendarDayNavIntent, DayPresence } from "./CalendarTypes";

type UseCalendarDaySelectionOptions = {
  /**
   * Legacy seam — kept for month hook compatibility.
   * Day summary lives on-screen; no full-day route in 2.1.
   */
  onNavigateIntent?: (intent: CalendarDayNavIntent) => void;
};

/**
 * Day selection for the temporal navigator.
 * Defaults to today so the summary answers "¿cómo estaba hoy?" immediately.
 */
export function useCalendarDaySelection(
  options: UseCalendarDaySelectionOptions = {},
) {
  const { onNavigateIntent } = options;
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    nowDateInputValue(),
  );

  const selectDay = useCallback(
    (date: string, presence: DayPresence) => {
      setSelectedDate(date);
      onNavigateIntent?.({ date, presence });
    },
    [onNavigateIntent],
  );

  const clearSelection = useCallback(() => {
    setSelectedDate(nowDateInputValue());
  }, []);

  return {
    selectedDate,
    selectDay,
    clearSelection,
  };
}
