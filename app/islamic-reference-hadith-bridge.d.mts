import type { HadithResolution } from "./hadith-resolver.mjs";

export type IslamicReferenceHadithBridgeStatus =
  | "resolved"
  | "not-found"
  | "invalid-reference"
  | "source-mismatch"
  | "canonical-mismatch";

export interface IslamicReferenceHadithBridgeResult {
  readonly status: IslamicReferenceHadithBridgeStatus;
  readonly target: string | null;
  readonly hadithResolution: HadithResolution | null;
  readonly externalFallbackUrl: string | null;
  readonly reason: string | null;
}

export function resolveIslamicReferenceHadith(
  reference: unknown
): IslamicReferenceHadithBridgeResult;

export function getIslamicReferenceHadithTarget(
  reference: unknown
): string | null;
