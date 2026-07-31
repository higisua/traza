import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { compareByOccurredAt } from "@/lib/tracking/dateTime";
import type { BloodPressureEntry } from "./BloodPressureTypes";

function normalizeEntry(
  raw: Partial<BloodPressureEntry> & { id: string },
): BloodPressureEntry | null {
  if (
    typeof raw.entryDate !== "string" ||
    typeof raw.systolic !== "number" ||
    typeof raw.diastolic !== "number" ||
    !Number.isFinite(raw.systolic) ||
    !Number.isFinite(raw.diastolic)
  ) {
    return null;
  }

  const entryTime =
    typeof raw.entryTime === "string" && /^\d{2}:\d{2}$/.test(raw.entryTime)
      ? raw.entryTime
      : "12:00";

  const pulse =
    typeof raw.pulse === "number" && Number.isFinite(raw.pulse) ? raw.pulse : 0;

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
    systolic: raw.systolic,
    diastolic: raw.diastolic,
    pulse,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<BloodPressureEntry>({
  storageKey: storageKey("blood_pressure_entries"),
  sort: compareByOccurredAt,
});

let didMigrate = false;

function migrateOnce() {
  if (didMigrate) return;
  didMigrate = true;

  const raw = base.getAll() as Array<Partial<BloodPressureEntry> & { id: string }>;
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry): entry is BloodPressureEntry => entry !== null);

  const needsRewrite =
    normalized.length !== raw.length ||
    raw.some((source) => {
      const match = normalized.find((entry) => entry.id === source.id);
      if (!match) return true;
      return (
        source.entryTime !== match.entryTime ||
        source.occurredAt !== match.occurredAt ||
        source.pulse !== match.pulse
      );
    });

  if (needsRewrite) {
    base.replaceAll(normalized, { silent: true });
  }
}

export const BloodPressureRepository = {
  getAll(): BloodPressureEntry[] {
    migrateOnce();
    return base.getAll();
  },

  getById(id: string): BloodPressureEntry | null {
    migrateOnce();
    return base.getById(id);
  },

  getLatest(): BloodPressureEntry | null {
    return this.getAll()[0] ?? null;
  },

  getByDate(entryDate: string): BloodPressureEntry[] {
    return this.getAll()
      .filter((entry) => entry.entryDate === entryDate)
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime));
  },

  create(
    entry: Omit<BloodPressureEntry, "id"> & { id?: string },
  ): BloodPressureEntry {
    migrateOnce();
    return base.create(entry);
  },

  update(
    id: string,
    patch: Partial<Omit<BloodPressureEntry, "id">>,
  ): BloodPressureEntry | null {
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
