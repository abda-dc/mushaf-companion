import type { HifzProgress } from "./hifz-state.mjs";
import type { StudyNotesState } from "./study-notes.mjs";
import type { VocabularyProgress } from "./vocabulary-state.mjs";
import type { TodayStudyProgress } from "./today-study.mjs";
import type { EducationProgress } from "./education-state.mjs";
import type { ReciterId } from "./quran-data";

export type ThemePreference = "light" | "dark";
export type PageScalePreference = "compact" | "comfortable" | "large";
export type ReadingFontPreference = "uthman-taha" | "amiri" | "lateef" | "scheherazade";

export interface MushafPreferences {
  version: 8;
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
  vocabulary: VocabularyProgress;
  study: TodayStudyProgress;
  education: EducationProgress;
  notes: StudyNotesState;
  downloads: { wifiOnly: boolean };
}

export const PREFERENCE_STORAGE_KEY: "mushaf:preferences-v8";
export const PREFERENCE_SCHEMA_VERSION: 8;
export const MAX_PREFERENCE_DOCUMENT_CHARACTERS: 4000000;
export const DEFAULT_PREFERENCES: Readonly<MushafPreferences>;
export function normalizePreferences(value: unknown): MushafPreferences;
export function migrateLegacyPreferences(storage: Pick<Storage, "getItem">): MushafPreferences;
export function loadPreferences(storage: Pick<Storage, "getItem" | "setItem">): MushafPreferences;
export function savePreferences(storage: Pick<Storage, "setItem">, value: unknown): MushafPreferences;
export function createPortableBackup(value: unknown, exportedAt?: string): string;
export function restorePortableBackup(raw: string | unknown): MushafPreferences;
