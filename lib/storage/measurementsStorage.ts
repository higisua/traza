import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";
import { MeasurementService } from "@/features/measurements/MeasurementService";
import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";

/**
 * Legacy storage façade — prefer MeasurementService / MeasurementRepository.
 */
export type { MeasurementEntry };

export const measurementsStorage = {
  getAll(): MeasurementEntry[] {
    return MeasurementRepository.getAll();
  },

  getByDate(entryDate: string): MeasurementEntry | null {
    return MeasurementRepository.getByDate(entryDate).at(-1) ?? null;
  },

  getLatest(): MeasurementEntry | null {
    return MeasurementRepository.getLatest();
  },

  upsert(input: {
    entryDate: string;
    entryTime?: string;
    waistCm: number;
    armCm: number;
    legCm: number;
  }): MeasurementEntry {
    return MeasurementService.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime ?? "12:00",
      waistCm: input.waistCm,
      armCm: input.armCm,
      legCm: input.legCm,
    });
  },

  remove(id: string): void {
    MeasurementRepository.remove(id);
  },

  clear(): void {
    MeasurementRepository.clear();
  },
};
