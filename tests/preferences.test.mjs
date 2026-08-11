import assert from "node:assert/strict";
import test from "node:test";
import {
  PREFERENCE_STORAGE_KEY,
  createPortableBackup,
  loadPreferences,
  restorePortableBackup,
  savePreferences,
} from "../app/preferences.mjs";
import { createStudyNote } from "../app/study-notes.mjs";
import { recordVocabularyReview } from "../app/vocabulary-state.mjs";
import { buildTodayStudyPlan, startOrResumeTodayStudy } from "../app/today-study.mjs";

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); },
    values,
  };
}

test("migrates fragmented legacy keys into one versioned preference record", () => {
  const storage = memoryStorage({
    "mushaf:last-page": "42",
    "mushaf:last-verse": "2:255",
    "mushaf:last-verse-page": "42",
    "mushaf:theme": "dark",
    "mushaf:translation": "true",
    "mushaf:bookmarks-v2": '["42|2:255"]',
    "mushaf:hifz-v1": '{"memorized":[{"verseKey":"2:255","page":42,"markedAt":"2026-08-06"}],"activityDates":["2026-08-06"],"dailyGoal":7}',
  });
  const preferences = loadPreferences(storage);
  assert.equal(preferences.version, 7);
  assert.equal(preferences.reader.lastPage, 42);
  assert.deepEqual(preferences.reader.recentPages, [42]);
  assert.equal(preferences.reader.translation, true);
  assert.deepEqual(preferences.bookmarks, ["42|2:255"]);
  assert.equal(preferences.hifz.memorized[0].verseKey, "2:255");
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.equal(preferences.vocabulary.curriculumId, "foundation-125");
  assert.equal(preferences.study.schemaVersion, 1);
  assert.deepEqual(preferences.notes.notes, []);
  assert.ok(storage.values.has(PREFERENCE_STORAGE_KEY));
});

test("migrates older preference documents into navigation history, vocabulary, and download settings", () => {
  const storage = memoryStorage({
    "mushaf:preferences-v4": JSON.stringify({ version: 4, reader: { lastPage: 18, lastVerse: "2:142", lastVersePage: 22 }, bookmarks: ["22|2:142"] }),
  });
  const preferences = loadPreferences(storage);
  assert.equal(preferences.version, 7);
  assert.equal(preferences.reader.lastPage, 18);
  assert.deepEqual(preferences.reader.recentPages, [18]);
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.equal(preferences.vocabulary.entries.length, 0);
  assert.equal(preferences.study.activeSession, null);
  assert.ok(storage.values.has("mushaf:preferences-v7"));
});

test("migrates a realistic v6 document without losing M1–M6 state", () => {
  const vocabulary = recordVocabularyReview(undefined, { id: "foundation-125", sourceRevision: "fixture-r1" }, "entry:1", "good", "2026-08-06");
  const plan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: { page: 42, verseKey: "2:255" }, sessionMinutes: 5, date: "2026-08-06" });
  const study = startOrResumeTodayStudy(undefined, plan, "2026-08-06T12:00:00.000Z");
  const storage = memoryStorage({
    "mushaf:preferences-v6": JSON.stringify({
      version: 6,
      reader: { lastPage: 42, lastVerse: "2:255", lastVersePage: 42, recentPages: [42, 41], theme: "dark", tajweed: false, transliteration: true, translation: true, reciter: "abdulbasit", speed: 1.25, pageScale: "large", readingFont: "amiri" },
      bookmarks: ["42|2:255"],
      hifz: { schemaVersion: 1, memorized: [{ verseKey: "2:255", page: 42, markedAt: "2026-08-06" }], reviews: [], activityDates: ["2026-08-06"], dailyGoal: 3, sessionMinutes: 5 },
      vocabulary,
      study,
      downloads: { wifiOnly: false },
    }),
  });
  const migrated = loadPreferences(storage);
  assert.equal(migrated.version, 7);
  assert.equal(migrated.reader.reciter, "abdulbasit");
  assert.equal(migrated.reader.speed, 1.25);
  assert.deepEqual(migrated.bookmarks, ["42|2:255"]);
  assert.equal(migrated.hifz.memorized[0].verseKey, "2:255");
  assert.equal(migrated.vocabulary.entries[0].entryId, "entry:1");
  assert.equal(migrated.study.activeSession.steps[0].kind, "reading");
  assert.equal(migrated.downloads.wifiOnly, false);
  assert.deepEqual(migrated.notes.notes, []);
});

test("keeps six unique, valid recent pages with the last page first", () => {
  const storage = memoryStorage();
  const saved = savePreferences(storage, { reader: { lastPage: 42, recentPages: [1, 42, 604, 22, 42, 0, 605, 82, 102, 121] } });
  assert.deepEqual(saved.reader.recentPages, [42, 1, 604, 22, 82, 102]);
});

