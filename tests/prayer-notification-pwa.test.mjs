import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicWorker = new URL("../public/sw.js", import.meta.url);
const pagesWorker = new URL("../pages-static/sw.js", import.meta.url);
const webAdapter = new URL("../app/prayer-notification-web.ts", import.meta.url);
const lifecycle = new URL("../app/prayer-notification-lifecycle.tsx", import.meta.url);

test("both canonical service-worker sources preserve caching and add prayer click navigation", async () => {
  for (const source of [publicWorker, pagesWorker]) {
    const code = await readFile(source, "utf8");
    assert.match(code, /addEventListener\("install"/);
    assert.match(code, /addEventListener\("activate"/);
    assert.match(code, /addEventListener\("fetch"/);
    assert.match(code, /caches\.match/);
    assert.match(code, /addEventListener\("notificationclick"/);
    assert.match(code, /\.\/#prayer/);
    assert.match(code, /OPEN_PRAYER/);
    assert.match(code, /clients\.openWindow/);
  }
});

test("web layer does not claim a browser timer can schedule closed-app prayer alerts", async () => {
  const code = await readFile(webAdapter, "utf8");
  assert.match(code, /future Web Push infrastructure/);
  assert.match(code, /backgroundSchedulingAvailable: false/);
  assert.match(code, /notification\.onclick/);
  assert.match(code, /mushaf:open-prayer/);
  assert.doesNotMatch(code, /setTimeout|NotificationTrigger|periodicSync/);
});

test("startup lifecycle reconciles but never requests notification permission", async () => {
  const code = await readFile(lifecycle, "utf8");
  assert.match(code, /reconcileStoredPrayerSchedule/);
  assert.match(code, /visibilitychange/);
  assert.match(code, /addPrayerActionListener/);
  assert.doesNotMatch(code, /requestPrayerNotificationPermission|requestPermission/);
});
