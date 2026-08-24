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