import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import type { WeightEntry } from "./WeightTypes";

function compareEntries(a: WeightEntry, b: WeightEntry): number {
  const byOccurred = b.occurredAt.localeCompare(a.occurredAt);
  if (byOccurred !== 0) return byOccurred;
  return b.updatedAt.localeCompare(a.updatedAt);
}

function normalizeEntry(raw: Partial<WeightEntry> & { id: string }): WeightEntry | null {
  if (
    typeof raw.entryDate !== "string" ||
    typeof raw.weightKg !== "number" ||
    !Number.isFinite(raw.weightKg)
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
    weightKg: raw.weightKg,
    bodyFatPct:
      typeof raw.bodyFatPct === "number" && Number.isFinite(raw.bodyFatPct)
        ? raw.bodyFatPct
        : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<WeightEntry>({
  storageKey: storageKey("weight_entries"),
  sort: compareEntries,
});

let didMigrate = false;

function migrateOnce() {
  if (didMigrate) return;
  didMigrate = true;

  const raw = base.getAll() as Array<Partial<WeightEntry> & { id: string }>;
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry): entry is WeightEntry => entry !== null);

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

export const WeightRepository = {
  getAll(): WeightEntry[] {
    migrateOnce();
    return base.getAll();
  },

  getById(id: string): WeightEntry | null {
    migrateOnce();
    return base.getById(id);
  },

  getLatest(): WeightEntry | null {
    return this.getAll()[0] ?? null;
  },

  /** Calendar helper — all entries for a YYYY-MM-DD day. */
  getByDate(entryDate: string): WeightEntry[] {
    return this.getAll()
      .filter((entry) => entry.entryDate === entryDate)
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime));
  },

  create(entry: Omit<WeightEntry, "id"> & { id?: string }): WeightEntry {
    migrateOnce();
    return base.create(entry);
  },

  update(id: string, patch: Partial<Omit<WeightEntry, "id">>): WeightEntry | null {
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
