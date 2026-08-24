import type {
  LocalNotificationSchema,
  LocalNotificationsPlugin,
  PendingLocalNotificationSchema,
  PermissionStatus,
} from "@capacitor/local-notifications";
import { registerPlugin } from "@capacitor/core";
import { findApprovedAdhanCue } from "./adhan-assets.ts";
import {
  PRAYER_NOTIFICATION_OWNER,
  isPrayerNotificationId,
  reconcilePrayerNotificationSchedule,
  type PendingPrayerNotification,
  type PrayerNotificationEntry,
} from "./prayer-notification-scheduler.ts";
import type {
  PrayerExactSchedulingState,
  PrayerNotificationCapabilities,
  PrayerNotificationOperationResult,
  PrayerNotificationPermissionState,
  PrayerNotificationPlatform,
} from "./prayer-notification-platform.ts";
import { SALAH_ORDER, type SalahName } from "./prayer-times.ts";

export const PRAYER_DEFAULT_CHANNEL_ID = "prayer-default-v1";
export const PRAYER_TEST_NOTIFICATION_ID = 1_200_500_001;

type NativePlatform = "android" | "ios";

const NativeLocalNotifications =
  registerPlugin<LocalNotificationsPlugin>("LocalNotifications");

async function localNotificationsPlugin(): Promise<LocalNotificationsPlugin> {
  return NativeLocalNotifications;
}

function normalizedPermission(
  status: PermissionStatus,
): PrayerNotificationPermissionState {
  switch (status.display) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "prompt";
  }
}

export function prayerNotificationErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "OS-PLUG-LNOT-0005":
      return "Notifications are disabled in system settings.";
    case "OS-PLUG-LNOT-0009":
      return "A prayer alert identifier was rejected by the device.";
    case "OS-PLUG-LNOT-0010":
      return "iOS could not schedule one or more prayer alerts.";
    default:
      return fallback;
  }
}

function cueSound(entry: PrayerNotificationEntry): string {
  return findApprovedAdhanCue(entry.adhanCueId)?.fileName ?? "default";
}

function channelId(entry: PrayerNotificationEntry): string {
  const cue = findApprovedAdhanCue(entry.adhanCueId);
  return cue ? `prayer-adhan-${cue.id}-v1` : PRAYER_DEFAULT_CHANNEL_ID;
}

export function toNativePrayerNotification(
  entry: PrayerNotificationEntry,
  exactScheduling: PrayerExactSchedulingState,
): LocalNotificationSchema {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    schedule: {
      at: new Date(entry.scheduledAt),
      allowWhileIdle: exactScheduling === "available",
    },
    sound: cueSound(entry),
    channelId: channelId(entry),
    autoCancel: true,
    foreground: true,
    isExactNotification: exactScheduling === "available",
    isExactMandatory: false,
    threadIdentifier: "mushaf-prayer-alerts",
    extra: {
      owner: PRAYER_NOTIFICATION_OWNER,
      salah: entry.salah,
      localDate: entry.localDate,
      alertMode: entry.alertMode,
      adhanCueId: entry.adhanCueId,
      navigationTarget: entry.navigationTarget,
    },
  };
}

function pendingDate(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : null;
  }

  if (typeof value === "string" || typeof value === "number") {
    const milliseconds = new Date(value).getTime();
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }

  return null;
}

function isSalahName(value: unknown): value is SalahName {
  return (
    typeof value === "string" &&
    SALAH_ORDER.includes(value as SalahName)
  );
}

