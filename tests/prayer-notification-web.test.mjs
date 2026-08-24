import assert from "node:assert/strict";
import test from "node:test";
import { createWebPrayerNotificationPlatform } from "../app/prayer-notification-web.ts";

function environment({ secure = true, permission = "default", serviceWorker = true } = {}) {
  let currentPermission = permission;
  let permissionRequests = 0;
  const shown = [];
  const fallbacks = [];
  return {
    shown,
    fallbacks,
    get permissionRequests() {
      return permissionRequests;
    },
    value: {
      secureContext: secure,
      notification: permission === null
        ? null
        : {
            get permission() {
              return currentPermission;
            },
            async requestPermission() {
              permissionRequests += 1;
              currentPermission = "granted";
              return currentPermission;
            },
            showFallback(title, options) {
              fallbacks.push({ title, options });
            },
          },
      serviceWorker: serviceWorker
        ? {
            async getRegistration() {
              return {
                async showNotification(title, options) {
                  shown.push({ title, options });
                },
              };
            },
          }
        : null,
    },
  };
}

test("web adapter checks capability without automatically requesting permission", async () => {
  const env = environment();
  const platform = createWebPrayerNotificationPlatform(env.value);
  const capabilities = await platform.getCapabilities();
  assert.equal(capabilities.permission, "prompt");
  assert.equal(capabilities.displayAvailable, true);
  assert.equal(capabilities.backgroundSchedulingAvailable, false);
  assert.equal(env.permissionRequests, 0);
});

test("web permission request occurs only through the explicit request method", async () => {
  const env = environment();
  const platform = createWebPrayerNotificationPlatform(env.value);
  const capabilities = await platform.requestPermission();
  assert.equal(capabilities.permission, "granted");
  assert.equal(env.permissionRequests, 1);
});

test("unsupported and denied browser paths are safe", async () => {
  const unsupported = environment({ secure: false });
  const unsupportedPlatform = createWebPrayerNotificationPlatform(unsupported.value);
  assert.equal((await unsupportedPlatform.getCapabilities()).permission, "unsupported");
  assert.equal((await unsupportedPlatform.sendTest()).ok, false);

  const denied = environment({ permission: "denied" });
  const deniedPlatform = createWebPrayerNotificationPlatform(denied.value);
  assert.equal((await deniedPlatform.requestPermission()).permission, "denied");
  assert.equal(denied.permissionRequests, 0);
});

test("web test notification uses service-worker display and prayer navigation metadata", async () => {
  const env = environment({ permission: "granted" });
  const platform = createWebPrayerNotificationPlatform(env.value);
  const result = await platform.sendTest();
  assert.equal(result.ok, true);
  assert.equal(env.shown.length, 1);
  assert.equal(env.shown[0].title, "Prayer notification test");
  assert.equal(env.shown[0].options.data.navigationTarget, "prayer");
  assert.equal(env.fallbacks.length, 0);
});

test("web test can fall back to the Notification constructor without claiming background scheduling", async () => {
  const env = environment({ permission: "granted", serviceWorker: false });
  const platform = createWebPrayerNotificationPlatform(env.value);
  const result = await platform.sendTest();
  assert.equal(result.ok, true);
  assert.equal(env.fallbacks.length, 1);
  assert.equal((await platform.reconcile([])).ok, false);
});
