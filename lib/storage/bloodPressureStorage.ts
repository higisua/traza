import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { BloodPressureService } from "@/features/blood-pressure/BloodPressureService";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";

/**
 * Legacy storage façade — prefer BloodPressureService / BloodPressureRepository.
 */
export type { BloodPressureEntry };

export const bloodPressureStorage = {
  getAll(): BloodPressureEntry[] {
    return BloodPressureRepository.getAll();
  },

  getByDate(entryDate: string): BloodPressureEntry | null {
    return BloodPressureRepository.getByDate(entryDate).at(-1) ?? null;
  },

  getLatest(): BloodPressureEntry | null {
    return BloodPressureRepository.getLatest();
  },

  upsert(input: {
    entryDate: string;
    entryTime?: string | null;
    systolic: number;
    diastolic: number;
    pulse?: number | null;
  }): BloodPressureEntry {
    return BloodPressureService.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime ?? "12:00",
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse ?? 60,
    });
  },

  remove(id: string): void {
    BloodPressureRepository.remove(id);
  },

  clear(): void {
    BloodPressureRepository.clear();
  },
};
