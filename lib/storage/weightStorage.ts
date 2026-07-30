import { WeightRepository } from "@/features/weight/WeightRepository";
import { WeightService } from "@/features/weight/WeightService";
import type { WeightEntry } from "@/features/weight/WeightTypes";

/**
 * Legacy storage façade — prefer WeightService / WeightRepository.
 * Kept so existing imports keep working during Phase 1.
 */
export type { WeightEntry };

export const weightStorage = {
  getAll(): WeightEntry[] {
    return WeightRepository.getAll();
  },

  getByDate(entryDate: string): WeightEntry | null {
    return WeightRepository.getByDate(entryDate).at(-1) ?? null;
  },

  getLatest(): WeightEntry | null {
    return WeightRepository.getLatest();
  },

  upsert(input: {
    entryDate: string;
    entryTime?: string | null;
    weightKg: number;
    bodyFatPct?: number | null;
  }): WeightEntry {
    return WeightService.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime ?? "12:00",
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct ?? null,
    });
  },

  remove(id: string): void {
    WeightRepository.remove(id);
  },

  clear(): void {
    WeightRepository.clear();
  },
};
