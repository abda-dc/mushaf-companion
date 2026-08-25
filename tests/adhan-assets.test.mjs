import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  APPROVED_ADHAN_ASSETS,
  APPROVED_ADHAN_CUES,
  APPROVED_FULL_ADHAN_ASSETS,
  findApprovedAdhanCue,
  findApprovedFullAdhan,
  isFullPlaybackAdhanAsset,
  isNotificationCueAsset,
} from "../app/adhan-assets.ts";

function asset(overrides = {}) {
  return {
    id: "test-adhan",
    displayName: "Test Adhan",
    purpose: "full-playback",
    variant: "standard",
    fileName: "test.mp3",
    mimeType: "audio/mpeg",
    durationSeconds: 154,
    attribution: "Test attribution",
    license: "Test license",
    provenance: "Test provenance",
    revision: "test-v1",
    checksumSha256:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ...overrides,
  };
}

test("full Adhan recordings are never eligible as notification cues", () => {
  const full = asset();

  assert.equal(isFullPlaybackAdhanAsset(full), true);
  assert.equal(isNotificationCueAsset(full), false);
});

test("notification cues must be shorter than 30 seconds", () => {
  assert.equal(
    isNotificationCueAsset(
      asset({
        purpose: "notification-cue",
        durationSeconds: 29.9,
      }),
    ),
    true,
  );

  assert.equal(
    isNotificationCueAsset(
      asset({
        purpose: "notification-cue",
        durationSeconds: 30,
      }),
    ),
    false,
  );

  assert.equal(
    isNotificationCueAsset(
      asset({
        purpose: "notification-cue",
        durationSeconds: 154,
      }),
    ),
    false,
  );
});

test("production registry contains standard and Fajr full-playback assets only", () => {
  assert.equal(APPROVED_ADHAN_ASSETS.length, 2);
  assert.equal(APPROVED_FULL_ADHAN_ASSETS.length, 2);
  assert.equal(APPROVED_ADHAN_CUES.length, 0);

  assert.equal(findApprovedFullAdhan("standard")?.id,
    "adhan-standard-adam-synagda-2022");
  assert.equal(findApprovedFullAdhan("fajr")?.id,
    "adhan-fajr-islamic-center-malmo-2012");

  assert.equal(findApprovedAdhanCue(
    "adhan-standard-adam-synagda-2022"), null);
  assert.equal(findApprovedAdhanCue(
    "adhan-fajr-islamic-center-malmo-2012"), null);
});

test("production registry pins the reviewed runtime checksums", () => {
  assert.equal(
    findApprovedFullAdhan("standard")?.checksumSha256,
    "7BA5B33B89B1A136F09F08DAC28E99F6BFB6BEAAA55AAC77F2C863EA9FCF2807",
  );

  assert.equal(
    findApprovedFullAdhan("fajr")?.checksumSha256,
    "080D1203872434E77E162D10CC8DA6321F60AC2328C8B13AE4BC3371449C0284",
  );
});

test("PrayerPanel notification UI consumes only the cue registry", async () => {
  const panel = await readFile(
    new URL("../app/prayer-panel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /APPROVED_ADHAN_CUES/);
  assert.doesNotMatch(panel, /APPROVED_ADHAN_ASSETS/);
});