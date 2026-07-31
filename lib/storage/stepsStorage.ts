import { StepsRepository } from "@/features/steps/StepsRepository";
import { StepsService } from "@/features/steps/StepsService";
import type { StepsEntry } from "@/features/steps/StepsTypes";

/**
 * Legacy storage façade — prefer StepsService / StepsRepository.
 */
export type StepEntry = StepsEntry;

export const stepsStorage = {
  getAll(): StepsEntry[] {
    return StepsRepository.getAll();
  },

  getByDate(entryDate: string): StepsEntry | null {
    return StepsRepository.getByDate(entryDate).at(-1) ?? null;
  },

  getLatest(): StepsEntry | null {
    return StepsRepository.getLatest();
  },

  upsert(input: { entryDate: string; steps: number }): StepsEntry {
    return StepsService.create({
      entryDate: input.entryDate,
      entryTime: "12:00",
      steps: input.steps,
    });
  },

  remove(id: string): void {
    StepsRepository.remove(id);
  },

  clear(): void {
    StepsRepository.clear();
  },
};
