import assert from "node:assert/strict";
import test from "node:test";
import {
  PREFERENCE_STORAGE_KEY,
  createPortableBackup,
  loadPreferences,
  restorePortableBackup,
  savePreferences,
} from "../app/preferences.mjs";
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
  assert.equal(preferences.version, 6);
  assert.equal(preferences.reader.lastPage, 42);
  assert.deepEqual(preferences.reader.recentPages, [42]);
  assert.equal(preferences.reader.translation, true);
  assert.deepEqual(preferences.bookmarks, ["42|2:255"]);
  assert.equal(preferences.hifz.memorized[0].verseKey, "2:255");
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.equal(preferences.vocabulary.curriculumId, "foundation-125");
  assert.equal(preferences.study.schemaVersion, 1);
  assert.ok(storage.values.has(PREFERENCE_STORAGE_KEY));
});

test("migrates older preference documents into navigation history, vocabulary, and download settings", () => {
  const storage = memoryStorage({
    "mushaf:preferences-v4": JSON.stringify({ version: 4, reader: { lastPage: 18, lastVerse: "2:142", lastVersePage: 22 }, bookmarks: ["22|2:142"] }),
  });
  const preferences = loadPreferences(storage);
  assert.equal(preferences.version, 6);
  assert.equal(preferences.reader.lastPage, 18);
  assert.deepEqual(preferences.reader.recentPages, [18]);
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.equal(preferences.vocabulary.entries.length, 0);
  assert.equal(preferences.study.activeSession, null);
  assert.ok(storage.values.has("mushaf:preferences-v6"));
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
  const saved = savePreferences(storage, { reader: { lastPage: 604, lastVerse: "114:6", lastVersePage: 604, recentPages: [604, 582, 562], theme: "dark", translation: true }, bookmarks: ["604|114:6"], vocabulary, study });
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
  assert.throws(() => restorePortableBackup('{"kind":"unknown"}'));
});
