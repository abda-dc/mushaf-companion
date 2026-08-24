import { Capacitor } from "@capacitor/core";
import type { PrayerNotificationEntry } from "./prayer-notification-scheduler.ts";
import { createNativePrayerNotificationPlatform } from "./prayer-notification-native.ts";
import { createWebPrayerNotificationPlatform } from "./prayer-notification-web.ts";

export type PrayerNotificationPermissionState =
  | "unsupported"
  | "prompt"
  | "granted"
  | "denied";

export type PrayerExactSchedulingState =
  | "available"
  | "unavailable"
  | "not-applicable";

export type PrayerNotificationPlatformKind =
  | "native-android"
  | "native-ios"
  | "web"
  | "unsupported";

export interface PrayerNotificationCapabilities {
  platform: PrayerNotificationPlatformKind;
  permission: PrayerNotificationPermissionState;
  displayAvailable: boolean;
  backgroundSchedulingAvailable: boolean;
  exactScheduling: PrayerExactSchedulingState;
  message: string;
}

export interface PrayerNotificationOperationResult {
  ok: boolean;
  message: string;
  scheduled?: number;
  cancelled?: number;
  retained?: number;
}

export interface PrayerNotificationPlatform {
  getCapabilities(): Promise<PrayerNotificationCapabilities>;
  requestPermission(): Promise<PrayerNotificationCapabilities>;
  reconcile(
    desired: readonly PrayerNotificationEntry[],
  ): Promise<PrayerNotificationOperationResult>;
  sendTest(): Promise<PrayerNotificationOperationResult>;
  openExactAlarmSettings(): Promise<PrayerNotificationOperationResult>;
  addPrayerActionListener(
    listener: () => void,
  ): Promise<(() => Promise<void>) | null>;
}

let platformPromise: Promise<PrayerNotificationPlatform> | null = null;

async function createPlatform(): Promise<PrayerNotificationPlatform> {
  try {
    if (Capacitor.isNativePlatform()) {
      const platform = Capacitor.getPlatform();
      if (platform === "android" || platform === "ios") {
        return createNativePrayerNotificationPlatform(platform);
      }
    }

    return createWebPrayerNotificationPlatform();
  } catch {
    return createWebPrayerNotificationPlatform();
  }
}

export function getPrayerNotificationPlatform(): Promise<PrayerNotificationPlatform> {
  platformPromise ??= createPlatform();
  return platformPromise;
}

export function resetPrayerNotificationPlatformForTests(): void {
  platformPromise = null;
}
