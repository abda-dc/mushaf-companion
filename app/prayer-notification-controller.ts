import {
  calculatePrayerDay,
  type CalculatedPrayerDay,
  type PrayerCoordinates,
} from "./prayer-times.ts";
import type { PrayerPreferences } from "./prayer-preferences.ts";
import {
  buildPrayerNotificationSchedule,
  PRAYER_NOTIFICATION_HORIZON_DAYS,
} from "./prayer-notification-scheduler.ts";
import {
  getPrayerNotificationPlatform,
  type PrayerNotificationCapabilities,
  type PrayerNotificationOperationResult,
  type PrayerNotificationPlatform,
} from "./prayer-notification-platform.ts";

function calendarDateFrom(start: Date, dayOffset: number): Date {
  const date = new Date(start.getTime());
  date.setDate(date.getDate() + dayOffset);
  return date;
}

export function calculatePrayerNotificationHorizon(input: {
  preferences: PrayerPreferences;
  coordinates: PrayerCoordinates;
  now: Date;
}): CalculatedPrayerDay[] {
  return Array.from(
    { length: PRAYER_NOTIFICATION_HORIZON_DAYS },
    (_, dayOffset) =>
      calculatePrayerDay({
        coordinates: input.coordinates,
        date: calendarDateFrom(input.now, dayOffset),
        method: input.preferences.method,
        asrCalculation: input.preferences.asrCalculation,
        adjustments: input.preferences.adjustments,
      }),
  );
}

export async function synchronizePrayerNotifications(input: {
  preferences: PrayerPreferences;
  coordinates: PrayerCoordinates | null;
  now?: Date;
  platform?: PrayerNotificationPlatform;
}): Promise<PrayerNotificationOperationResult> {
  const platform = input.platform ?? (await getPrayerNotificationPlatform());
  const capabilities = await platform.getCapabilities();

  if (!input.preferences.notifications.enabled) {
    if (capabilities.backgroundSchedulingAvailable) {
      return platform.reconcile([]);
    }
    return { ok: true, message: "Prayer notifications are off." };
  }

  if (capabilities.permission !== "granted") {
    return {
      ok: false,
      message:
        capabilities.permission === "denied"
          ? "Notifications are disabled in system or browser settings."
          : capabilities.permission === "unsupported"
            ? "Notifications are unsupported on this platform."
            : "Notification permission has not been requested.",
    };
  }

  if (!capabilities.backgroundSchedulingAvailable) {
    return {
      ok: false,
      message:
        "Browser test notifications are available, but closed-app prayer scheduling requires future Web Push infrastructure.",
    };
  }

  if (!input.coordinates) {
    return {
      ok: false,
      message:
        "Refresh your location before the native prayer schedule can be extended.",
    };
  }

  const now = input.now ?? new Date();
  const days = calculatePrayerNotificationHorizon({
    preferences: input.preferences,
    coordinates: input.coordinates,
    now,
  });
  const desired = buildPrayerNotificationSchedule({
    days,
    now,
    notifications: input.preferences.notifications,
  });

  return platform.reconcile(desired);
}

export async function inspectPrayerNotificationCapabilities(): Promise<PrayerNotificationCapabilities> {
  return (await getPrayerNotificationPlatform()).getCapabilities();
}

export async function requestPrayerNotificationPermission(): Promise<PrayerNotificationCapabilities> {
  return (await getPrayerNotificationPlatform()).requestPermission();
}

export async function sendPrayerNotificationTest(): Promise<PrayerNotificationOperationResult> {
  return (await getPrayerNotificationPlatform()).sendTest();
}

export async function openPrayerExactAlarmSettings(): Promise<PrayerNotificationOperationResult> {
  return (await getPrayerNotificationPlatform()).openExactAlarmSettings();
}
