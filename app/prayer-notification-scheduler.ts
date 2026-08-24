import { SALAH_ORDER, type CalculatedPrayerDay, type SalahName } from "./prayer-times.ts";
import type {
  PrayerNotificationAlertMode,
  PrayerNotificationPreferences,
} from "./prayer-preferences.ts";

export const PRAYER_NOTIFICATION_OWNER = "mushaf-companion:prayer-v2";
export const PRAYER_NOTIFICATION_HORIZON_DAYS = 7;
export const PRAYER_NOTIFICATION_ID_MIN = 1_200_000_000;
export const PRAYER_NOTIFICATION_ID_MAX = 1_200_499_999;

const DAY_ID_WINDOW = 100_000;
const PRAYER_LABELS: Readonly<Record<SalahName, string>> = Object.freeze({
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
});

export type PrayerNotificationSchedulingMode =
  | "exact"
  | "inexact"
  | "not-applicable"
  | "unknown";

export interface PrayerNotificationEntry {
  id: number;
  salah: SalahName;
  scheduledAt: number;
  localDate: string;
  title: string;
  body: string;
  alertMode: PrayerNotificationAlertMode;
  adhanCueId: string | null;
  navigationTarget: "prayer";
}

export interface PendingPrayerNotification extends PrayerNotificationEntry {
  owner: typeof PRAYER_NOTIFICATION_OWNER;
  schedulingMode: PrayerNotificationSchedulingMode;
}

export interface PrayerNotificationReconciliation {
  add: PrayerNotificationEntry[];
  cancelIds: number[];
  retain: PrayerNotificationEntry[];
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDayOrdinal(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      86_400_000,
  );
}

export function prayerNotificationId(
  localDate: Date,
  salah: SalahName,
): number {
  const prayerIndex = SALAH_ORDER.indexOf(salah);
  if (prayerIndex < 0) {
    throw new RangeError("Only one of the five Salah prayers can be scheduled.");
  }

  const day = ((localDayOrdinal(localDate) % DAY_ID_WINDOW) + DAY_ID_WINDOW) % DAY_ID_WINDOW;
  return PRAYER_NOTIFICATION_ID_MIN + day * SALAH_ORDER.length + prayerIndex;
}

export function isPrayerNotificationId(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    Number(value) >= PRAYER_NOTIFICATION_ID_MIN &&
    Number(value) <= PRAYER_NOTIFICATION_ID_MAX
  );
}

export function buildPrayerNotificationSchedule(input: {
  days: readonly CalculatedPrayerDay[];
  now: Date;
  notifications: PrayerNotificationPreferences;
}): PrayerNotificationEntry[] {
  if (!input.notifications.enabled) {
    return [];
  }

  const nowMs = input.now.getTime();
  if (!Number.isFinite(nowMs)) {
    throw new RangeError("Notification planning requires a valid current time.");
  }

  const entries: PrayerNotificationEntry[] = [];
  const supportedDays = input.days.slice(0, PRAYER_NOTIFICATION_HORIZON_DAYS);

  for (const day of supportedDays) {
    const localDate = localDateKey(day.date);

    for (const salah of SALAH_ORDER) {
      if (!input.notifications.salah[salah]) {
        continue;
      }

      const scheduledAt = day.times[salah].getTime();
      if (!Number.isFinite(scheduledAt) || scheduledAt <= nowMs) {
        continue;
      }

      const title = PRAYER_LABELS[salah];
      entries.push({
        id: prayerNotificationId(day.date, salah),
        salah,
        scheduledAt,
        localDate,
        title,
        body: `It is time for ${title}.`,
        alertMode: input.notifications.alertMode,
        adhanCueId: input.notifications.adhanCueId,
        navigationTarget: "prayer",
      });
    }
  }

  return entries.sort(
    (left, right) =>
      left.scheduledAt - right.scheduledAt || left.id - right.id,
  );
}

function matchingEntry(
  desired: PrayerNotificationEntry,
  pending: PendingPrayerNotification,
  expectedSchedulingMode?: Exclude<PrayerNotificationSchedulingMode, "unknown">,
): boolean {
  return (
    desired.id === pending.id &&
    desired.salah === pending.salah &&
    desired.scheduledAt === pending.scheduledAt &&
    desired.localDate === pending.localDate &&
    desired.title === pending.title &&
    desired.body === pending.body &&
    desired.alertMode === pending.alertMode &&
    desired.adhanCueId === pending.adhanCueId &&
    desired.navigationTarget === pending.navigationTarget &&
    (expectedSchedulingMode === undefined ||
      pending.schedulingMode === expectedSchedulingMode)
  );
}

export function reconcilePrayerNotificationSchedule(
  desired: readonly PrayerNotificationEntry[],
  pending: readonly PendingPrayerNotification[],
  expectedSchedulingMode?: Exclude<PrayerNotificationSchedulingMode, "unknown">,
): PrayerNotificationReconciliation {
  const desiredById = new Map(desired.map((entry) => [entry.id, entry]));
  const retainedIds = new Set<number>();
  const cancelIds = new Set<number>();
  const retain: PrayerNotificationEntry[] = [];

  for (const existing of pending) {
    if (
      existing.owner !== PRAYER_NOTIFICATION_OWNER ||
      !isPrayerNotificationId(existing.id)
    ) {
      continue;
    }

    const expected = desiredById.get(existing.id);
    if (
      expected &&
      !retainedIds.has(existing.id) &&
      matchingEntry(expected, existing, expectedSchedulingMode)
    ) {
      retainedIds.add(existing.id);
      retain.push(expected);
    } else {
      cancelIds.add(existing.id);
    }
  }

  for (const cancelledId of cancelIds) {
    retainedIds.delete(cancelledId);
  }

  const add = desired.filter((entry) => !retainedIds.has(entry.id));

  return {
    add,
    cancelIds: [...cancelIds].sort((left, right) => left - right),
    retain: retain
      .filter((entry) => retainedIds.has(entry.id))
      .sort((left, right) => left.scheduledAt - right.scheduledAt),
  };
}