test("portable backups normalize restored progress and reader settings", () => {
  const storage = memoryStorage();
  const vocabulary = recordVocabularyReview(undefined, { id: "foundation-125", sourceRevision: "fixture-r1" }, "entry:1", "good", "2026-08-06");
  const studyPlan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: { page: 604, verseKey: "114:6" }, sessionMinutes: 5, date: "2026-08-06" });
  const study = startOrResumeTodayStudy(undefined, studyPlan, "2026-08-06T12:00:00.000Z");
  const notes = createStudyNote(undefined, { anchor: { type: "ayah", verseKey: "114:6", page: 604 }, body: "Private reflection", tags: ["Review", "دعاء"] }, { now: "2026-08-06T11:00:00.000Z", uuid: "00000000-0000-4000-8000-000000000009" }).state;
  const saved = savePreferences(storage, { reader: { lastPage: 604, lastVerse: "114:6", lastVersePage: 604, recentPages: [604, 582, 562], theme: "dark", translation: true }, bookmarks: ["604|114:6"], vocabulary, study, notes });
  const backup = createPortableBackup(saved, "2026-08-06T12:00:00.000Z");
  const restored = restorePortableBackup(backup);
  assert.equal(restored.reader.lastPage, 604);
  assert.equal(restored.reader.lastVerse, "114:6");
  assert.equal(restored.reader.translation, true);
  assert.deepEqual(restored.reader.recentPages, [604, 582, 562]);
  assert.equal(restored.downloads.wifiOnly, true);
  assert.deepEqual(restored.bookmarks, ["604|114:6"]);
  assert.equal(restored.vocabulary.entries[0].entryId, "entry:1");
  assert.equal(restored.vocabulary.entries[0].dueAt, "2026-08-09");
  assert.equal(restored.study.activeSession.steps[0].kind, "reading");
  assert.equal(restored.study.activeSession.startedAt, "2026-08-06T12:00:00.000Z");
  assert.equal(restored.notes.notes[0].body, "Private reflection");
  assert.deepEqual(restored.notes.notes[0].tags, ["Review", "دعاء"]);
  assert.throws(() => restorePortableBackup('{"kind":"unknown"}'));
});

test("a corrupt notes section fails independently without discarding other restored domains", () => {
  const restored = restorePortableBackup({ kind: "mushaf-companion-backup", schemaVersion: 7, preferences: { reader: { lastPage: 42, lastVerse: "2:255", lastVersePage: 42 }, bookmarks: ["42|2:255"], notes: { schemaVersion: 1, notes: [{ id: "__proto__", anchor: { type: "word" }, body: { unsafe: true }, tags: new Array(100_000).fill("x") }] } } });
  assert.equal(restored.reader.lastPage, 42);
  assert.deepEqual(restored.bookmarks, ["42|2:255"]);
  assert.deepEqual(restored.notes.notes, []);
});

test("portable backup envelope accepts supported migrations and rejects future or malformed envelopes", () => {
  const v6 = restorePortableBackup({
    kind: "mushaf-companion-backup",
    schemaVersion: 6,
    exportedAt: "2026-08-06T12:00:00.000Z",
    preferences: { version: 6, reader: { lastPage: 42, lastVerse: "2:255", lastVersePage: 42 }, bookmarks: ["42|2:255"] },
  });
  assert.equal(v6.version, 7);
  assert.equal(v6.reader.lastPage, 42);
  assert.deepEqual(v6.notes.notes, [], "an older portable backup without notes migrates deterministically");

  const v7 = restorePortableBackup({ kind: "mushaf-companion-backup", schemaVersion: 7, exportedAt: "2026-08-06T12:00:00.000Z", preferences: { reader: { lastPage: 1 } } });
  assert.equal(v7.version, 7);
  for (const future of [8, 999]) {
    assert.throws(() => restorePortableBackup({ kind: "mushaf-companion-backup", schemaVersion: future, preferences: {} }), /newer than this app supports/i);
  }
  assert.throws(() => restorePortableBackup({ kind: "mushaf-companion-backup", schemaVersion: 7, exportedAt: "2026-02-31T12:00:00.000Z", preferences: {} }), /timestamp/i);
  assert.throws(() => restorePortableBackup([]), /not a Mushaf Companion backup/i);
});

test("portable restore retains valid notes when an unrelated optional domain is corrupt", () => {
  const notes = createStudyNote(undefined, { anchor: { type: "ayah", verseKey: "2:255", page: 42 }, body: "Keep this private note", tags: [] }, { now: "2026-08-06T11:00:00.000Z", uuid: "00000000-0000-4000-8000-000000000010" }).state;
  const restored = restorePortableBackup({
    kind: "mushaf-companion-backup",
    schemaVersion: 7,
    preferences: { reader: { lastPage: 42 }, notes, vocabulary: { schemaVersion: {}, entries: "corrupt" } },
  });
  assert.equal(restored.notes.notes[0].body, "Keep this private note");
  assert.deepEqual(restored.vocabulary.entries, []);
});
