import assert from "node:assert/strict";
import test from "node:test";
import {
  PREFERENCE_STORAGE_KEY,
  createPortableBackup,
  loadPreferences,
  restorePortableBackup,
  savePreferences,
} from "../app/preferences.mjs";

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
  assert.equal(preferences.version, 3);
  assert.equal(preferences.reader.lastPage, 42);
  assert.equal(preferences.reader.translation, true);
  assert.deepEqual(preferences.bookmarks, ["42|2:255"]);
  assert.equal(preferences.hifz.memorized[0].verseKey, "2:255");
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.ok(storage.values.has(PREFERENCE_STORAGE_KEY));
});

test("migrates the Phase One preference document into Phase Two download settings", () => {
  const storage = memoryStorage({
    "mushaf:preferences-v2": JSON.stringify({ version: 2, reader: { lastPage: 18, lastVerse: "2:142", lastVersePage: 22 }, bookmarks: ["22|2:142"] }),
  });
  const preferences = loadPreferences(storage);
  assert.equal(preferences.version, 3);
  assert.equal(preferences.reader.lastPage, 18);
  assert.equal(preferences.downloads.wifiOnly, true);
  assert.ok(storage.values.has("mushaf:preferences-v3"));
});

test("portable backups normalize restored progress and reader settings", () => {
  const storage = memoryStorage();
  const saved = savePreferences(storage, { reader: { lastPage: 604, lastVerse: "114:6", lastVersePage: 604, theme: "dark", translation: true }, bookmarks: ["604|114:6"] });
  const backup = createPortableBackup(saved, "2026-08-06T12:00:00.000Z");
  const restored = restorePortableBackup(backup);
  assert.equal(restored.reader.lastPage, 604);
  assert.equal(restored.reader.lastVerse, "114:6");
  assert.equal(restored.reader.translation, true);
  assert.equal(restored.downloads.wifiOnly, true);
  assert.deepEqual(restored.bookmarks, ["604|114:6"]);
  assert.throws(() => restorePortableBackup('{"kind":"unknown"}'));
});
