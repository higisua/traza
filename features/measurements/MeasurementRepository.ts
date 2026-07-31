import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { compareByOccurredAt } from "@/lib/tracking/dateTime";
import type { MeasurementEntry, MeasurementPhotos } from "./MeasurementTypes";

type LegacyRaw = Partial<MeasurementEntry> & {
  id: string;
  rightArmCm?: number | null;
  rightThighCm?: number | null;
};

function normalizePhotos(raw: unknown): MeasurementPhotos | null {
  if (!raw || typeof raw !== "object") return null;
  const photos = raw as MeasurementPhotos;
  const hasAny =
    photos.frontUri != null || photos.sideUri != null || photos.backUri != null;
  return hasAny ? photos : null;
}

function normalizeEntry(raw: LegacyRaw): MeasurementEntry | null {
  const waist =
    typeof raw.waistCm === "number" && Number.isFinite(raw.waistCm)
      ? raw.waistCm
      : null;
  const armCandidate =
    typeof raw.armCm === "number" && Number.isFinite(raw.armCm)
      ? raw.armCm
      : typeof raw.rightArmCm === "number" && Number.isFinite(raw.rightArmCm)
        ? raw.rightArmCm
        : null;
  const legCandidate =
    typeof raw.legCm === "number" && Number.isFinite(raw.legCm)
      ? raw.legCm
      : typeof raw.rightThighCm === "number" && Number.isFinite(raw.rightThighCm)
        ? raw.rightThighCm
        : null;

  if (
    typeof raw.entryDate !== "string" ||
    waist === null ||
    armCandidate === null ||
    legCandidate === null
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
    waistCm: waist,
    armCm: armCandidate,
    legCm: legCandidate,
    photos: normalizePhotos(raw.photos),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<MeasurementEntry>({
  storageKey: storageKey("body_measurements"),
  sort: compareByOccurredAt,
});

let didMigrate = false;

function migrateOnce() {
  if (didMigrate) return;
  didMigrate = true;

  const raw = base.getAll() as LegacyRaw[];
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry): entry is MeasurementEntry => entry !== null);

  const needsRewrite =
    normalized.length !== raw.length ||
    raw.some((source) => {
      const match = normalized.find((entry) => entry.id === source.id);
      if (!match) return true;
      return (
        source.entryTime !== match.entryTime ||
        source.occurredAt !== match.occurredAt ||
        source.armCm !== match.armCm ||
        source.legCm !== match.legCm
      );
    });

  if (needsRewrite) {
    base.replaceAll(normalized, { silent: true });
  }
}

export const MeasurementRepository = {
  getAll(): MeasurementEntry[] {
    migrateOnce();
    return base.getAll();
  },

  getById(id: string): MeasurementEntry | null {
    migrateOnce();
    return base.getById(id);
  },

  getLatest(): MeasurementEntry | null {
    return this.getAll()[0] ?? null;
  },

  getByDate(entryDate: string): MeasurementEntry[] {
    return this.getAll()
      .filter((entry) => entry.entryDate === entryDate)
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime));
  },

  create(
    entry: Omit<MeasurementEntry, "id"> & { id?: string },
  ): MeasurementEntry {
    migrateOnce();
    return base.create(entry);
  },

  update(
    id: string,
    patch: Partial<Omit<MeasurementEntry, "id">>,
  ): MeasurementEntry | null {
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
