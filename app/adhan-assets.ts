export type AdhanAssetPurpose = "notification-cue" | "full-playback";
export type AdhanVariant = "standard" | "fajr";

export interface AdhanAssetRecord {
  id: string;
  displayName: string;
  purpose: AdhanAssetPurpose;
  variant: AdhanVariant;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
  attribution: string;
  license: string;
  provenance: string;
  revision: string;
  checksumSha256: string;
}

/**
 * Distribution registry for reviewed Adhan audio.
 *
 * Full-playback assets are foreground/user-initiated recordings and must never
 * be passed to the native notification sound APIs. Notification cues remain
 * separately constrained to purpose "notification-cue" and duration <30s.
 */
export const APPROVED_ADHAN_ASSETS: readonly AdhanAssetRecord[] =
  Object.freeze([
    {
      id: "adhan-standard-adam-synagda-2022",
      displayName: "Regular Adhan",
      purpose: "full-playback",
      variant: "standard",
      fileName: "audio/adhan/regular-adhan.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 154.017959,
      attribution:
        'Adam-synagda — "Beautiful adhan", dedicated under CC0 1.0 Universal.',
      license:
        "CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/",
      provenance:
        "Wikimedia Commons File:Beautiful adhan.ogg; source marked Own work by Adam-synagda. Original SHA-1 a1fa4fd942401922c5c3301816384aae86956522. Production derivative re-encoded to MP3 at 160 kbps with FFmpeg. Human listening/content review passed 2026-08-25.",
      revision:
        "wikimedia-a1fa4fd942401922c5c3301816384aae86956522-mp3-160k-2026-08-25",
      checksumSha256:
        "7BA5B33B89B1A136F09F08DAC28E99F6BFB6BEAAA55AAC77F2C863EA9FCF2807",
    },
    {
      id: "adhan-fajr-islamic-center-malmo-2012",
      displayName: "Fajr Adhan — Islamic Center Malmö",
      purpose: "full-playback",
      variant: "fajr",
      fileName: "audio/adhan/fajr-adhan.mp3",
      mimeType: "audio/mpeg",
      durationSeconds: 247.5535,
      attribution:
        "Islamic Center Malmö — Fajr azan at Malmö Mosque, 19 August 2012. CC BY 3.0.",
      license:
        "Creative Commons Attribution 3.0 Unported — https://creativecommons.org/licenses/by/3.0/",
      provenance:
        "Wikimedia Commons File:Eid al-Fitr Fajr azan at Malmö Mosque - 19 August 2012.webm; originally posted to YouTube by Islamic Center Malmö and license-confirmed by Wikimedia YouTubeReviewBot on 2020-02-12. Original SHA-1 bc75d5cee271efb67f03d3f35474a9362fce103f. Production derivative removes video, extracts the Opus audio, and re-encodes it to MP3 at 160 kbps with FFmpeg. Human listening/content review passed 2026-08-25. Wikimedia notes that its automated license check does not replace human review for possible derivative-work or other copyright issues.",
      revision:
        "wikimedia-bc75d5cee271efb67f03d3f35474a9362fce103f-mp3-160k-2026-08-25",
      checksumSha256:
        "080D1203872434E77E162D10CC8DA6321F60AC2328C8B13AE4BC3371449C0284",
    },
  ]);

export function isNotificationCueAsset(
  asset: AdhanAssetRecord,
): boolean {
  return (
    asset.purpose === "notification-cue" &&
    asset.durationSeconds > 0 &&
    asset.durationSeconds < 30
  );
}

export function isFullPlaybackAdhanAsset(
  asset: AdhanAssetRecord,
): boolean {
  return asset.purpose === "full-playback" && asset.durationSeconds > 0;
}

export const APPROVED_ADHAN_CUES: readonly AdhanAssetRecord[] =
  Object.freeze(APPROVED_ADHAN_ASSETS.filter(isNotificationCueAsset));

export const APPROVED_FULL_ADHAN_ASSETS: readonly AdhanAssetRecord[] =
  Object.freeze(APPROVED_ADHAN_ASSETS.filter(isFullPlaybackAdhanAsset));

export function findApprovedAdhanCue(
  assetId: unknown,
): AdhanAssetRecord | null {
  if (typeof assetId !== "string") {
    return null;
  }

  return (
    APPROVED_ADHAN_CUES.find((asset) => asset.id === assetId) ?? null
  );
}

export function findApprovedFullAdhan(
  variant: AdhanVariant,
): AdhanAssetRecord | null {
  return (
    APPROVED_FULL_ADHAN_ASSETS.find(
      (asset) => asset.variant === variant,
    ) ?? null
  );
}