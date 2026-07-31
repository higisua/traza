"use client";

import { useSyncExternalStore } from "react";

type SubscribableRepository<T> = {
  getAll: () => T[];
  subscribe: (listener: () => void) => () => void;
  refresh: () => void;
};

export function useRepositoryEntries<T>(
  repository: SubscribableRepository<T>,
  storageKeyFragment: string,
  empty: T[],
): T[] {
  return useSyncExternalStore(
    (onStoreChange) => {
      const unsubscribe = repository.subscribe(onStoreChange);
      const onStorage = (event: StorageEvent) => {
        if (event.key && event.key.includes(storageKeyFragment)) {
          repository.refresh();
        }
      };
      if (typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      return () => {
        unsubscribe();
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    () => repository.getAll(),
    () => empty,
  );
}
