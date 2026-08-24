import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PRAYER_PREFERENCES,
  LEGACY_PRAYER_PREFERENCE_STORAGE_KEY,
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

test("prayer preferences use a dedicated v2 storage key", () => {
  assert.equal(PRAYER_PREFERENCE_STORAGE_KEY, "mushaf:prayer-v2");
  assert.equal(LEGACY_PRAYER_PREFERENCE_STORAGE_KEY, "mushaf:prayer-v1");
  assert.equal(PRAYER_PREFERENCE_SCHEMA_VERSION, 2);
  assert.notEqual(PRAYER_PREFERENCE_STORAGE_KEY, "mushaf:preferences-v8");
});

test("location and notifications are disabled by default", () => {
  assert.equal(DEFAULT_PRAYER_PREFERENCES.rememberLocation, false);
  assert.equal(DEFAULT_PRAYER_PREFERENCES.rememberedLocation, null);
  assert.equal(DEFAULT_PRAYER_PREFERENCES.notifications.enabled, false);
  assert.deepEqual(DEFAULT_PRAYER_PREFERENCES.notifications.salah, {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  });
  assert.equal(DEFAULT_PRAYER_PREFERENCES.notifications.alertMode, "notification");
  assert.equal(DEFAULT_PRAYER_PREFERENCES.notifications.adhanCueId, null);
});

