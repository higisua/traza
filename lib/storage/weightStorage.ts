import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type WeightEntry = {
  id: string;
  entryDate: string;
  entryTime: string | null;
  weightKg: number;
  bodyFatPct: number | null;
  createdAt: string;
  updatedAt: string;
};

const KEY = storageKey("weight_entries");

function readAll(): WeightEntry[] {
  return readJson<WeightEntry[]>(KEY, []);
}

function writeAll(entries: WeightEntry[]): void {
  writeJson(KEY, entries);
}

export const weightStorage = {
  getAll(): WeightEntry[] {
    return readAll().sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  },

  getByDate(entryDate: string): WeightEntry | null {
    return readAll().find((entry) => entry.entryDate === entryDate) ?? null;
  },

  getLatest(): WeightEntry | null {
    return this.getAll()[0] ?? null;
  },

  upsert(input: {
    entryDate: string;
    entryTime?: string | null;
    weightKg: number;
    bodyFatPct?: number | null;
  }): WeightEntry {
    const now = new Date().toISOString();
    const existing = this.getByDate(input.entryDate);

    if (existing) {
      const updated: WeightEntry = {
        ...existing,
        entryTime: input.entryTime ?? existing.entryTime,
        weightKg: input.weightKg,
        bodyFatPct: input.bodyFatPct ?? existing.bodyFatPct,
        updatedAt: now,
      };
      writeAll(readAll().map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const created: WeightEntry = {
      id: createId(),
      entryDate: input.entryDate,
      entryTime: input.entryTime ?? null,
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct ?? null,
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
