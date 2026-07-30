import { readJson, storageKey, writeJson } from "./localStorage";

export type AppSettings = {
  displayName: string;
  units: "metric";
  theme: "light";
};

const KEY = storageKey("settings");

const DEFAULT_SETTINGS: AppSettings = {
  displayName: "Higinio",
  units: "metric",
  theme: "light",
};

export const settingsStorage = {
  get(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(KEY, {}) };
  },

  update(patch: Partial<AppSettings>): AppSettings {
    const next = { ...this.get(), ...patch };
    writeJson(KEY, next);
    return next;
  },

  reset(): AppSettings {
    writeJson(KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};
