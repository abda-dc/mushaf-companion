export type HadithCollectionStatus = "planned" | "metadata-ready" | "content-ready";

export type HadithContentAvailability = "metadata-only" | "partial" | "complete";

export interface HadithCollectionDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly arabicName: string | null;
  readonly shortName: string;
  readonly status: HadithCollectionStatus;
  readonly contentAvailability: HadithContentAvailability;
  readonly description: string | null;
}

export interface HadithCollectionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export const HADITH_REGISTRY_SCHEMA_VERSION: number;
export const HADITH_COLLECTION_STATUSES: ReadonlySet<HadithCollectionStatus>;
export const HADITH_CONTENT_AVAILABILITY: ReadonlySet<HadithContentAvailability>;
export const CORE_HADITH_COLLECTION_IDS: readonly string[];

export const HADITH_COLLECTIONS: readonly HadithCollectionDefinition[];

export function deepFreeze<T>(value: T): T;

export function validateHadithCollectionDefinition(collection: unknown): HadithCollectionValidationResult;
export function assertHadithCollectionDefinition(collection: unknown): asserts collection is HadithCollectionDefinition;

export function validateHadithCollectionRegistry(registry: unknown): HadithCollectionValidationResult;
export function assertHadithCollectionRegistry(registry: unknown): asserts registry is readonly HadithCollectionDefinition[];

export function normalizeHadithCollectionDefinition(collection: unknown): HadithCollectionDefinition;
export function normalizeHadithCollectionRegistry(registry: unknown): readonly HadithCollectionDefinition[];

export function getHadithCollection(id: string): HadithCollectionDefinition | null;
export function listHadithCollections(): readonly HadithCollectionDefinition[];
