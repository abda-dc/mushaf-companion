import assert from "node:assert/strict";
import test from "node:test";
import {
  PRAYER_NOTIFICATION_HORIZON_DAYS,
  PRAYER_NOTIFICATION_OWNER,
  buildPrayerNotificationSchedule,
  prayerNotificationId,
  reconcilePrayerNotificationSchedule,
} from "../app/prayer-notification-scheduler.ts";

function at(day, hour, minute = 0) {
  return new Date(2026, 0, day, hour, minute);
}

function prayerDay(day, shiftMinutes = 0) {
  const shifted = (hour, minute = 0) =>
    at(day, hour, minute + shiftMinutes);
  return {
    date: at(day, 12),
    coordinates: { latitude: 38.907, longitude: -77.037 },
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
    qiblaDegrees: 56,
    times: {
      fajr: shifted(5),
      sunrise: shifted(6, 30),
      dhuhr: shifted(12),
      asr: shifted(15, 30),
      maghrib: shifted(18),
      isha: shifted(19, 30),
    },
  };
}

function notifications(overrides = {}) {
  return {
    enabled: true,
    ...overrides,
    salah: {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      ...overrides.salah,
    },
    alertMode: overrides.alertMode ?? "notification",
    adhanCueId: overrides.adhanCueId ?? null,
  };
}

function pending(entry, schedulingMode = "unknown") {
  return {
    ...entry,
    owner: PRAYER_NOTIFICATION_OWNER,
    schedulingMode,
  };
}

test("seven-day planning schedules only the five Salah prayers", () => {
  const days = Array.from(
    { length: PRAYER_NOTIFICATION_HORIZON_DAYS },
    (_, index) => prayerDay(index + 10),
  );
  const plan = buildPrayerNotificationSchedule({
    days,
    now: at(10, 4),
    notifications: notifications(),
  });

  assert.equal(plan.length, 35);
  assert.deepEqual(
    new Set(plan.map((entry) => entry.salah)),
    new Set(["fajr", "dhuhr", "asr", "maghrib", "isha"]),
  );
  assert.equal(plan.some((entry) => entry.title === "Sunrise"), false);
});

test("master and individual Salah settings are respected", () => {
  const day = prayerDay(10);
  assert.deepEqual(
    buildPrayerNotificationSchedule({
      days: [day],
      now: at(10, 4),
      notifications: notifications({ enabled: false }),
    }),
    [],
  );

  const fajrOnly = buildPrayerNotificationSchedule({
    days: [day],
    now: at(10, 4),
    notifications: notifications({
      salah: { dhuhr: false, asr: false, maghrib: false, isha: false },
    }),
  });
  assert.deepEqual(fajrOnly.map((entry) => entry.salah), ["fajr"]);
});

test("planning excludes past times but includes next-day Fajr", () => {
  const plan = buildPrayerNotificationSchedule({
    days: [prayerDay(10), prayerDay(11)],
    now: at(10, 18, 30),
    notifications: notifications(),
  });

  assert.deepEqual(
    plan.slice(0, 2).map((entry) => [entry.localDate, entry.salah]),
    [
      ["2026-01-10", "isha"],
      ["2026-01-11", "fajr"],
    ],
  );
  assert.equal(plan.every((entry) => entry.scheduledAt > at(10, 18, 30).getTime()), true);
});

test("planner bounds an oversized input to the seven-day horizon", () => {
  const plan = buildPrayerNotificationSchedule({
    days: Array.from({ length: 12 }, (_, index) => prayerDay(index + 10)),
    now: at(10, 4),
    notifications: notifications(),
  });
  assert.equal(plan.length, 35);
  assert.equal(plan.at(-1).localDate, "2026-01-16");
});

test("notification IDs are deterministic positive integers without horizon collisions", () => {
  const ids = [];
  for (let day = 10; day < 17; day += 1) {
    for (const salah of ["fajr", "dhuhr", "asr", "maghrib", "isha"]) {
      const first = prayerNotificationId(at(day, 12), salah);
      const second = prayerNotificationId(at(day, 12), salah);
      assert.equal(first, second);
      assert.equal(Number.isInteger(first) && first > 0, true);
      ids.push(first);
    }
  }
  assert.equal(new Set(ids).size, ids.length);
});

test("unchanged reconciliation is idempotent and retains matching entries", () => {
  const desired = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const first = reconcilePrayerNotificationSchedule(desired, []);
  const second = reconcilePrayerNotificationSchedule(
    desired,
    desired.map((entry) => pending(entry, "exact")),
    "exact",
  );

  assert.equal(first.add.length, 5);
  assert.equal(second.add.length, 0);
  assert.equal(second.cancelIds.length, 0);
  assert.equal(second.retain.length, 5);
});

test("exact-alarm access upgrades replace inexact and legacy pending alerts", () => {
  const desired = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });

  const inexactUpgrade = reconcilePrayerNotificationSchedule(
    desired,
    desired.map((entry) => pending(entry, "inexact")),
    "exact",
  );
  assert.equal(inexactUpgrade.cancelIds.length, 5);
  assert.equal(inexactUpgrade.add.length, 5);
  assert.equal(inexactUpgrade.retain.length, 0);

  const legacyUpgrade = reconcilePrayerNotificationSchedule(
    desired,
    desired.map((entry) => pending(entry)),
    "exact",
  );
  assert.equal(legacyUpgrade.cancelIds.length, 5);
  assert.equal(legacyUpgrade.add.length, 5);
  assert.equal(legacyUpgrade.retain.length, 0);
});

test("duplicate and stale owned entries are cancelled without touching unrelated notifications", () => {
  const desired = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const duplicate = pending(desired[0]);
  const stale = pending({ ...desired[1], scheduledAt: desired[1].scheduledAt + 60_000 });
  const unrelated = { ...pending(desired[2]), owner: "another-feature" };
  const result = reconcilePrayerNotificationSchedule(desired, [
    ...desired.map(pending),
    duplicate,
    stale,
    unrelated,
  ]);

  assert.deepEqual(result.cancelIds.sort(), [desired[0].id, desired[1].id].sort());
  assert.deepEqual(result.add.map((entry) => entry.id).sort(), [desired[0].id, desired[1].id].sort());
  assert.equal(result.cancelIds.includes(unrelated.id) && unrelated.id === desired[2].id, false);
});

test("changed time from method, adjustment, or location replaces the existing alert", () => {
  const original = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const changed = buildPrayerNotificationSchedule({
    days: [prayerDay(10, 3)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const result = reconcilePrayerNotificationSchedule(changed, original.map(pending));

  assert.equal(result.cancelIds.length, 5);
  assert.equal(result.add.length, 5);
  assert.equal(result.retain.length, 0);
});

test("changed alert mode replaces the existing payload", () => {
  const original = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const changed = original.map((entry) => ({
    ...entry,
    alertMode: "notification-with-adhan-cue",
    adhanCueId: "approved-cue",
  }));
  const result = reconcilePrayerNotificationSchedule(changed, original.map(pending));

  assert.equal(result.cancelIds.length, 5);
  assert.equal(result.add.length, 5);
});

test("disabling notifications cancels all app-owned pending alerts", () => {
  const original = buildPrayerNotificationSchedule({
    days: [prayerDay(10)],
    now: at(10, 4),
    notifications: notifications(),
  });
  const result = reconcilePrayerNotificationSchedule([], original.map(pending));
  assert.equal(result.cancelIds.length, 5);
  assert.equal(result.add.length, 0);
});