test("default calculation settings remain explicit and deterministic", () => {
  assert.equal(DEFAULT_PRAYER_PREFERENCES.method, "muslim-world-league");
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

test("schema v1 migrates losslessly and writes a v2 record", () => {
  const legacy = {
    schemaVersion: 1,
    method: "umm-al-qura",
    asrCalculation: "hanafi",
    adjustments: {
      fajr: -2,
      sunrise: 1,
      dhuhr: 2,
      asr: 3,
      maghrib: -1,
      isha: 4,
    },
    rememberLocation: true,
    rememberedLocation: { latitude: 21.423, longitude: 39.826 },
  };
  const storage = memoryStorage({
    [LEGACY_PRAYER_PREFERENCE_STORAGE_KEY]: JSON.stringify(legacy),
  });

  const migrated = loadPrayerPreferences(storage);

  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.method, legacy.method);
  assert.equal(migrated.asrCalculation, legacy.asrCalculation);
  assert.deepEqual(migrated.adjustments, legacy.adjustments);
  assert.equal(migrated.rememberLocation, true);
  assert.deepEqual(migrated.rememberedLocation, legacy.rememberedLocation);
  assert.equal(migrated.notifications.enabled, false);
  assert.deepEqual(JSON.parse(storage.read(PRAYER_PREFERENCE_STORAGE_KEY)), migrated);
});

test("remembered coordinates are deliberately reduced in precision", () => {
  assert.deepEqual(
    sanitizeRememberedPrayerLocation({
      latitude: 38.9071923,
      longitude: -77.0368707,
    }),
    { latitude: 38.907, longitude: -77.037 },
  );
});

test("invalid remembered coordinates fail closed", () => {
  assert.equal(
    sanitizeRememberedPrayerLocation({ latitude: 120, longitude: -77 }),
    null,
  );
  assert.equal(
    sanitizeRememberedPrayerLocation({ latitude: "38.9", longitude: -77 }),
    null,
  );
});

test("malformed notification settings and unknown Adhan assets normalize safely", () => {
  const normalized = normalizePrayerPreferences({
    schemaVersion: 2,
    method: "muslim-world-league",
    asrCalculation: "standard",
    adjustments: {},
    rememberLocation: false,
    rememberedLocation: null,
    notifications: {
      enabled: "yes",
      salah: { fajr: false, dhuhr: "yes", sunrise: true },
      alertMode: "notification-with-adhan-cue",
      adhanCueId: "unapproved-recording",
    },
  });

  assert.equal(normalized.notifications.enabled, false);
  assert.equal(normalized.notifications.salah.fajr, false);
  assert.equal(normalized.notifications.salah.dhuhr, true);
  assert.equal("sunrise" in normalized.notifications.salah, false);
  assert.equal(normalized.notifications.alertMode, "notification");
  assert.equal(normalized.notifications.adhanCueId, null);
});

test("unknown or corrupt calculation values fall back safely", () => {
  const normalized = normalizePrayerPreferences({
    schemaVersion: 2,
    method: "not-a-method",
    asrCalculation: "not-a-madhab",
    adjustments: { fajr: 999 },
    rememberLocation: true,
    rememberedLocation: { latitude: 999, longitude: 999 },
  });

  assert.equal(normalized.method, "muslim-world-league");
  assert.equal(normalized.asrCalculation, "standard");
  assert.equal(normalized.adjustments.fajr, 0);
  assert.equal(normalized.rememberLocation, false);
  assert.equal(normalized.rememberedLocation, null);
  assert.equal(normalized.notifications.enabled, false);
});

test("remembering and forgetting location preserves prayer and notification settings", () => {
  const remembered = rememberPrayerLocation(
    normalizePrayerPreferences({
      ...DEFAULT_PRAYER_PREFERENCES,
      method: "umm-al-qura",
      asrCalculation: "hanafi",
      notifications: {
        ...DEFAULT_PRAYER_PREFERENCES.notifications,
        enabled: true,
      },
    }),
    { latitude: 21.4225, longitude: 39.8262 },
  );
  const forgotten = forgetPrayerLocation(remembered);

  assert.deepEqual(remembered.rememberedLocation, {
    latitude: 21.423,
    longitude: 39.826,
  });
  assert.equal(forgotten.method, "umm-al-qura");
  assert.equal(forgotten.asrCalculation, "hanafi");
  assert.equal(forgotten.notifications.enabled, true);
  assert.equal(forgotten.rememberLocation, false);
  assert.equal(forgotten.rememberedLocation, null);
});

test("corrupt v2 storage can recover a valid v1 record", () => {
  const storage = memoryStorage({
    [PRAYER_PREFERENCE_STORAGE_KEY]: "{ definitely-not-json",
    [LEGACY_PRAYER_PREFERENCE_STORAGE_KEY]: JSON.stringify({
      schemaVersion: 1,
      method: "karachi",
      asrCalculation: "standard",
      adjustments: {},
      rememberLocation: false,
      rememberedLocation: null,
    }),
  });

  const loaded = loadPrayerPreferences(storage);
  assert.equal(loaded.method, "karachi");
  assert.equal(loaded.notifications.enabled, false);
});

test("a readable v1 record migrates in memory when storage is read-only", () => {
  const legacy = JSON.stringify({
    schemaVersion: 1,
    method: "egyptian",
    asrCalculation: "hanafi",
    adjustments: {},
    rememberLocation: false,
    rememberedLocation: null,
  });
  const loaded = loadPrayerPreferences({
    getItem(key) {
      return key === LEGACY_PRAYER_PREFERENCE_STORAGE_KEY ? legacy : null;
    },
    setItem() {
      throw new Error("read only");
    },
  });
  assert.equal(loaded.method, "egyptian");
  assert.equal(loaded.asrCalculation, "hanafi");
  assert.equal(loaded.notifications.enabled, false);
});

test("saving prayer preferences does not use the Quran or legacy key", () => {
  const storage = memoryStorage();
  const preferences = normalizePrayerPreferences({
    ...DEFAULT_PRAYER_PREFERENCES,
    method: "moonsighting-committee",
    notifications: {
      ...DEFAULT_PRAYER_PREFERENCES.notifications,
      enabled: true,
      salah: {
        ...DEFAULT_PRAYER_PREFERENCES.notifications.salah,
        isha: false,
      },
    },
  });

  assert.equal(savePrayerPreferences(preferences, storage), true);
  const saved = JSON.parse(storage.read(PRAYER_PREFERENCE_STORAGE_KEY));
  assert.equal(saved.method, "moonsighting-committee");
  assert.equal(saved.notifications.enabled, true);
  assert.equal(saved.notifications.salah.isha, false);
  assert.equal(storage.read(LEGACY_PRAYER_PREFERENCE_STORAGE_KEY), undefined);
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
  assert.equal(savePrayerPreferences(DEFAULT_PRAYER_PREFERENCES, brokenStorage), false);
});
