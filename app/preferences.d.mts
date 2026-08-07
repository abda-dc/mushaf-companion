import type { HifzProgress } from "./hifz-state.mjs";
import type { ReciterId } from "./quran-data";

export type ThemePreference = "light" | "dark";
export type PageScalePreference = "compact" | "comfortable" | "large";
export type ReadingFontPreference = "uthman-taha" | "amiri" | "lateef" | "scheherazade";

export interface MushafPreferences {
  version: 4;
  reader: {
    lastPage: number;
    lastVerse: string;
    lastVersePage: number;
    recentPages: number[];
    theme: ThemePreference;
    tajweed: boolean;
    transliteration: boolean;
    translation: boolean;
    reciter: ReciterId;
    speed: number;
    pageScale: PageScalePreference;
    readingFont: ReadingFontPreference;
  };
  bookmarks: string[];
  hifz: HifzProgress;
  downloads: { wifiOnly: boolean };
}

export const PREFERENCE_STORAGE_KEY: "mushaf:preferences-v4";
export const PREFERENCE_SCHEMA_VERSION: 4;
export const DEFAULT_PREFERENCES: Readonly<MushafPreferences>;
export function normalizePreferences(value: unknown): MushafPreferences;
export function migrateLegacyPreferences(storage: Pick<Storage, "getItem">): MushafPreferences;
export function loadPreferences(storage: Pick<Storage, "getItem" | "setItem">): MushafPreferences;
export function savePreferences(storage: Pick<Storage, "setItem">, value: unknown): MushafPreferences;
export function createPortableBackup(value: unknown, exportedAt?: string): string;
export function restorePortableBackup(raw: string | unknown): MushafPreferences;
