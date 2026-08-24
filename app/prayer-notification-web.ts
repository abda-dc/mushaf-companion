import { appPath } from "./runtime-config.ts";
import type {
  PrayerNotificationCapabilities,
  PrayerNotificationOperationResult,
  PrayerNotificationPermissionState,
  PrayerNotificationPlatform,
} from "./prayer-notification-platform.ts";

interface WebNotificationApi {
  permission: NotificationPermission;
  requestPermission(): Promise<NotificationPermission>;
  showFallback(title: string, options: NotificationOptions): void;
}

interface WebServiceWorkerApi {
  getRegistration(): Promise<ServiceWorkerRegistration | undefined>;
}

export interface PrayerNotificationWebEnvironment {
  secureContext: boolean;
  notification: WebNotificationApi | null;
  serviceWorker: WebServiceWorkerApi | null;
}

function browserEnvironment(): PrayerNotificationWebEnvironment {
  const notification =
    typeof Notification === "undefined"
      ? null
      : {
          get permission() {
            return Notification.permission;
          },
          requestPermission: () => Notification.requestPermission(),
          showFallback: (title: string, options: NotificationOptions) => {
            const notification = new Notification(title, options);
            notification.onclick = () => {
              notification.close();
              window.focus();
              window.location.hash = "prayer";
              window.dispatchEvent(new Event("mushaf:open-prayer"));
            };
          },
        };

  const serviceWorker =
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? {
          getRegistration: () => navigator.serviceWorker.getRegistration(),
        }
      : null;

  return {
    secureContext:
      typeof window !== "undefined" && window.isSecureContext === true,
    notification,
    serviceWorker,
  };
}

function permissionState(
  environment: PrayerNotificationWebEnvironment,
): PrayerNotificationPermissionState {
  if (!environment.secureContext || !environment.notification) {
    return "unsupported";
  }

  switch (environment.notification.permission) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "prompt";
  }
}

function webCapabilities(
  environment: PrayerNotificationWebEnvironment,
): PrayerNotificationCapabilities {
  const permission = permissionState(environment);
  const displayAvailable = permission !== "unsupported";

  return {
    platform: displayAvailable ? "web" : "unsupported",
    permission,
    displayAvailable,
    backgroundSchedulingAvailable: false,
    exactScheduling: "not-applicable",
    message: displayAvailable
      ? "Browser notifications can show tests where supported. Closed-app scheduled prayer alerts require future Web Push infrastructure."
      : "Notifications are unavailable here. A secure browser context with notification support is required.",
  };
}

export function createWebPrayerNotificationPlatform(
  environment: PrayerNotificationWebEnvironment = browserEnvironment(),
): PrayerNotificationPlatform {
  return {
    async getCapabilities() {
      return webCapabilities(environment);
    },

    async requestPermission() {
      if (permissionState(environment) === "prompt") {
        try {
          await environment.notification?.requestPermission();
        } catch {
          // The normalized capability below is safe for blocked browser APIs.
        }
      }
      return webCapabilities(environment);
    },

    async reconcile() {
      return {
        ok: false,
        message:
          "Browsers cannot reliably schedule closed-app prayer alerts without a Web Push backend.",
      };
    },

    async sendTest(): Promise<PrayerNotificationOperationResult> {
      const capabilities = webCapabilities(environment);
      if (capabilities.permission !== "granted" || !environment.notification) {
        return {
          ok: false,
          message:
            capabilities.permission === "denied"
              ? "Notifications are blocked in browser settings."
              : "Allow notifications before sending a test.",
        };
      }

      const options: NotificationOptions = {
        body: "Prayer notification test from Mushaf Companion.",
        icon: appPath("web-app-manifest-192x192.png"),
        tag: "mushaf-prayer-test",
        data: {
          owner: "mushaf-companion:prayer-test-v2",
          navigationTarget: "prayer",
        },
      };

      try {
        const registration = await environment.serviceWorker?.getRegistration();
        if (registration) {
          await registration.showNotification(
            "Prayer notification test",
            options,
          );
        } else {
          environment.notification.showFallback(
            "Prayer notification test",
            options,
          );
        }

        return {
          ok: true,
          message: "Test notification sent.",
        };
      } catch {
        return {
          ok: false,
          message: "The browser could not display the test notification.",
        };
      }
    },

    async openExactAlarmSettings() {
      return {
        ok: false,
        message: "Exact-alarm settings apply only to the Android app.",
      };
    },

    async addPrayerActionListener() {
      return null;
    },
  };
}
