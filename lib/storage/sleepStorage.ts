import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type SleepEntry = {
  id: string;
  entryDate: string;
  bedTime: string | null;
  wakeTime: string | null;
  durationMinutes: number;
  score: number | null;
  createdAt: string;
  updatedAt: string;
};

const KEY = storageKey("sleep_entries");

function readAll(): SleepEntry[] {
  return readJson<SleepEntry[]>(KEY, []);
}

function writeAll(entries: SleepEntry[]): void {
  writeJson(KEY, entries);
}

export const sleepStorage = {
  getAll(): SleepEntry[] {
    return readAll().sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  },

  getByDate(entryDate: string): SleepEntry | null {
    return readAll().find((entry) => entry.entryDate === entryDate) ?? null;
  },

  getLatest(): SleepEntry | null {
    return this.getAll()[0] ?? null;
  },

  upsert(input: {
    entryDate: string;
    bedTime?: string | null;
    wakeTime?: string | null;
    durationMinutes: number;
    score?: number | null;
  }): SleepEntry {
    const now = new Date().toISOString();
    const existing = this.getByDate(input.entryDate);

    if (existing) {
      const updated: SleepEntry = {
        ...existing,
        bedTime: input.bedTime ?? existing.bedTime,
        wakeTime: input.wakeTime ?? existing.wakeTime,
        durationMinutes: input.durationMinutes,
        score: input.score ?? existing.score,
        updatedAt: now,
      };
      writeAll(readAll().map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const created: SleepEntry = {
      id: createId(),
      entryDate: input.entryDate,
      bedTime: input.bedTime ?? null,
      wakeTime: input.wakeTime ?? null,
      durationMinutes: input.durationMinutes,
      score: input.score ?? null,
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
