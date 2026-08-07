export const SOURCE_REGISTRY_SCHEMA_VERSION = 1;
export const EXPECTED_SURAH_COUNT = 114;
export const EXPECTED_AYAH_COUNT = 6236;

export const QURAN_CHAPTER_VERSE_COUNTS = Object.freeze([
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98,
  135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11,
  11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25,
  22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6,
  3, 5, 4, 5, 6,
]);

export type ContentKind = "quran_translation";
export type CandidateStatus = "approved_candidate" | "blocked" | "legacy_online";
export type ScriptCode = "Arab" | "Ethi" | "Latn";
export type TextDirection = "ltr" | "rtl";
export type RedistributionRight = "permitted_with_conditions" | "requires_permission" | "prohibited" | "unknown";
export type OfflineStorageRight = "permitted" | "temporary_only" | "prohibited" | "unknown";
export type ModificationRight = "prohibited" | "requires_permission" | "permitted" | "unknown";
export type CommercialUseStatus = "not_restricted_by_documented_terms" | "requires_permission" | "prohibited" | "unknown";

export interface TranslationCoverageReport {
  expectedSurahs: number;
  actualSurahs: number;
  expectedAyahs: number;
  actualAyahs: number;
  chapterVerseCounts: readonly number[];
  missingVerseKeys: readonly string[];
  duplicateVerseKeys: readonly string[];
  emptyVerseKeys: readonly string[];
  invalidVerseKeys: readonly string[];
  invalidScriptVerseKeys: readonly string[];
  validatedAt: string;
}

export interface TranslationSourceRegistryEntry {
  schemaVersion: number;
  sourceId: string;
  contentKind: ContentKind;
  enabled: boolean;
  candidateStatus: CandidateStatus;
  blockers: readonly string[];
  title: string;
  translator: readonly string[];
  responsibleOrganization: readonly string[];
  publisher: string | null;
  language: {
    name: string;
    bcp47: string;
    iso6393: string;
    script: ScriptCode;
    direction: TextDirection;
  };
  provider: {
    name: string;
    id: string;
    sourceUrl: string;
    packageUrl: string | null;
    checkForUpdatesUrl: string | null;
  };
  license: {
    name: string;
    url: string;
    documentedPermission: string;
    attribution: string;
    redistribution: RedistributionRight;
    offlineStorage: OfflineStorageRight;
    modification: ModificationRight;
    commercialUse: CommercialUseStatus;
  };
  edition: {
    name: string;
    version: string;
    revision: string;
    publishedAt: string | null;
    updatedAt: string | null;
  };
  coverage: TranslationCoverageReport;
  integrity: {
    algorithm: "SHA-256";
    rawFormat: "json" | "xml";
    rawChecksum: string;
    normalizedChecksum: string;
    normalizationVersion: string;
  };
  retrieval: {
    retrievedAt: string;
    url: string;
    etag: string | null;
    lastModified: string | null;
  };
}

export interface SourceValidationResult {
  valid: boolean;
  errors: readonly string[];
}

