import assert from "node:assert/strict";
import test from "node:test";
import { normalizePrayerPreferences } from "../app/prayer-preferences.ts";
import {
  calculatePrayerNotificationHorizon,
  synchronizePrayerNotifications,
} from "../app/prayer-notification-controller.ts";
import {
  PRAYER_DEFAULT_CHANNEL_ID,
  pendingNativePrayerNotification,
  prayerNotificationErrorMessage,
  toNativePrayerNotification,
} from "../app/prayer-notification-native.ts";
import {
  PRAYER_NOTIFICATION_OWNER,
  buildPrayerNotificationSchedule,
} from "../app/prayer-notification-scheduler.ts";

const coordinates = { latitude: 38.907, longitude: -77.037 };
const now = new Date(2026, 0, 10, 4);

function preferences(enabled = true) {
  return normalizePrayerPreferences({
    schemaVersion: 2,
    method: "north-america",
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
    notifications: {
      enabled,
      salah: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
      alertMode: "notification",
      adhanCueId: null,
    },
  });
}

function fakePlatform(capabilities) {
  const calls = [];
  return {
    calls,
    async getCapabilities() {
      return capabilities;
    },
    async requestPermission() {
      throw new Error("controller must not request permission");
    },
    async reconcile(entries) {
      calls.push(entries);
      return { ok: true, message: "synced", scheduled: entries.length };
    },
    async sendTest() {
      return { ok: true, message: "test" };
    },
    async openExactAlarmSettings() {
      return { ok: true, message: "settings" };
    },
    async addPrayerActionListener() {
      return null;
    },
  };
}

