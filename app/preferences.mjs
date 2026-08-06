import { DEFAULT_HIFZ_PROGRESS, normalizeHifzProgress } from "./hifz-state.mjs";

export const PREFERENCE_STORAGE_KEY = "mushaf:preferences-v2";
export const PREFERENCE_SCHEMA_VERSION = 2;

const RECITERS = new Set(["alafasy", "abdulbasit", "saad", "aymen", "minshawi-kids", "abdul-rashid-sufi"]);
const PAGE_SCALES = new Set(["compact", "comfortable", "large"]);
const READING_FONTS = new Set(["uthman-taha", "amiri", "lateef", "scheherazade"]);
const SPEEDS = new Set([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;

export const DEFAULT_PREFERENCES = Object.freeze({
  version: PREFERENCE_SCHEMA_VERSION,
  reader: {
    lastPage: 1,
    lastVerse: "1:1",
    lastVersePage: 1,
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
});

function parseJson(value, fallback = null) {
  try {
    return JSON.parse(value ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeBookmarks(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item) => typeof item === "string" && /^\d{1,3}\|\d{1,3}:\d{1,3}$/.test(item)))].slice(0, 5000);
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
      theme: reader.theme === "dark" ? "dark" : "light",
      tajweed: reader.tajweed !== false,
      transliteration: reader.transliteration === true,
      translation: reader.translation === true,
      reciter: RECITERS.has(reader.reciter) ? reader.reciter : "alafasy",
      speed: SPEEDS.has(Number(reader.speed)) ? Number(reader.speed) : 1,
      pageScale: PAGE_SCALES.has(reader.pageScale) ? reader.pageScale : "comfortable",
      readingFont: READING_FONTS.has(reader.readingFont) ? reader.readingFont : "uthman-taha",
    },
    bookmarks: normalizeBookmarks(source.bookmarks),
    hifz: normalizeHifzProgress(source.hifz),
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
      reciter: storage.getItem("mushaf:reciter") ?? "alafasy",
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
  const preferences = current ? normalizePreferences(current) : migrateLegacyPreferences(storage);
  if (!current) storage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  return preferences;
}

export function savePreferences(storage, value) {
  const preferences = normalizePreferences(value);
  storage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(preferences));
  return preferences;
}

export function createPortableBackup(value, exportedAt = new Date().toISOString()) {
  return JSON.stringify({
    kind: "mushaf-companion-backup",
    schemaVersion: PREFERENCE_SCHEMA_VERSION,
    exportedAt,
    preferences: normalizePreferences(value),
  }, null, 2);
}

export function restorePortableBackup(raw) {
  const parsed = typeof raw === "string" ? parseJson(raw) : raw;
  if (!parsed || parsed.kind !== "mushaf-companion-backup" || !parsed.preferences) {
    throw new Error("This is not a Mushaf Companion backup.");
  }
  return normalizePreferences(parsed.preferences);
}

