import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRAYER_PREFERENCES,
  PRAYER_PREFERENCE_SCHEMA_VERSION,
  PRAYER_PREFERENCE_STORAGE_KEY,
  forgetPrayerLocation,
  loadPrayerPreferences,
  normalizePrayerPreferences,
  rememberPrayerLocation,
  savePrayerPreferences,
  sanitizeRememberedPrayerLocation,
} from "../app/prayer-preferences.ts";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    read(key) {
      return values.get(key);
    },
  };
}

test("prayer preferences use a dedicated versioned storage key", () => {
  assert.equal(PRAYER_PREFERENCE_STORAGE_KEY, "mushaf:prayer-v1");
  assert.equal(PRAYER_PREFERENCE_SCHEMA_VERSION, 1);
  assert.notEqual(PRAYER_PREFERENCE_STORAGE_KEY, "mushaf:preferences-v8");
});

test("location persistence is disabled by default", () => {
  assert.equal(DEFAULT_PRAYER_PREFERENCES.rememberLocation, false);
  assert.equal(DEFAULT_PRAYER_PREFERENCES.rememberedLocation, null);
});

test("default calculation settings are explicit and deterministic", () => {
  assert.equal(
    DEFAULT_PRAYER_PREFERENCES.method,
    "muslim-world-league",
  );
  assert.equal(DEFAULT_PRAYER_PREFERENCES.asrCalculation, "standard");
  assert.deepEqual(DEFAULT_PRAYER_PREFERENCES.adjustments, {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  });
});

test("remembered coordinates are deliberately reduced in precision", () => {
  const location = sanitizeRememberedPrayerLocation({
    latitude: 38.9071923,
    longitude: -77.0368707,
  });

  assert.deepEqual(location, {
    latitude: 38.907,
    longitude: -77.037,
  });
});

test("invalid remembered coordinates fail closed", () => {
  assert.equal(
    sanitizeRememberedPrayerLocation({
      latitude: 120,
      longitude: -77,
    }),
    null,
  );

  assert.equal(
    sanitizeRememberedPrayerLocation({
      latitude: "38.9",
      longitude: -77,
    }),
    null,
  );
});

test("unknown or corrupt preference values fall back safely", () => {
  const normalized = normalizePrayerPreferences({
    schemaVersion: 1,
    method: "not-a-method",
    asrCalculation: "not-a-madhab",
    adjustments: {
      fajr: 999,
    },
    rememberLocation: true,
    rememberedLocation: {
      latitude: 999,
      longitude: 999,
    },
  });

  assert.equal(normalized.method, "muslim-world-league");
  assert.equal(normalized.asrCalculation, "standard");
  assert.equal(normalized.adjustments.fajr, 0);
  assert.equal(normalized.rememberLocation, false);
  assert.equal(normalized.rememberedLocation, null);
});

test("remembering location is explicit and rounds before persistence", () => {
  const updated = rememberPrayerLocation(
    normalizePrayerPreferences({
      ...DEFAULT_PRAYER_PREFERENCES,
    }),
    {
      latitude: 38.9071923,
      longitude: -77.0368707,
    },
  );

  assert.equal(updated.rememberLocation, true);
  assert.deepEqual(updated.rememberedLocation, {
    latitude: 38.907,
    longitude: -77.037,
  });
});

test("forgetting location removes coordinates while preserving prayer settings", () => {
  const remembered = rememberPrayerLocation(
    normalizePrayerPreferences({
      ...DEFAULT_PRAYER_PREFERENCES,
      method: "umm-al-qura",
      asrCalculation: "hanafi",
    }),
    {
      latitude: 21.4225,
      longitude: 39.8262,
    },
  );

  const forgotten = forgetPrayerLocation(remembered);

  assert.equal(forgotten.method, "umm-al-qura");
  assert.equal(forgotten.asrCalculation, "hanafi");
  assert.equal(forgotten.rememberLocation, false);
  assert.equal(forgotten.rememberedLocation, null);
});

test("load fails closed for malformed JSON", () => {
  const storage = memoryStorage({
    [PRAYER_PREFERENCE_STORAGE_KEY]: "{ definitely-not-json",
  });

  const loaded = loadPrayerPreferences(storage);

  assert.deepEqual(loaded, {
    schemaVersion: 1,
    method: "muslim-world-league",
    asrCalculation: "standard",
    adjustments: {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    },
    rememberLocation: false,
    rememberedLocation: null,
  });
});

test("saving prayer preferences does not use the Quran preference key", () => {
  const storage = memoryStorage();

  const preferences = rememberPrayerLocation(
    normalizePrayerPreferences({
      schemaVersion: 1,
      method: "moonsighting-committee",
      asrCalculation: "standard",
      adjustments: {
        fajr: -2,
        sunrise: 0,
        dhuhr: 1,
        asr: 0,
        maghrib: 0,
        isha: 3,
      },
      rememberLocation: false,
      rememberedLocation: null,
    }),
    {
      latitude: 38.9071923,
      longitude: -77.0368707,
    },
  );

  assert.equal(savePrayerPreferences(preferences, storage), true);

  const raw = storage.read(PRAYER_PREFERENCE_STORAGE_KEY);
  assert.ok(raw);

  const saved = JSON.parse(raw);

  assert.equal(saved.method, "moonsighting-committee");
  assert.equal(saved.rememberLocation, true);
  assert.deepEqual(saved.rememberedLocation, {
    latitude: 38.907,
    longitude: -77.037,
  });

  assert.equal(storage.read("mushaf:preferences-v8"), undefined);
});

test("storage failures do not escape into the application", () => {
  const brokenStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.deepEqual(
    loadPrayerPreferences(brokenStorage),
    normalizePrayerPreferences(DEFAULT_PRAYER_PREFERENCES),
  );

  assert.equal(
    savePrayerPreferences(DEFAULT_PRAYER_PREFERENCES, brokenStorage),
    false,
  );
});