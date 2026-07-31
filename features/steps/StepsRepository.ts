import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { compareByOccurredAt } from "@/lib/tracking/dateTime";
import type { StepsEntry } from "./StepsTypes";

function normalizeEntry(
  raw: Partial<StepsEntry> & { id: string },
): StepsEntry | null {
  if (
    typeof raw.entryDate !== "string" ||
    typeof raw.steps !== "number" ||
    !Number.isFinite(raw.steps)
  ) {
    return null;
  }

  const entryTime =
    typeof raw.entryTime === "string" && /^\d{2}:\d{2}$/.test(raw.entryTime)
      ? raw.entryTime
      : "12:00";

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
    steps: Math.max(0, Math.round(raw.steps)),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<StepsEntry>({
  storageKey: storageKey("step_entries"),
  sort: compareByOccurredAt,
});

let didMigrate = false;

function migrateOnce() {
  if (didMigrate) return;
  didMigrate = true;

  const raw = base.getAll() as Array<Partial<StepsEntry> & { id: string }>;
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry): entry is StepsEntry => entry !== null);

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

export const StepsRepository = {
  getAll(): StepsEntry[] {
    migrateOnce();
    return base.getAll();
  },

  getById(id: string): StepsEntry | null {
    migrateOnce();
    return base.getById(id);
  },

  getLatest(): StepsEntry | null {
    return this.getAll()[0] ?? null;
  },

  getByDate(entryDate: string): StepsEntry[] {
    return this.getAll()
      .filter((entry) => entry.entryDate === entryDate)
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime));
  },

  create(entry: Omit<StepsEntry, "id"> & { id?: string }): StepsEntry {
    migrateOnce();
    return base.create(entry);
  },

  update(
    id: string,
    patch: Partial<Omit<StepsEntry, "id">>,
  ): StepsEntry | null {
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
