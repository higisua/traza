import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type MeasurementEntry = {
  id: string;
  entryDate: string;
  waistCm: number | null;
  rightArmCm: number | null;
  rightThighCm: number | null;
  createdAt: string;
  updatedAt: string;
};

const KEY = storageKey("body_measurements");

function readAll(): MeasurementEntry[] {
  return readJson<MeasurementEntry[]>(KEY, []);
}

function writeAll(entries: MeasurementEntry[]): void {
  writeJson(KEY, entries);
}

export const measurementsStorage = {
  getAll(): MeasurementEntry[] {
    return readAll().sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  },

  getByDate(entryDate: string): MeasurementEntry | null {
    return readAll().find((entry) => entry.entryDate === entryDate) ?? null;
  },

  getLatest(): MeasurementEntry | null {
    return this.getAll()[0] ?? null;
  },

  upsert(input: {
    entryDate: string;
    waistCm?: number | null;
    rightArmCm?: number | null;
    rightThighCm?: number | null;
  }): MeasurementEntry {
    const now = new Date().toISOString();
    const existing = this.getByDate(input.entryDate);

    if (existing) {
      const updated: MeasurementEntry = {
        ...existing,
        waistCm: input.waistCm ?? existing.waistCm,
        rightArmCm: input.rightArmCm ?? existing.rightArmCm,
        rightThighCm: input.rightThighCm ?? existing.rightThighCm,
        updatedAt: now,
      };
      writeAll(readAll().map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const created: MeasurementEntry = {
      id: createId(),
      entryDate: input.entryDate,
      waistCm: input.waistCm ?? null,
      rightArmCm: input.rightArmCm ?? null,
      rightThighCm: input.rightThighCm ?? null,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([...readAll(), created]);
    return created;
  },

  remove(id: string): void {
    writeAll(readAll().filter((entry) => entry.id !== id));
  },

  clear(): void {
    writeAll([]);
  },
};