const SHA256 = /^[a-f0-9]{64}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;
const CONTENT_KINDS = new Set<ContentKind>(["quran_translation"]);
const CANDIDATE_STATUSES = new Set<CandidateStatus>(["approved_candidate", "blocked", "legacy_online"]);
const SCRIPTS = new Set<ScriptCode>(["Arab", "Ethi", "Latn"]);
const DIRECTIONS = new Set<TextDirection>(["ltr", "rtl"]);
const REDISTRIBUTION_RIGHTS = new Set<RedistributionRight>(["permitted_with_conditions", "requires_permission", "prohibited", "unknown"]);
const OFFLINE_RIGHTS = new Set<OfflineStorageRight>(["permitted", "temporary_only", "prohibited", "unknown"]);
const MODIFICATION_RIGHTS = new Set<ModificationRight>(["prohibited", "requires_permission", "permitted", "unknown"]);
const COMMERCIAL_STATUSES = new Set<CommercialUseStatus>(["not_restricted_by_documented_terms", "requires_permission", "prohibited", "unknown"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(parent: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = parent[key];
  if (!isRecord(value)) throw new Error(`Source registry field ${key} must be an object.`);
  return value;
}

function requireString(parent: Record<string, unknown>, key: string, allowEmpty = false): string {
  const value = parent[key];
  if (typeof value !== "string" || (!allowEmpty && !value.trim())) throw new Error(`Source registry field ${key} must be a non-empty string.`);
  return value;
}

function requireNullableString(parent: Record<string, unknown>, key: string): string | null {
  if (!(key in parent)) throw new Error(`Source registry field ${key} is required.`);
  const value = parent[key];
  if (value !== null && typeof value !== "string") throw new Error(`Source registry field ${key} must be a string or null.`);
  return value;
}

function requireStringArray(parent: Record<string, unknown>, key: string): readonly string[] {
  const value = parent[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`Source registry field ${key} must be a string array.`);
  return value;
}

function requireNumber(parent: Record<string, unknown>, key: string): number {
  const value = parent[key];
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`Source registry field ${key} must be a non-negative integer.`);
  return Number(value);
}

function requireIsoDate(value: string | null, field: string, errors: string[]): void {
  if (value !== null && !ISO_DATE.test(value)) errors.push(`${field} must be an ISO date or UTC timestamp.`);
}

function requireUrl(value: string | null, field: string, errors: string[]): void {
  if (value === null) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${field} must use HTTPS.`);
  } catch {
    errors.push(`${field} must be a valid URL.`);
  }
}

export function canonicalVerseKeys(): string[] {
  return QURAN_CHAPTER_VERSE_COUNTS.flatMap((count, chapterIndex) =>
    Array.from({ length: count }, (_, verseIndex) => `${chapterIndex + 1}:${verseIndex + 1}`),
  );
}

export function createDiscoveredSource(source: Omit<TranslationSourceRegistryEntry, "enabled">): TranslationSourceRegistryEntry {
  return { ...source, enabled: false };
}

export function assertSourceRegistryEntryShape(value: unknown): asserts value is TranslationSourceRegistryEntry {
  if (!isRecord(value)) throw new Error("Source registry entry must be an object.");
  if (requireNumber(value, "schemaVersion") !== SOURCE_REGISTRY_SCHEMA_VERSION) throw new Error("Unsupported source registry schema version.");
  requireString(value, "sourceId");
  if (!CONTENT_KINDS.has(requireString(value, "contentKind") as ContentKind)) throw new Error("Unsupported source registry content kind.");
  if (typeof value.enabled !== "boolean") throw new Error("Source registry field enabled must be a boolean.");
  if (!CANDIDATE_STATUSES.has(requireString(value, "candidateStatus") as CandidateStatus)) throw new Error("Unsupported candidate status.");
  requireStringArray(value, "blockers");
  requireString(value, "title");
  requireStringArray(value, "translator");
  requireStringArray(value, "responsibleOrganization");
  requireNullableString(value, "publisher");

  const language = requireRecord(value, "language");
  requireString(language, "name");
  requireString(language, "bcp47");
  requireString(language, "iso6393");
  if (!SCRIPTS.has(requireString(language, "script") as ScriptCode)) throw new Error("Unsupported source script.");
  if (!DIRECTIONS.has(requireString(language, "direction") as TextDirection)) throw new Error("Unsupported text direction.");

  const provider = requireRecord(value, "provider");
  requireString(provider, "name");
  requireString(provider, "id");
  requireString(provider, "sourceUrl");
  requireNullableString(provider, "packageUrl");
  requireNullableString(provider, "checkForUpdatesUrl");

  const license = requireRecord(value, "license");
  requireString(license, "name");
  requireString(license, "url");
  requireString(license, "documentedPermission", true);
  requireString(license, "attribution", true);
  if (!REDISTRIBUTION_RIGHTS.has(requireString(license, "redistribution") as RedistributionRight)) throw new Error("Unsupported redistribution status.");
  if (!OFFLINE_RIGHTS.has(requireString(license, "offlineStorage") as OfflineStorageRight)) throw new Error("Unsupported offline-storage status.");
  if (!MODIFICATION_RIGHTS.has(requireString(license, "modification") as ModificationRight)) throw new Error("Unsupported modification status.");
  if (!COMMERCIAL_STATUSES.has(requireString(license, "commercialUse") as CommercialUseStatus)) throw new Error("Unsupported commercial-use status.");

  const edition = requireRecord(value, "edition");
  requireString(edition, "name");
  requireString(edition, "version", true);
  requireString(edition, "revision", true);
  requireNullableString(edition, "publishedAt");
  requireNullableString(edition, "updatedAt");

  const coverage = requireRecord(value, "coverage");
  requireNumber(coverage, "expectedSurahs");
  requireNumber(coverage, "actualSurahs");
  requireNumber(coverage, "expectedAyahs");
  requireNumber(coverage, "actualAyahs");
  if (!Array.isArray(coverage.chapterVerseCounts) || coverage.chapterVerseCounts.some((item) => !Number.isInteger(item))) throw new Error("Coverage chapterVerseCounts must be an integer array.");
  for (const field of ["missingVerseKeys", "duplicateVerseKeys", "emptyVerseKeys", "invalidVerseKeys", "invalidScriptVerseKeys"] as const) requireStringArray(coverage, field);
  requireString(coverage, "validatedAt");

  const integrity = requireRecord(value, "integrity");
  if (requireString(integrity, "algorithm") !== "SHA-256") throw new Error("Only SHA-256 source integrity is supported.");
  if (!["json", "xml"].includes(requireString(integrity, "rawFormat"))) throw new Error("Unsupported raw source format.");
  requireString(integrity, "rawChecksum");
  requireString(integrity, "normalizedChecksum");
  requireString(integrity, "normalizationVersion");

  const retrieval = requireRecord(value, "retrieval");
  requireString(retrieval, "retrievedAt");
  requireString(retrieval, "url");
  requireNullableString(retrieval, "etag");
  requireNullableString(retrieval, "lastModified");
}

export function validateSourceForActivation(source: TranslationSourceRegistryEntry): SourceValidationResult {
  const errors: string[] = [];
  try {
    assertSourceRegistryEntryShape(source);
  } catch (error) {
    return { valid: false, errors: [error instanceof Error ? error.message : "Invalid source registry entry."] };
  }

  if (source.candidateStatus === "blocked") errors.push("Source status is blocked.");
  if (!source.publisher?.trim()) errors.push("Publisher is required before a source can be enabled.");
  if (!source.translator.length && !source.responsibleOrganization.length) errors.push("A translator or responsible organization is required.");
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(source.language.bcp47)) errors.push("A valid BCP-47 language identifier is required.");
  if (!/^[a-z]{3}$/.test(source.language.iso6393)) errors.push("A valid ISO 639-3 language identifier is required.");
  if ((source.language.script === "Arab") !== (source.language.direction === "rtl")) errors.push("Script and text direction are inconsistent.");
  if (!source.license.documentedPermission.trim()) errors.push("Documented permission is required.");
  if (!source.license.attribution.trim()) errors.push("Attribution text is required.");
  if (source.license.redistribution === "unknown") errors.push("Redistribution rights must be resolved.");
  if (source.license.offlineStorage === "unknown") errors.push("Offline-storage rights must be resolved.");
  if (source.license.modification === "unknown") errors.push("Modification restrictions must be resolved.");
  if (source.license.commercialUse === "unknown") errors.push("Commercial-use status must be resolved.");
  if (!source.edition.version.trim() || !source.edition.revision.trim()) errors.push("Edition version and revision are required.");
  if (!source.edition.publishedAt || !source.edition.updatedAt) errors.push("Published and updated dates are required.");
  requireIsoDate(source.edition.publishedAt, "edition.publishedAt", errors);
  requireIsoDate(source.edition.updatedAt, "edition.updatedAt", errors);
  requireIsoDate(source.coverage.validatedAt, "coverage.validatedAt", errors);
  requireIsoDate(source.retrieval.retrievedAt, "retrieval.retrievedAt", errors);
  requireUrl(source.provider.sourceUrl, "provider.sourceUrl", errors);
  requireUrl(source.provider.packageUrl, "provider.packageUrl", errors);
  requireUrl(source.provider.checkForUpdatesUrl, "provider.checkForUpdatesUrl", errors);
  requireUrl(source.license.url, "license.url", errors);
  requireUrl(source.retrieval.url, "retrieval.url", errors);

  if (source.coverage.expectedSurahs !== EXPECTED_SURAH_COUNT || source.coverage.actualSurahs !== EXPECTED_SURAH_COUNT) errors.push("Coverage must contain exactly 114 surahs.");
  if (source.coverage.expectedAyahs !== EXPECTED_AYAH_COUNT || source.coverage.actualAyahs !== EXPECTED_AYAH_COUNT) errors.push("Coverage must contain exactly 6,236 ayat.");
  if (source.coverage.chapterVerseCounts.length !== EXPECTED_SURAH_COUNT || source.coverage.chapterVerseCounts.some((count, index) => count !== QURAN_CHAPTER_VERSE_COUNTS[index])) errors.push("Chapter and verse boundaries do not match the canonical 114-surah layout.");
  for (const field of ["missingVerseKeys", "duplicateVerseKeys", "emptyVerseKeys", "invalidVerseKeys", "invalidScriptVerseKeys"] as const) {
    if (source.coverage[field].length) errors.push(`Coverage field ${field} must be empty.`);
  }
  if (!SHA256.test(source.integrity.rawChecksum) || /^0{64}$/.test(source.integrity.rawChecksum)) errors.push("A valid raw SHA-256 checksum is required.");
  if (!SHA256.test(source.integrity.normalizedChecksum) || /^0{64}$/.test(source.integrity.normalizedChecksum)) errors.push("A valid normalized SHA-256 checksum is required.");
  return { valid: errors.length === 0, errors };
}

export function assertSourceCanBeEnabled(source: TranslationSourceRegistryEntry): void {
  const result = validateSourceForActivation(source);
  if (!result.valid) throw new Error(`Source ${source.sourceId} cannot be enabled: ${result.errors.join(" ")}`);
}

export function assertOfflinePackPermitted(source: TranslationSourceRegistryEntry): void {
  assertSourceCanBeEnabled(source);
  if (source.license.offlineStorage !== "permitted") throw new Error(`Permanent offline storage is not permitted for ${source.sourceId}.`);
  if (!source.provider.packageUrl) throw new Error(`A package URL is required for offline source ${source.sourceId}.`);
}
