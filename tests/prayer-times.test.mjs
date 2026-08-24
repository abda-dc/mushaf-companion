import test from "node:test";
import assert from "node:assert/strict";

import {
  PRAYER_CALCULATION_METHODS,
  SALAH_ORDER,
  calculatePrayerDay,
  formatPrayerTime,
  getNextPrayer,
  normalizePrayerAdjustments,
  qiblaCardinalDirection,
  validatePrayerCoordinates,
} from "../app/prayer-times.ts";

const WASHINGTON_DC = {
  latitude: 38.9072,
  longitude: -77.0369,
};

function dcPrayerDay(overrides = {}) {
  return calculatePrayerDay({
    coordinates: WASHINGTON_DC,
    date: new Date(2026, 7, 22, 12, 0, 0),
    method: "moonsighting-committee",
    asrCalculation: "standard",
    ...overrides,
  });
}

test("all supported calculation methods have unique stable IDs", () => {
  const ids = PRAYER_CALCULATION_METHODS.map((entry) => entry.id);

  assert.equal(ids.length, 12);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes("moonsighting-committee"));
  assert.ok(ids.includes("north-america"));
  assert.ok(ids.includes("umm-al-qura"));
});

test("five-prayer order deliberately excludes sunrise", () => {
  assert.deepEqual(SALAH_ORDER, [
    "fajr",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
  ]);

  assert.equal(SALAH_ORDER.includes("sunrise"), false);
});

test("coordinate validation fails closed", () => {
  assert.throws(
    () =>
      validatePrayerCoordinates({
        latitude: 91,
        longitude: -77,
      }),
    /Latitude must be between -90 and 90/,
  );

  assert.throws(
    () =>
      validatePrayerCoordinates({
        latitude: 38,
        longitude: -181,
      }),
    /Longitude must be between -180 and 180/,
  );
});

test("manual prayer adjustments are explicit whole minutes within bounds", () => {
  assert.deepEqual(
    normalizePrayerAdjustments({
      fajr: -2,
      dhuhr: 3,
      isha: 5,
    }),
    {
      fajr: -2,
      sunrise: 0,
      dhuhr: 3,
      asr: 0,
      maghrib: 0,
      isha: 5,
    },
  );

  assert.throws(
    () => normalizePrayerAdjustments({ fajr: 30.5 }),
    /whole number of minutes/,
  );

  assert.throws(
    () => normalizePrayerAdjustments({ isha: 31 }),
    /between -30 and 30 minutes/,
  );
});

test("ordinary-day prayer times remain chronologically ordered", () => {
  const day = dcPrayerDay();

  assert.ok(day.times.fajr < day.times.sunrise);
  assert.ok(day.times.sunrise < day.times.dhuhr);
  assert.ok(day.times.dhuhr < day.times.asr);
  assert.ok(day.times.asr < day.times.maghrib);
  assert.ok(day.times.maghrib < day.times.isha);
});

test("Hanafi Asr is later than standard Asr without moving other prayers", () => {
  const standard = dcPrayerDay({
    asrCalculation: "standard",
  });

  const hanafi = dcPrayerDay({
    asrCalculation: "hanafi",
  });

  assert.ok(hanafi.times.asr > standard.times.asr);

  for (const prayer of ["fajr", "sunrise", "dhuhr", "maghrib", "isha"]) {
    assert.equal(
      hanafi.times[prayer].getTime(),
      standard.times[prayer].getTime(),
      `${prayer} should not move when only the Asr madhab changes`,
    );
  }
});

test("manual adjustment moves only the selected calculated time", () => {
  const baseline = dcPrayerDay();

  const adjusted = dcPrayerDay({
    adjustments: {
      fajr: 5,
    },
  });

  assert.equal(
    adjusted.times.fajr.getTime() - baseline.times.fajr.getTime(),
    5 * 60 * 1000,
  );

  assert.equal(
    adjusted.times.dhuhr.getTime(),
    baseline.times.dhuhr.getTime(),
  );
});

test("Washington DC Qibla resolves northeast at the expected bearing", () => {
  const day = dcPrayerDay();

  assert.ok(
    day.qiblaDegrees > 55 && day.qiblaDegrees < 58,
    `Unexpected Qibla bearing: ${day.qiblaDegrees}`,
  );

  assert.equal(qiblaCardinalDirection(day.qiblaDegrees), "NE");
});

test("next-prayer selection never promotes sunrise to a salah", () => {
  const day = dcPrayerDay();

  const now = new Date(
    Math.floor(
      (day.times.fajr.getTime() + day.times.sunrise.getTime()) / 2,
    ),
  );

  const next = getNextPrayer(day, now);

  assert.ok(next);
  assert.equal(next.name, "dhuhr");
  assert.equal(next.isTomorrow, false);
});

test("after Isha, next-prayer selection can roll to tomorrow Fajr", () => {
  const today = dcPrayerDay();

  const tomorrowDate = new Date(2026, 7, 23, 12, 0, 0);
  const tomorrow = dcPrayerDay({
    date: tomorrowDate,
  });

  const afterIsha = new Date(today.times.isha.getTime() + 60 * 1000);
  const next = getNextPrayer(today, afterIsha, tomorrow);

  assert.ok(next);
  assert.equal(next.name, "fajr");
  assert.equal(next.at.getTime(), tomorrow.times.fajr.getTime());
  assert.equal(next.isTomorrow, true);
});

test("prayer time formatting requires an explicit time zone", () => {
  const day = dcPrayerDay();

  const formatted = formatPrayerTime(
    day.times.dhuhr,
    "America/New_York",
  );

  assert.match(formatted, /\d/);

  assert.throws(
    () => formatPrayerTime(day.times.dhuhr, ""),
    /time zone is required/,
  );
});