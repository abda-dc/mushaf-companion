import type {
  HadithCollectionDefinition,
} from "./hadith-registry";
import type {
  HadithRecord,
  HadithSourceRecord,
} from "./hadith-content";

export type HadithResolutionStatus =
  | "resolved-internal"
  | "resolved-translation-approved"
  | "resolved-arabic-approved"
  | "resolved-metadata-only"
  | "external-fallback"
  | "not-found"
  | "ambiguous";

export interface HadithResolutionResult {
  readonly status: HadithResolutionStatus;
  readonly target: string | null;
  readonly record: HadithRecord | null;
  readonly collection: HadithCollectionDefinition | null;
  readonly sourceRecord: HadithSourceRecord | null;
  readonly externalUrl: string | null;
  readonly reason: string | null;
}

export function formatHadithTarget(collectionId: string, number: string): string;

export function parseHadithTarget(
  target: unknown
): { readonly collectionId: string; readonly number: string } | null;

export function getHadithSourceRecord(
  record: HadithRecord,
  provider: string
): HadithSourceRecord | null;

export function resolveHadithReference(reference: {
  collectionId: string;
  number: string;
}): HadithResolutionResult;

export function resolveHadithReferenceByCanonicalLabel(
  label: string
): HadithResolutionResult;

export function searchHadithMetadata(query: string): readonly HadithRecord[];

export {
  getHadithCollection,
  listHadithCollections,
} from "./hadith-registry";

export {
  getHadithRecord,
  listHadithRecords,
} from "./hadith-content";
