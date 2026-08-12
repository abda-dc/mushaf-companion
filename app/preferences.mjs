import { DEFAULT_HIFZ_PROGRESS, normalizeHifzProgress } from "./hifz-state.mjs";
import { DEFAULT_STUDY_NOTES, normalizeStudyNotes } from "./study-notes.mjs";
import { DEFAULT_VOCABULARY_PROGRESS, normalizeVocabularyProgress } from "./vocabulary-state.mjs";
import { DEFAULT_TODAY_STUDY_PROGRESS, normalizeTodayStudyProgress } from "./today-study.mjs";
import { DEFAULT_RECITER_ID, RECITER_IDS } from "./reciter-registry.mjs";

export const PREFERENCE_STORAGE_KEY = "mushaf:preferences-v7";
export const PREFERENCE_SCHEMA_VERSION = 7;
const PREVIOUS_PREFERENCE_STORAGE_KEYS = ["mushaf:preferences-v6", "mushaf:preferences-v5", "mushaf:preferences-v4", "mushaf:preferences-v3", "mushaf:preferences-v2"];

const PAGE_SCALES = new Set(["compact", "comfortable", "large"]);
const READING_FONTS = new Set(["uthman-taha", "amiri", "lateef", "scheherazade"]);
const SPEEDS = new Set([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;
const MAX_PREFERENCE_JSON_LENGTH = 5_000_000;
const PORTABLE_BACKUP_KIND = "mushaf-companion-backup";
const SUPPORTED_PORTABLE_BACKUP_VERSIONS = new Set([2, 3, 4, 5, 6, 7]);
const ISO_INSTANT = /^[1-9]\d{3}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;

export const DEFAULT_PREFERENCES = Object.freeze({
  version: PREFERENCE_SCHEMA_VERSION,
  reader: {
    lastPage: 1,
    lastVerse: "1:1",
    lastVersePage: 1,
    recentPages: [1],
    theme: "light",
    tajweed: true,
    transliteration: false,
    translation: false,
    reciter: "alafasy",
    speed: 1,
    pageScale: "comfortable",
    readingFont: "uthman-taha",
  },
  bookmarks: [],
  hifz: DEFAULT_HIFZ_PROGRESS,
  vocabulary: DEFAULT_VOCABULARY_PROGRESS,
  study: DEFAULT_TODAY_STUDY_PROGRESS,
  notes: DEFAULT_STUDY_NOTES,
  downloads: { wifiOnly: true },
});

function parseJson(value, fallback = null) {
  if (typeof value === "string" && value.length > MAX_PREFERENCE_JSON_LENGTH) return fallback;
  try {
    return JSON.parse(value ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeBookmarks(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.slice(0, 10_000).filter((item) => typeof item === "string" && /^\d{1,3}\|\d{1,3}:\d{1,3}$/.test(item)))].slice(0, 5000);
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isValidPortableInstant(value) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function normalizeRecentPages(value, lastPage) {
  const pages = Array.isArray(value) ? value : [];
  return [...new Set([lastPage, ...pages].filter((page) => Number.isInteger(page) && page >= 1 && page <= 604))].slice(0, 6);
}

export function normalizePreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  const reader = source.reader && typeof source.reader === "object" ? source.reader : {};
  const lastPage = Number.isInteger(reader.lastPage) && reader.lastPage >= 1 && reader.lastPage <= 604 ? reader.lastPage : 1;
  const lastVerse = typeof reader.lastVerse === "string" && VERSE_KEY.test(reader.lastVerse) ? reader.lastVerse : "1:1";
  const lastVersePage = Number.isInteger(reader.lastVersePage) && reader.lastVersePage >= 1 && reader.lastVersePage <= 604 ? reader.lastVersePage : lastPage;
  return {
    version: PREFERENCE_SCHEMA_VERSION,
    reader: {
      lastPage,
      lastVerse,
      lastVersePage,
      recentPages: normalizeRecentPages(reader.recentPages, lastPage),
      theme: reader.theme === "dark" ? "dark" : "light",
      tajweed: reader.tajweed !== false,
      transliteration: reader.transliteration === true,
      translation: reader.translation === true,
      reciter: RECITER_IDS.has(reader.reciter) ? reader.reciter : DEFAULT_RECITER_ID,
      speed: SPEEDS.has(Number(reader.speed)) ? Number(reader.speed) : 1,
      pageScale: PAGE_SCALES.has(reader.pageScale) ? reader.pageScale : "comfortable",
      readingFont: READING_FONTS.has(reader.readingFont) ? reader.readingFont : "uthman-taha",
    },
    bookmarks: normalizeBookmarks(source.bookmarks),
    hifz: normalizeHifzProgress(source.hifz),
    vocabulary: normalizeVocabularyProgress(source.vocabulary),
    study: normalizeTodayStudyProgress(source.study),
    notes: normalizeStudyNotes(source.notes),
    downloads: { wifiOnly: source.downloads?.wifiOnly !== false },
  };
}

export function migrateLegacyPreferences(storage) {
  const lastPage = Number(storage.getItem("mushaf:last-page") ?? "1");
  const lastVersePage = Number(storage.getItem("mushaf:last-verse-page") ?? String(lastPage));
  return normalizePreferences({
    reader: {
      lastPage,
      lastVerse: storage.getItem("mushaf:last-verse") ?? "1:1",
      lastVersePage,
      theme: storage.getItem("mushaf:theme") === "dark" ? "dark" : "light",
      tajweed: storage.getItem("mushaf:tajweed") !== "false",
      transliteration: storage.getItem("mushaf:transliteration") === "true",
      translation: storage.getItem("mushaf:translation") === "true",
      reciter: RECITER_IDS.has(storage.getItem("mushaf:reciter")) ? storage.getItem("mushaf:reciter") : DEFAULT_RECITER_ID,
      speed: Number(storage.getItem("mushaf:speed") ?? "1"),
      pageScale: storage.getItem("mushaf:page-scale") ?? "comfortable",
      readingFont: storage.getItem("mushaf:reading-font") ?? "uthman-taha",
    },
    bookmarks: parseJson(storage.getItem("mushaf:bookmarks-v2"), []),
    hifz: parseJson(storage.getItem("mushaf:hifz-v1"), DEFAULT_HIFZ_PROGRESS),
  });
}

export function loadPreferences(storage) {
  const current = parseJson(storage.getItem(PREFERENCE_STORAGE_KEY));
  const previous = PREVIOUS_PREFERENCE_STORAGE_KEYS.map((key) => parseJson(storage.getItem(key))).find(Boolean);
  const preferences = current ? normalizePreferences(current) : previous ? normalizePreferences(previous) : migrateLegacyPreferences(storage);
  if (!current) storage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  return preferences;
}

export function savePreferences(storage, value) {
  const preferences = normalizePreferences(value);
  storage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  return preferences;
}

export function createPortableBackup(value, exportedAt = new Date().toISOString()) {
  if (!isValidPortableInstant(exportedAt)) throw new Error("The backup export timestamp is invalid.");
  return JSON.stringify({
    kind: PORTABLE_BACKUP_KIND,
    schemaVersion: PREFERENCE_SCHEMA_VERSION,
    exportedAt,
    preferences: normalizePreferences(value),
  }, null, 2);
}

export function restorePortableBackup(raw) {
  const parsed = typeof raw === "string" ? parseJson(raw) : raw;
  if (!isPlainRecord(parsed) || parsed.kind !== PORTABLE_BACKUP_KIND || !isPlainRecord(parsed.preferences)) {
    throw new Error("This is not a Mushaf Companion backup.");
  }
  if (!Number.isInteger(parsed.schemaVersion) || !SUPPORTED_PORTABLE_BACKUP_VERSIONS.has(parsed.schemaVersion)) {
    if (Number.isInteger(parsed.schemaVersion) && parsed.schemaVersion > PREFERENCE_SCHEMA_VERSION) throw new Error(`Backup schema v${parsed.schemaVersion} is newer than this app supports.`);
    throw new Error("The backup schema version is missing or unsupported.");
  }
  if (parsed.exportedAt !== undefined && !isValidPortableInstant(parsed.exportedAt)) throw new Error("The backup export timestamp is invalid.");
  // Every known portable schema migrates section-by-section through the current bounded normalizers.
  return normalizePreferences(parsed.preferences);
}
