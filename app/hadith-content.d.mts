export type HadithActivationState =
  | "metadata-only"
  | "translation-approved"
  | "arabic-approved"
  | "fully-approved"
  | "external-only"
  | "pending-rights"
  | "unavailable";

export type HadithRightsPolicy =
  | "approved-redistribution"
  | "metadata-only"
  | "external-only"
  | "pending-review";

export type HadithAlternateScheme =
  | "collection"
  | "book"
  | "in-book"
  | "edition"
  | "legacy"
  | "provider"
  | string;

export interface HadithAlternateReference {
  readonly scheme: HadithAlternateScheme;
  readonly value: string;
  readonly label: string;
}

export interface HadithGrading {
  readonly grade: string;
  readonly grader: string;
  readonly reference: string;
}

export interface HadithSourceRecord {
  readonly provider: string;
  readonly providerRecordId: string;
  readonly sourceUrl: string;
  readonly grading: HadithGrading | null;
  readonly rightsPolicy: HadithRightsPolicy;
  readonly attribution: string | null;
}

export interface HadithIntegrity {
  readonly algorithm: "SHA-256";
  readonly checksum: string;
  readonly verified?: boolean;
}

export interface HadithProvenance {
  readonly provider: string;
  readonly providerRecordId: string;
  readonly sourceUrl: string;
  readonly sourceVersion: string | null;
  readonly recordedAt: string | null;
  readonly retrievedAt: string | null;
  readonly rightsPolicy: HadithRightsPolicy;
  readonly attribution: string;
  readonly integrity: HadithIntegrity | null;
}

export interface HadithArabicText {
  readonly text: string;
  readonly sourceUrl: string | null;
  readonly provenance: HadithProvenance;
  readonly status: HadithActivationState;
}

export interface HadithTranslationEntry {
  readonly language: string;
  readonly text: string;
  readonly provider: string;
  readonly providerRecordId: string;
  readonly version: string;
  readonly rightsPolicy: HadithRightsPolicy;
  readonly sourceUrl: string;
  readonly checksum: string | null;
  readonly status: HadithActivationState;
  readonly attribution: string | null;
}

export interface HadithTextContent {
  readonly arabic: HadithArabicText | null;
  readonly translations: readonly HadithTranslationEntry[];
}

export interface HadithRecord {
  readonly id: string;
  readonly collectionId: string;
  readonly canonicalNumber: string;
  readonly canonicalLabel: string;
  readonly bookNumber: string | null;
  readonly bookName: string | null;
  readonly chapterNumber: string | null;
  readonly chapterName: string | null;
  readonly alternateReferences: readonly HadithAlternateReference[];
  readonly narrator: string | null;
  readonly text: HadithTextContent | null;
  readonly sourceRecords: readonly HadithSourceRecord[];
  readonly provenance: HadithProvenance | null;
  readonly activation: HadithActivationState;
}

export interface HadithValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export interface HadithDatasetManifest {
  readonly provider: string;
  readonly language: string;
  readonly datasetVersion: string;
  readonly lastUpdated: string;
  readonly sourceUrl: string;
  readonly updateCheckUrl: string;
  readonly sourceFileName: string;
  readonly rightsPolicy: HadithRightsPolicy;
  readonly attribution: string;
  readonly contentScope: string;
  readonly workbookChecksum: string;
  readonly recordCount: number;
}

export const HADITH_CONTENT_SCHEMA_VERSION: number;
export const HADITH_ACTIVATION_STATES: ReadonlySet<HadithActivationState>;
export const HADITH_RIGHTS_POLICIES: ReadonlySet<HadithRightsPolicy>;
export const HADITH_ALTERNATE_SCHEMES: ReadonlySet<HadithAlternateScheme>;

export const HADEETHENC_DATASET_MANIFEST: HadithDatasetManifest;
export const SEEDED_HADITH_RECORDS: readonly HadithRecord[];

export function validateHadithRecord(
  record: unknown,
  validCollectionIds?: ReadonlySet<string>
): HadithValidationResult;

export function assertHadithRecord(
  record: unknown,
  validCollectionIds?: ReadonlySet<string>
): asserts record is HadithRecord;

export function normalizeHadithRecord(
  record: unknown,
  validCollectionIds?: ReadonlySet<string>
): HadithRecord;

export function getHadithRecord(id: string): HadithRecord | null;
export function listHadithRecords(): readonly HadithRecord[];
