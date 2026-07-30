import { createId, readJson, writeJson } from "@/lib/storage/localStorage";

export type LocalEntity = {
  id: string;
};

type CreateLocalRepositoryOptions<T extends LocalEntity> = {
  storageKey: string;
  sort?: (a: T, b: T) => number;
};

/**
 * Generic localStorage repository with in-process pub/sub.
 * Copy this pattern for Tensión, Sueño, Pasos, Medidas.
 */
export function createLocalRepository<T extends LocalEntity>({
  storageKey,
  sort,
}: CreateLocalRepositoryOptions<T>) {
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function readAll(): T[] {
    if (cache) {
      return cache;
    }
    const entries = readJson<T[]>(storageKey, []);
    cache = sort ? [...entries].sort(sort) : entries;
    return cache;
  }

  function writeAll(entries: T[], silent = false) {
    const next = sort ? [...entries].sort(sort) : entries;
    cache = next;
    writeJson(storageKey, next);
    if (!silent) {
      notify();
    }
  }

  function invalidate() {
    cache = null;
  }

  return {
    getAll(): T[] {
      return readAll();
    },

    getById(id: string): T | null {
      return readAll().find((entry) => entry.id === id) ?? null;
    },

    create(input: Omit<T, "id"> & { id?: string }): T {
      const entry = {
        ...input,
        id: input.id ?? createId(),
      } as T;
      writeAll([...readAll(), entry]);
      return entry;
    },

    update(id: string, patch: Partial<Omit<T, "id">>): T | null {
      const current = readAll();
      const index = current.findIndex((entry) => entry.id === id);
      if (index < 0) {
        return null;
      }
      const updated = { ...current[index], ...patch, id } as T;
      const next = [...current];
      next[index] = updated;
      writeAll(next);
      return updated;
    },

    remove(id: string): boolean {
      const current = readAll();
      const next = current.filter((entry) => entry.id !== id);
      if (next.length === current.length) {
        return false;
      }
      writeAll(next);
      return true;
    },

    clear(): void {
      writeAll([]);
    },

    replaceAll(entries: T[], options?: { silent?: boolean }): void {
      writeAll(entries, options?.silent);
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Force re-read from localStorage (e.g. external tab). */
    refresh(): void {
      invalidate();
      notify();
    },
  };
}

export type LocalRepository<T extends LocalEntity> = ReturnType<
  typeof createLocalRepository<T>
>;
