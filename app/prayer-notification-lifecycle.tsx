"use client";

import { useEffect } from "react";
import { loadPrayerPreferences } from "./prayer-preferences.ts";
import { synchronizePrayerNotifications } from "./prayer-notification-controller.ts";
import { getPrayerNotificationPlatform } from "./prayer-notification-platform.ts";

export const OPEN_PRAYER_EVENT = "mushaf:open-prayer";

function openPrayerArea(): void {
  if (window.location.hash !== "#prayer") {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#prayer`,
    );
  }
  window.dispatchEvent(new Event(OPEN_PRAYER_EVENT));
}

async function reconcileStoredPrayerSchedule(): Promise<void> {
  const preferences = loadPrayerPreferences();
  const coordinates =
    preferences.rememberLocation && preferences.rememberedLocation
      ? preferences.rememberedLocation
      : null;
  await synchronizePrayerNotifications({ preferences, coordinates });
}

export function PrayerNotificationLifecycle() {
  useEffect(() => {
    let disposed = false;
    let removeNativeListener: (() => Promise<void>) | null = null;

    void getPrayerNotificationPlatform().then(async (platform) => {
      if (disposed) return;
      removeNativeListener = await platform.addPrayerActionListener(
        openPrayerArea,
      );
    });

    void reconcileStoredPrayerSchedule();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void reconcileStoredPrayerSchedule();
      }
    };
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "OPEN_PRAYER") {
        openPrayerArea();
      }
    };
    const serviceWorker =
      "serviceWorker" in navigator ? navigator.serviceWorker : null;

    document.addEventListener("visibilitychange", handleVisibility);
    serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerMessage,
      );
      if (removeNativeListener) {
        void removeNativeListener();
      }
    };
  }, []);

  return null;
}
