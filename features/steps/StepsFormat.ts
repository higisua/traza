import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { StepsDayProgress } from "./StepsTypes";
import { getDailyStepsGoal } from "./StepsGoal";

export function formatStepsCount(steps: number): string {
  return Math.round(steps).toLocaleString("es-ES");
}

export function buildDayProgress(
  entryDate: string,
  totalSteps: number,
  goal = getDailyStepsGoal(),
): StepsDayProgress {
  const safe = Math.max(0, Math.round(totalSteps));
  const remaining = Math.max(0, goal - safe);
  const progress = goal > 0 ? Math.min(1, safe / goal) : 0;

  return {
    entryDate,
    totalSteps: safe,
    goal,
    remaining,
    progress,
    goalReached: safe >= goal,
  };
}

export function formatChartDayLabel(entryDate: string): string {
  const date = parse(entryDate, "yyyy-MM-dd", new Date());
  if (Number.isNaN(date.getTime())) return entryDate;
  return format(date, "d MMM", { locale: es });
}