export function pendingNativePrayerNotification(
  notification: PendingLocalNotificationSchema,
): PendingPrayerNotification | null {
  const extra = notification.extra;
  const scheduledAt = pendingDate(notification.schedule?.at);

  if (
    !extra ||
    typeof extra !== "object" ||
    extra.owner !== PRAYER_NOTIFICATION_OWNER ||
    !isPrayerNotificationId(notification.id)
  ) {
    return null;
  }

  const metadataValid =
    isSalahName(extra.salah) &&
    scheduledAt !== null &&
    typeof extra.localDate === "string" &&
    (extra.alertMode === "notification" ||
      extra.alertMode === "notification-with-adhan-cue") &&
    extra.navigationTarget === "prayer";

  return {
    owner: PRAYER_NOTIFICATION_OWNER,
    id: notification.id,
    salah: isSalahName(extra.salah) ? extra.salah : "fajr",
    scheduledAt:
      metadataValid && scheduledAt !== null ? scheduledAt : Number.NaN,
    localDate:
      typeof extra.localDate === "string" ? extra.localDate : "invalid",
    title: notification.title,
    body: notification.body,
    alertMode:
      extra.alertMode === "notification-with-adhan-cue"
        ? "notification-with-adhan-cue"
        : "notification",
    adhanCueId:
      typeof extra.adhanCueId === "string" ? extra.adhanCueId : null,
    navigationTarget: "prayer",
  };
}

async function exactSchedulingState(
  plugin: LocalNotificationsPlugin,
  platform: NativePlatform,
): Promise<PrayerExactSchedulingState> {
  if (platform !== "android") {
    return "not-applicable";
  }

  try {
    const status = await plugin.checkExactNotificationSetting();
    return status.exact_alarm === "granted" ? "available" : "unavailable";
  } catch {
    return "unavailable";
  }
}

async function capabilities(
  plugin: LocalNotificationsPlugin,
  platform: NativePlatform,
): Promise<PrayerNotificationCapabilities> {
  try {
    const permission = normalizedPermission(await plugin.checkPermissions());
    const exactScheduling = await exactSchedulingState(plugin, platform);
    return {
      platform: platform === "android" ? "native-android" : "native-ios",
      permission,
      displayAvailable: true,
      backgroundSchedulingAvailable: true,
      exactScheduling,
      message:
        platform === "android" && exactScheduling === "unavailable"
          ? "Android can schedule prayer alerts, but exact alarms are off. Delivery may be inexact until you allow Alarms & reminders."
          : "This installed app can schedule device-local prayer alerts for the next seven days.",
    };
  } catch {
    return {
      platform: platform === "android" ? "native-android" : "native-ios",
      permission: "unsupported",
      displayAvailable: false,
      backgroundSchedulingAvailable: false,
      exactScheduling:
        platform === "android" ? "unavailable" : "not-applicable",
      message: "The native notification service is currently unavailable.",
    };
  }
}

