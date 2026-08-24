export type AdhanAssetPurpose = "notification-cue" | "full-playback";

export interface AdhanAssetRecord {
  id: string;
  displayName: string;
  purpose: AdhanAssetPurpose;
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
 * No redistributable Adhan recording has been approved for the project yet.
 * Keeping the registry typed and empty makes the system notification sound the
 * honest operational fallback without weakening future asset governance.
 */
export const APPROVED_ADHAN_ASSETS: readonly AdhanAssetRecord[] =
  Object.freeze([]);

export function findApprovedAdhanCue(
  assetId: unknown,
): AdhanAssetRecord | null {
  if (typeof assetId !== "string") {
    return null;
  }

  return (
    APPROVED_ADHAN_ASSETS.find(
      (asset) =>
        asset.id === assetId &&
        asset.purpose === "notification-cue" &&
        asset.durationSeconds < 30,
    ) ?? null
  );
}