test("controller never requests permission and stops safely when denied", async () => {
  const platform = fakePlatform({
    platform: "native-android",
    permission: "denied",
    displayAvailable: true,
    backgroundSchedulingAvailable: true,
    exactScheduling: "unavailable",
    message: "blocked",
  });
  const result = await synchronizePrayerNotifications({
    preferences: preferences(),
    coordinates,
    now,
    platform,
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /disabled/);
  assert.equal(platform.calls.length, 0);
});

test("unsupported platforms and missing location fail without calculation or scheduling", async () => {
  const unsupported = fakePlatform({
    platform: "unsupported",
    permission: "unsupported",
    displayAvailable: false,
    backgroundSchedulingAvailable: false,
    exactScheduling: "not-applicable",
    message: "unsupported",
  });
  const unsupportedResult = await synchronizePrayerNotifications({
    preferences: preferences(),
    coordinates,
    now,
    platform: unsupported,
  });
  assert.equal(unsupportedResult.ok, false);
  assert.equal(unsupported.calls.length, 0);

  const native = fakePlatform({
    platform: "native-ios",
    permission: "granted",
    displayAvailable: true,
    backgroundSchedulingAvailable: true,
    exactScheduling: "not-applicable",
    message: "ready",
  });
  const missingLocation = await synchronizePrayerNotifications({
    preferences: preferences(),
    coordinates: null,
    now,
    platform: native,
  });
  assert.equal(missingLocation.ok, false);
  assert.match(missingLocation.message, /Refresh your location/);
  assert.equal(native.calls.length, 0);
});

test("exact-alarm unavailable still produces the offline seven-day native plan", async () => {
  const platform = fakePlatform({
    platform: "native-android",
    permission: "granted",
    displayAvailable: true,
    backgroundSchedulingAvailable: true,
    exactScheduling: "unavailable",
    message: "inexact fallback",
  });
  const result = await synchronizePrayerNotifications({
    preferences: preferences(),
    coordinates,
    now,
    platform,
  });
  assert.equal(result.ok, true);
  assert.equal(platform.calls.length, 1);
  assert.equal(platform.calls[0].length > 0 && platform.calls[0].length <= 35, true);
});

test("method and location changes produce reconcilable timestamp changes", () => {
  const originalPreferences = preferences();
  const original = buildPrayerNotificationSchedule({
    days: calculatePrayerNotificationHorizon({
      preferences: originalPreferences,
      coordinates,
      now,
    }),
    now,
    notifications: originalPreferences.notifications,
  });
  const changedMethodPreferences = {
    ...originalPreferences,
    method: "umm-al-qura",
  };
  const changedMethod = buildPrayerNotificationSchedule({
    days: calculatePrayerNotificationHorizon({
      preferences: changedMethodPreferences,
      coordinates,
      now,
    }),
    now,
    notifications: changedMethodPreferences.notifications,
  });
  const changedLocation = buildPrayerNotificationSchedule({
    days: calculatePrayerNotificationHorizon({
      preferences: originalPreferences,
      coordinates: { latitude: 21.423, longitude: 39.826 },
      now,
    }),
    now,
    notifications: originalPreferences.notifications,
  });

  assert.notDeepEqual(
    original.map((entry) => entry.scheduledAt),
    changedMethod.map((entry) => entry.scheduledAt),
  );
  assert.notDeepEqual(
    original.map((entry) => entry.scheduledAt),
    changedLocation.map((entry) => entry.scheduledAt),
  );
});

test("calendar horizon remains seven local dates across a daylight-saving boundary", () => {
  const start = new Date(2026, 2, 7, 4);
  const prefs = preferences();
  const days = calculatePrayerNotificationHorizon({
    preferences: prefs,
    coordinates,
    now: start,
  });
  assert.deepEqual(
    days.map((day) => day.date.getDate()),
    [7, 8, 9, 10, 11, 12, 13],
  );
  const plan = buildPrayerNotificationSchedule({
    days,
    now: start,
    notifications: prefs.notifications,
  });
  assert.equal(plan.length, 35);
  assert.equal(plan[0].localDate, "2026-03-07");
  assert.equal(plan.at(-1).localDate, "2026-03-13");
});

test("disabling notifications reconciles an empty owned schedule even when permission is denied", async () => {
  const platform = fakePlatform({
    platform: "native-android",
    permission: "denied",
    displayAvailable: true,
    backgroundSchedulingAvailable: true,
    exactScheduling: "unavailable",
    message: "blocked",
  });
  const result = await synchronizePrayerNotifications({
    preferences: preferences(false),
    coordinates: null,
    now,
    platform,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(platform.calls, [[]]);
});

test("native payload translation uses integers, dates, owned metadata, scheduling mode, and no coordinates", () => {
  const prefs = preferences();
  const days = calculatePrayerNotificationHorizon({
    preferences: prefs,
    coordinates,
    now,
  });
  const entry = buildPrayerNotificationSchedule({
    days,
    now,
    notifications: prefs.notifications,
  })[0];
  const exact = toNativePrayerNotification(entry, "available");
  const inexact = toNativePrayerNotification(entry, "unavailable");
  const ios = toNativePrayerNotification(entry, "not-applicable");

  assert.equal(Number.isInteger(exact.id), true);
  assert.equal(exact.title, entry.title);
  assert.equal(exact.body, entry.body);
  assert.equal(exact.schedule.at instanceof Date, true);
  assert.equal(exact.channelId, PRAYER_DEFAULT_CHANNEL_ID);
  assert.equal(exact.sound, "default");
  assert.equal(exact.schedule.allowWhileIdle, true);
  assert.equal(exact.isExactNotification, true);
  assert.equal(inexact.schedule.allowWhileIdle, false);
  assert.equal(inexact.isExactNotification, false);
  assert.equal(exact.extra.owner, PRAYER_NOTIFICATION_OWNER);
  assert.equal(exact.extra.navigationTarget, "prayer");
  assert.equal(exact.extra.schedulingMode, "exact");
  assert.equal(inexact.extra.schedulingMode, "inexact");
  assert.equal(ios.extra.schedulingMode, "not-applicable");
  assert.equal("latitude" in exact.extra, false);
  assert.equal("longitude" in exact.extra, false);
  assert.doesNotMatch(JSON.stringify(exact), /38\.907|-77\.037/);
});

test("pending native entries preserve scheduling mode and migrate legacy metadata safely", () => {
  const prefs = preferences();
  const entry = buildPrayerNotificationSchedule({
    days: calculatePrayerNotificationHorizon({ preferences: prefs, coordinates, now }),
    now,
    notifications: prefs.notifications,
  })[0];
  const payload = toNativePrayerNotification(entry, "available");
  assert.deepEqual(
    pendingNativePrayerNotification(payload),
    {
      ...entry,
      owner: PRAYER_NOTIFICATION_OWNER,
      schedulingMode: "exact",
    },
  );
  assert.equal(
    pendingNativePrayerNotification({
      ...payload,
      extra: { ...payload.extra, owner: "another-feature" },
    }),
    null,
  );

  const legacyExtra = { ...payload.extra };
  delete legacyExtra.schedulingMode;
  const legacyOwned = pendingNativePrayerNotification({
    ...payload,
    extra: legacyExtra,
  });
  assert.ok(legacyOwned);
  assert.equal(legacyOwned.schedulingMode, "unknown");

  const malformedOwned = pendingNativePrayerNotification({
    ...payload,
    extra: { owner: PRAYER_NOTIFICATION_OWNER },
  });
  assert.ok(malformedOwned);
  assert.equal(Number.isNaN(malformedOwned.scheduledAt), true);
  assert.equal(malformedOwned.schedulingMode, "unknown");
});

test("structured plugin errors become bounded user-facing messages", () => {
  assert.equal(
    prayerNotificationErrorMessage(
      { code: "OS-PLUG-LNOT-0005", message: "raw implementation detail" },
      "fallback",
    ),
    "Notifications are disabled in system settings.",
  );
  assert.equal(
    prayerNotificationErrorMessage(
      { code: "UNKNOWN", message: "private raw failure" },
      "The device could not synchronize prayer alerts.",
    ),
    "The device could not synchronize prayer alerts.",
  );
});
