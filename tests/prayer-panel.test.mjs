import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const panelUrl = new URL("../app/prayer-panel.tsx", import.meta.url);

async function panelCode() {
  return readFile(panelUrl, "utf8");
}

test("PrayerPanel follows the existing modal panel contract", async () => {
  const code = await panelCode();

  assert.match(code, /className="panel-shell prayer-panel"/);
  assert.match(code, /role="dialog"/);
  assert.match(code, /aria-modal="true"/);
  assert.match(code, /event\.key === "Escape"/);
  assert.match(code, /onClose\(\)/);
});

test("location is requested only through an explicit UI action", async () => {
  const code = await panelCode();

  assert.match(code, /"Use my location"/);
  assert.match(code, /async function handleUseMyLocation/);
  assert.match(code, /await requestPrayerLocation\(\)/);

  assert.doesNotMatch(
    code,
    /useEffect\(\(\) =>\s*\{\s*requestPrayerLocation\(/,
  );

  assert.doesNotMatch(code, /navigator\.geolocation/);
});

test("panel supports private opt-in location memory", async () => {
  const code = await panelCode();

  assert.match(code, /Remember approximate location on this device/);
  assert.match(code, /rememberPrayerLocation/);
  assert.match(code, /forgetPrayerLocation/);
  assert.match(code, /savePrayerPreferences/);
});

test("Sunrise is visibly distinguished from the five Salah prayers", async () => {
  const code = await panelCode();

  assert.match(
    code,
    /\{ name: "sunrise", label: "Sunrise", isSalah: false \}/,
  );

  assert.match(
    code,
    /Solar marker .* not a Salah or Adhan target/,
  );

  const alertRows = code.match(/const SALAH_NOTIFICATION_ROWS:[\s\S]*?\];/)?.[0] ?? "";
  assert.doesNotMatch(alertRows, /sunrise/i);
});

test("notification permission is opt-in and five-Salah controls are accessible", async () => {
  const code = await panelCode();

  assert.match(code, /Adhan &amp; notifications/i);
  assert.match(code, /aria-label="Enable prayer notifications"/);
  assert.match(code, /Permission is requested only when you turn this on/);
  assert.match(code, /requestPrayerNotificationPermission/);
  assert.match(code, /Send test notification/);
  assert.match(code, /role="status" aria-live="polite"/);
  assert.match(code, /Open Alarms &amp; reminders/);
  assert.doesNotMatch(
    code,
    /useEffect\([\s\S]{0,180}requestPrayerNotificationPermission\(/,
  );
});

test("panel exposes calculation method and Asr method controls", async () => {
  const code = await panelCode();

  assert.match(code, /Calculation method/);
  assert.match(code, /PRAYER_CALCULATION_METHODS\.map/);
  assert.match(code, /Asr calculation/);
  assert.match(code, /Standard \(Shafi, Maliki, Hanbali\)/);
  assert.match(code, />Hanafi</);
});

test("panel exposes bounded manual minute adjustments", async () => {
  const code = await panelCode();

  assert.match(code, /Manual adjustments/);
  assert.match(code, /min="-30"/);
  assert.match(code, /max="30"/);
  assert.match(code, /step="1"/);
});

test("next prayer supports tomorrow rollover and countdown", async () => {
  const code = await panelCode();

  assert.match(code, /getNextPrayer\(today, now, tomorrow\)/);
  assert.match(code, /nextPrayer\.isTomorrow/);
  assert.match(code, /formatCountdown/);
});

test("Qibla uses the verified numeric calculation as the source of truth", async () => {
  const code = await panelCode();

  assert.match(code, /qiblaDegrees/);
  assert.match(code, /qiblaCardinalDirection/);
  assert.match(code, /measured clockwise from true north/);
});

test("PrayerPanel has no M9R, Hadith, Quran reader, or M11 dependency", async () => {
  const code = await panelCode();

  assert.doesNotMatch(code, /islamic-reference/);
  assert.doesNotMatch(code, /hadith-/);
  assert.doesNotMatch(code, /quran-/);
  assert.doesNotMatch(code, /reading-registry/);
  assert.doesNotMatch(code, /qiraat/);
});

test("full Adhan playback is explicit, foreground-only, and base-path safe", async () => {
  const code = await panelCode();

  assert.match(code, /APPROVED_FULL_ADHAN_ASSETS/);
  assert.match(code, /findApprovedFullAdhan/);
  assert.match(code, /appPath\(asset\.fileName\)/);
  assert.match(code, /Play Regular Adhan/);
  assert.match(code, /Play Fajr Adhan/);
  assert.match(code, />\s*Stop\s*</);
  assert.match(code, /<audio/);
  assert.match(code, /preload="none"/);
  assert.doesNotMatch(code, /autoPlay/);
  assert.match(code, /system\s+notification sound/);
  assert.match(code, /Islamic Center\s+Malm/);
  assert.match(code, /CC BY 3\.0/);
});

test("Adhan playback stops existing Quran recitation before starting", async () => {
  const panel = await panelCode();
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(panel, /onBeforeAdhanPlayback\?\.\(\)/);
  assert.match(
    page,
    /onBeforeAdhanPlayback=\{\(\) => stopPlayback\(false\)\}/,
  );

  const stopIndex = panel.indexOf("onBeforeAdhanPlayback?.()");
  const playIndex = panel.indexOf("await audio.play()");

  assert.ok(stopIndex >= 0);
  assert.ok(playIndex > stopIndex);
});
