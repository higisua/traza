import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { compareByOccurredAt } from "@/lib/tracking/dateTime";
import type { SleepEntry } from "./SleepTypes";

function normalizeEntry(
  raw: Partial<SleepEntry> & { id: string },
): SleepEntry | null {
  if (
    typeof raw.entryDate !== "string" ||
    typeof raw.durationMinutes !== "number" ||
    !Number.isFinite(raw.durationMinutes)
  ) {
    return null;
  }

  const entryTime =
    typeof raw.entryTime === "string" && /^\d{2}:\d{2}$/.test(raw.entryTime)
      ? raw.entryTime
      : "08:00";

  const occurredAt =
    typeof raw.occurredAt === "string" && raw.occurredAt.length > 0
      ? raw.occurredAt
      : `${raw.entryDate}T${entryTime}:00`;

  const now = new Date().toISOString();

  return {
    id: raw.id,
    entryDate: raw.entryDate,
    entryTime,
    occurredAt,
    durationMinutes: raw.durationMinutes,
    score:
      typeof raw.score === "number" && Number.isFinite(raw.score)
        ? raw.score
        : null,
    bedTime:
      typeof raw.bedTime === "string" && /^\d{2}:\d{2}$/.test(raw.bedTime)
        ? raw.bedTime
        : null,
    wakeTime:
      typeof raw.wakeTime === "string" && /^\d{2}:\d{2}$/.test(raw.wakeTime)
        ? raw.wakeTime
        : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<SleepEntry>({
  storageKey: storageKey("sleep_entries"),
  sort: compareByOccurredAt,
});

let didMigrate = false;

function migrateOnce() {
  if (didMigrate) return;
  didMigrate = true;

  const raw = base.getAll() as Array<Partial<SleepEntry> & { id: string }>;
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry): entry is SleepEntry => entry !== null);

  const needsRewrite =
    normalized.length !== raw.length ||
    raw.some((source) => {
      const match = normalized.find((entry) => entry.id === source.id);
      if (!match) return true;
      return (
        source.entryTime !== match.entryTime ||
        source.occurredAt !== match.occurredAt
      );
    });

  if (needsRewrite) {
    base.replaceAll(normalized, { silent: true });
  }
}

export const SleepRepository = {
  getAll(): SleepEntry[] {
    migrateOnce();
    return base.getAll();
  },

  getById(id: string): SleepEntry | null {
    migrateOnce();
    return base.getById(id);
  },

  getLatest(): SleepEntry | null {
    return this.getAll()[0] ?? null;
  },

  getByDate(entryDate: string): SleepEntry[] {
    return this.getAll()
      .filter((entry) => entry.entryDate === entryDate)
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime));
  },

  create(entry: Omit<SleepEntry, "id"> & { id?: string }): SleepEntry {
    migrateOnce();
    return base.create(entry);
  },

  update(
    id: string,
    patch: Partial<Omit<SleepEntry, "id">>,
  ): SleepEntry | null {
    migrateOnce();
    return base.update(id, patch);
  },

  remove(id: string): boolean {
    migrateOnce();
    return base.remove(id);
  },

  clear(): void {
    migrateOnce();
    base.clear();
  },

  subscribe(listener: () => void): () => void {
    return base.subscribe(listener);
  },

  refresh(): void {
    didMigrate = false;
    base.refresh();
  },
};
