import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type StepEntry = {
  id: string;
  entryDate: string;
  steps: number;
  createdAt: string;
  updatedAt: string;
};

const KEY = storageKey("step_entries");

function readAll(): StepEntry[] {
  return readJson<StepEntry[]>(KEY, []);
}

function writeAll(entries: StepEntry[]): void {
  writeJson(KEY, entries);
}

export const stepsStorage = {
  getAll(): StepEntry[] {
    return readAll().sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  },

  getByDate(entryDate: string): StepEntry | null {
    return readAll().find((entry) => entry.entryDate === entryDate) ?? null;
  },

  getLatest(): StepEntry | null {
    return this.getAll()[0] ?? null;
  },

  upsert(input: { entryDate: string; steps: number }): StepEntry {
    const now = new Date().toISOString();
    const existing = this.getByDate(input.entryDate);

    if (existing) {
      const updated: StepEntry = {
        ...existing,
        steps: input.steps,
        updatedAt: now,
      };
      writeAll(readAll().map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const created: StepEntry = {
      id: createId(),
      entryDate: input.entryDate,
      steps: input.steps,
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
