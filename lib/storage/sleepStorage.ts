import { SleepRepository } from "@/features/sleep/SleepRepository";
import { SleepService } from "@/features/sleep/SleepService";
import type { SleepEntry } from "@/features/sleep/SleepTypes";

/**
 * Legacy storage façade — prefer SleepService / SleepRepository.
 */
export type { SleepEntry };

export const sleepStorage = {
  getAll(): SleepEntry[] {
    return SleepRepository.getAll();
  },

  getByDate(entryDate: string): SleepEntry | null {
    return SleepRepository.getByDate(entryDate).at(-1) ?? null;
  },

  getLatest(): SleepEntry | null {
    return SleepRepository.getLatest();
  },

  upsert(input: {
    entryDate: string;
    bedTime?: string | null;
    wakeTime?: string | null;
    durationMinutes: number;
    score?: number | null;
  }): SleepEntry {
    return SleepService.create({
      entryDate: input.entryDate,
      entryTime: "08:00",
      durationMinutes: input.durationMinutes,
      score: input.score ?? null,
      bedTime: input.bedTime ?? null,
      wakeTime: input.wakeTime ?? null,
    });
  },

  remove(id: string): void {
    SleepRepository.remove(id);
  },

  clear(): void {
    SleepRepository.clear();
  },
};
