export type ReadingId = "hafs-an-asim";
export type QiraahId = "asim";
export type RiwayahId = "hafs";

export interface QuranReadingDefinition {
  readonly id: ReadingId;
  readonly qiraah: QiraahId;
  readonly riwayah: RiwayahId;
  readonly label: string;
  readonly arabicLabel: string;
}

export class ReadingDefinitionValidationError extends TypeError {}

export const DEFAULT_READING_ID: ReadingId;
export const QURAN_READINGS: readonly QuranReadingDefinition[];
export const READING_REGISTRY: readonly QuranReadingDefinition[];

export function validateReadingDefinition(definition: unknown): QuranReadingDefinition;
export function isValidReadingDefinition(definition: unknown): definition is QuranReadingDefinition;
export function getReadingById(id: string): QuranReadingDefinition | undefined;
export function isSupportedReadingId(id: unknown): id is ReadingId;
export function getDefaultReading(): QuranReadingDefinition;
