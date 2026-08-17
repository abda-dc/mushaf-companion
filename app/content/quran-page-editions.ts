import { CONTENT_MANIFEST } from "../content-manifest.ts";
import {
  DEFAULT_READING_ID,
  getReadingById,
  type ReadingId,
} from "../reading-registry.mjs";

export type QuranVerseTextField = "text_uthmani";
export type QuranWordTextField = "text_qpc_hafs";

export interface QuranPageEditionDefinition {
  readonly id: string;
  readonly readingId: ReadingId;
  readonly provider: "quran-foundation";
  readonly mushafId: number;
  readonly pages: number;
  readonly lineCount: number;
  readonly verseTextField: QuranVerseTextField;
  readonly wordTextField: QuranWordTextField;
  readonly tajweedRoute: string;
  readonly tajweedPageParameter: string;
  readonly manifestRevision: string;
  readonly arabicResourceId: string;
  readonly tajweedResourceId: string;
  readonly translationResourceId: number;
  readonly transliterationResourceId: number;
}

export class QuranPageEditionError extends Error {
  readonly code: "unsupported_reading" | "edition_unavailable";

  constructor(
    message: string,
    code: "unsupported_reading" | "edition_unavailable",
  ) {
    super(message);
    this.name = "QuranPageEditionError";
    this.code = code;
  }
}

const hafsAnAsimEdition: QuranPageEditionDefinition = Object.freeze({
  id: CONTENT_MANIFEST.edition.id,
  readingId: DEFAULT_READING_ID,
  provider: "quran-foundation",
  mushafId: CONTENT_MANIFEST.edition.mushafId,
  pages: CONTENT_MANIFEST.edition.pages,
  lineCount: 15,
  verseTextField: "text_uthmani",
  wordTextField: "text_qpc_hafs",
  tajweedRoute: "quran/verses/uthmani_tajweed",
  tajweedPageParameter: "page_number",
  manifestRevision: CONTENT_MANIFEST.revision,
  arabicResourceId: CONTENT_MANIFEST.resources.arabic.id,
  tajweedResourceId: CONTENT_MANIFEST.resources.tajweed.id,
  translationResourceId: CONTENT_MANIFEST.resources.translation.id,
  transliterationResourceId: CONTENT_MANIFEST.resources.transliteration.id,
});

export const QURAN_PAGE_EDITIONS = Object.freeze([hafsAnAsimEdition]);

const EDITION_BY_READING_ID = new Map<ReadingId, QuranPageEditionDefinition>(
  QURAN_PAGE_EDITIONS.map((edition) => [edition.readingId, edition]),
);

export function resolveQuranPageEdition(readingId: string): QuranPageEditionDefinition {
  const reading = getReadingById(readingId);
  if (!reading) {
    throw new QuranPageEditionError(
      "Quran reading '" + readingId + "' is not supported.",
      "unsupported_reading",
    );
  }

  const edition = EDITION_BY_READING_ID.get(reading.id);
  if (!edition) {
    throw new QuranPageEditionError(
      "Quran page content is not available for reading '" + reading.id + "'.",
      "edition_unavailable",
    );
  }

  return edition;
}

export function getDefaultQuranPageEdition(): QuranPageEditionDefinition {
  return resolveQuranPageEdition(DEFAULT_READING_ID);
}