async function ensureChannels(
  plugin: LocalNotificationsPlugin,
  platform: NativePlatform,
  desired: readonly PrayerNotificationEntry[],
): Promise<void> {
  if (platform !== "android" || desired.length === 0) {
    return;
  }

  await plugin.createChannel({
    id: PRAYER_DEFAULT_CHANNEL_ID,
    name: "Prayer alerts",
    description: "User-selected Salah time notifications",
    importance: 4,
    visibility: 1,
    vibration: true,
  });

  const cueIds = new Set(
    desired
      .map((entry) => findApprovedAdhanCue(entry.adhanCueId))
      .filter((cue) => cue !== null)
      .map((cue) => cue.id),
  );

  for (const cueId of cueIds) {
    const cue = findApprovedAdhanCue(cueId);
    if (!cue) continue;
    await plugin.createChannel({
      id: `prayer-adhan-${cue.id}-v1`,
      name: `Prayer alerts — ${cue.displayName}`,
      description: "User-selected Salah alerts with an approved short Adhan cue",
      sound: cue.fileName,
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  }
}

export function createNativePrayerNotificationPlatform(
  platform: NativePlatform,
): PrayerNotificationPlatform {
  return {
    async getCapabilities() {
      try {
        return capabilities(await localNotificationsPlugin(), platform);
      } catch {
        return {
          platform: platform === "android" ? "native-android" : "native-ios",
          permission: "unsupported",
          displayAvailable: false,
          backgroundSchedulingAvailable: false,
          exactScheduling:
            platform === "android" ? "unavailable" : "not-applicable",
          message: "The native notification service is currently unavailable.",
        };
      }
    },

    async requestPermission() {
      try {
        const plugin = await localNotificationsPlugin();
        const current = await plugin.checkPermissions();
        if (normalizedPermission(current) === "prompt") {
          await plugin.requestPermissions();
        }
        return capabilities(plugin, platform);
      } catch {
        return this.getCapabilities();
      }
    },

    async reconcile(
      desired: readonly PrayerNotificationEntry[],
    ): Promise<PrayerNotificationOperationResult> {
      try {
        const plugin = await localNotificationsPlugin();
        const currentCapabilities = await capabilities(plugin, platform);

        if (
          desired.length > 0 &&
          currentCapabilities.permission !== "granted"
        ) {
          return {
            ok: false,
            message: "Notification permission is not granted.",
          };
        }

        await ensureChannels(plugin, platform, desired);

        const pending = (await plugin.getPending()).notifications
          .map(pendingNativePrayerNotification)
          .filter((entry): entry is PendingPrayerNotification => entry !== null);
        const reconciliation = reconcilePrayerNotificationSchedule(
          desired,
          pending,
        );

        if (reconciliation.cancelIds.length > 0) {
          await plugin.cancel({
            notifications: reconciliation.cancelIds.map((id) => ({ id })),
          });
        }

        if (reconciliation.add.length > 0) {
          await plugin.schedule({
            notifications: reconciliation.add.map((entry) =>
              toNativePrayerNotification(
                entry,
                currentCapabilities.exactScheduling,
              ),
            ),
          });
        }

        return {
          ok: true,
          message:
            currentCapabilities.exactScheduling === "unavailable"
              ? "Prayer alerts synchronized with Android's inexact scheduling fallback."
              : "Prayer alerts synchronized on this device.",
          scheduled: reconciliation.add.length,
          cancelled: reconciliation.cancelIds.length,
          retained: reconciliation.retain.length,
        };
      } catch (error) {
        return {
          ok: false,
          message: prayerNotificationErrorMessage(
            error,
            "The device could not synchronize prayer alerts.",
          ),
        };
      }
    },

    async sendTest(): Promise<PrayerNotificationOperationResult> {
      try {
        const plugin = await localNotificationsPlugin();
        const currentCapabilities = await capabilities(plugin, platform);
        if (currentCapabilities.permission !== "granted") {
          return {
            ok: false,
            message: "Allow notifications before sending a test.",
          };
        }

        await ensureChannels(plugin, platform, [
          {
            id: PRAYER_TEST_NOTIFICATION_ID,
            salah: "fajr",
            scheduledAt: Date.now(),
            localDate: "test",
            title: "Prayer notification test",
            body: "Prayer notification test from Mushaf Companion.",
            alertMode: "notification",
            adhanCueId: null,
            navigationTarget: "prayer",
          },
        ]);
        await plugin.schedule({
          notifications: [
            {
              id: PRAYER_TEST_NOTIFICATION_ID,
              title: "Prayer notification test",
              body: "Prayer notification test from Mushaf Companion.",
              sound: "default",
              channelId: PRAYER_DEFAULT_CHANNEL_ID,
              autoCancel: true,
              foreground: true,
              isExactNotification: false,
              extra: {
                owner: "mushaf-companion:prayer-test-v2",
                navigationTarget: "prayer",
              },
            },
          ],
        });

        return { ok: true, message: "Test notification sent." };
      } catch (error) {
        return {
          ok: false,
          message: prayerNotificationErrorMessage(
            error,
            "The device could not display the test notification.",
          ),
        };
      }
    },

    async openExactAlarmSettings(): Promise<PrayerNotificationOperationResult> {
      if (platform !== "android") {
        return {
          ok: false,
          message: "Exact-alarm settings apply only to Android.",
        };
      }

      try {
        const plugin = await localNotificationsPlugin();
        await plugin.changeExactNotificationSetting();
        return {
          ok: true,
          message: "Android Alarms & reminders settings opened.",
        };
      } catch {
        return {
          ok: false,
          message: "Android could not open the exact-alarm setting.",
        };
      }
    },

    async addPrayerActionListener(listener: () => void) {
      try {
        const plugin = await localNotificationsPlugin();
        const handle = await plugin.addListener(
          "localNotificationActionPerformed",
          (action) => {
            const extra = action.notification.extra;
            if (
              extra &&
              typeof extra === "object" &&
              extra.navigationTarget === "prayer"
            ) {
              listener();
            }
          },
        );
        return () => handle.remove();
      } catch {
        return null;
      }
    },
  };
}
