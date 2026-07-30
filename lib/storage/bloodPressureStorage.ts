import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type BloodPressureEntry = {
  id: string;
  entryDate: string;
  entryTime: string | null;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  createdAt: string;
  updatedAt: string;
};

const KEY = storageKey("blood_pressure_entries");

function readAll(): BloodPressureEntry[] {
  return readJson<BloodPressureEntry[]>(KEY, []);
}

function writeAll(entries: BloodPressureEntry[]): void {
  writeJson(KEY, entries);
}

export const bloodPressureStorage = {
  getAll(): BloodPressureEntry[] {
    return readAll().sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  },

  getByDate(entryDate: string): BloodPressureEntry | null {
    return readAll().find((entry) => entry.entryDate === entryDate) ?? null;
  },

  getLatest(): BloodPressureEntry | null {
    return this.getAll()[0] ?? null;
  },

  upsert(input: {
    entryDate: string;
    entryTime?: string | null;
    systolic: number;
    diastolic: number;
    pulse?: number | null;
  }): BloodPressureEntry {
    const now = new Date().toISOString();
    const existing = this.getByDate(input.entryDate);

    if (existing) {
      const updated: BloodPressureEntry = {
        ...existing,
        entryTime: input.entryTime ?? existing.entryTime,
        systolic: input.systolic,
        diastolic: input.diastolic,
        pulse: input.pulse ?? existing.pulse,
        updatedAt: now,
      };
      writeAll(readAll().map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const created: BloodPressureEntry = {
      id: createId(),
      entryDate: input.entryDate,
      entryTime: input.entryTime ?? null,
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse ?? null,
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
