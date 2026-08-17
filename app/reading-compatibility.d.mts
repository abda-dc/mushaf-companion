import type { ReciterDefinition } from "./reciter-registry.mjs";
import type { QuranReadingDefinition } from "./reading-registry.mjs";

export type ReciterReference = string | Pick<ReciterDefinition, "id">;
export type ReadingReference = string | QuranReadingDefinition;

export class ReadingCompatibilityError extends Error {
  readonly code: "unsupported_reading" | "unknown_reciter" | "incompatible_riwayah";
}

export function isReciterCompatibleWithReading(
  reciter: ReciterReference,
  reading: ReadingReference,
): boolean;
export function assertReciterCompatibleWithReading(
  reciter: ReciterReference,
  reading: ReadingReference,
): ReciterDefinition;
export function resolveCompatibleReciters(reading: ReadingReference): ReciterDefinition[];
export const getCompatibleReciters: typeof resolveCompatibleReciters;
