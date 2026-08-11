import { QURAN_CHAPTER_VERSE_COUNTS } from "./content/source-registry.schema.ts";
import type { PageWord, QuranPage } from "./quran-data";

export const WORD_STUDY_SCHEMA_VERSION = 1;
export const MAX_WORD_POSITION = 512;
export const MAX_OCCURRENCE_RESULTS = 100_000;

export type WordStudyApprovalStatus = "approved" | "review-required" | "blocked";
export type WordStudyAuditStatus = "passed" | "failed" | "not-run";
export type WordStudyRightsStatus = "permitted" | "permitted-with-conditions" | "review-required" | "prohibited" | "unknown";
export type WordStudyIntegrityStatus = "verified" | "declared-only";

export interface WordCoordinate {
  verseKey: string;
  wordPosition: number;
  page: number;
  line: number;
  sourceWordId?: number;
}

export interface WordStudyProvenance {
  sourceId: string;
  datasetId: string;
  revision: string;
}

export interface WordMeaning {
  language: string;
  text: string;
}

export interface QuranLemma {
  id: string;
  arabic: string;
  normalized: string;
}

export interface QuranRoot {
  id: string;
  arabic: string;
  letters: string[];
}

export interface QuranMorphology {
  partOfSpeech?: string;
  grammaticalDescription?: string;
  segments?: Array<{ type: string; text: string }>;
}

export interface QuranWordStudyRecord {
  id: string;
  coordinate: WordCoordinate;
  surfaceText?: string;
  transliteration?: string;
  meanings?: WordMeaning[];
  lemma?: QuranLemma;
  root?: QuranRoot;
  morphology?: QuranMorphology;
  vocabularyEntryId?: string;
  provenance: WordStudyProvenance;
}

export interface WordOccurrence {
  wordId: string;
  coordinate: WordCoordinate;
  lemmaId?: string;
  rootId?: string;
  provenance: WordStudyProvenance;
}

export interface WordStudySourceMetadata {
  schemaVersion: number;
  sourceId: string;
  datasetId: string;
  provider: string;
  dataset: string;
  edition: string;
  version: string;
  revision: string;
  sourceUrl: string;
  license: {
    name: string;
    url: string;
    attribution: string;
    redistribution: WordStudyRightsStatus;
    offlineStorage: WordStudyRightsStatus;
    modification: WordStudyRightsStatus;
  };
  integrity: {
    algorithm: "SHA-256";
    checksum: string;
    normalizationVersion: string;
  };
  coverage: {
    verses: number;
    words: number;
    lemmas: number;
    roots: number;
    occurrences: number;
    description: string;
  };
  enabled: boolean;
  approvalStatus: WordStudyApprovalStatus;
  approvalReference: string | null;
  auditStatus: WordStudyAuditStatus;
  auditedAt: string | null;
  blockers: string[];
}

export interface WordStudyDataset {
  schemaVersion: number;
  metadata: WordStudySourceMetadata;
  words: QuranWordStudyRecord[];
  occurrences: WordOccurrence[];
}

export interface WordStudyAuditIdentity {
  sourceId: string;
  datasetId: string;
  revision: string;
  integrity: {
    algorithm: "SHA-256";
    checksum: string;
    status: WordStudyIntegrityStatus;
  };
}

export interface WordStudyAuditResult {
  valid: boolean;
  issues: string[];
  identity: WordStudyAuditIdentity;
  counts: {
    words: number;
    occurrences: number;
    lemmas: number;
    roots: number;
  };
}

export interface WordOccurrenceProviderResult {
  items: WordOccurrence[];
  total: number;
}

export interface WordStudyProvider {
  metadata(): WordStudySourceMetadata;
  getWord(coordinate: WordCoordinate): Promise<QuranWordStudyRecord | null>;
  getWordsForVerse(verseKey: string): Promise<QuranWordStudyRecord[]>;
  getOccurrencesByLemma(lemmaId: string): Promise<WordOccurrenceProviderResult>;
  getOccurrencesByRoot(rootId: string): Promise<WordOccurrenceProviderResult>;
  audit(): Promise<WordStudyAuditResult>;
}

export interface WordStudyActivationPolicy {
  sourceId: string;
  supportedRevisions: readonly string[];
  supportedChecksumAlgorithms: readonly "SHA-256"[];
  requiredRights: readonly ("redistribution" | "offlineStorage" | "modification")[];
}

export interface VerifiedWordStudyActivation {
  provider: WordStudyProvider;
  metadata: WordStudySourceMetadata;
  audit: WordStudyAuditResult;
}

export type WordStudyActivationResult =
  | { status: "active"; activation: VerifiedWordStudyActivation }
  | { status: "unavailable" | "error"; reason: string };

export type WordOccurrenceQueryResult =
  | { status: "ok"; items: WordOccurrence[]; total: number }
  | { status: "unavailable" | "error"; reason: string };

export interface WordStudyRequestToken {
  id: number;
  key: string;
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:@/-]{1,127}$/i;
const SHA256 = /^[a-f0-9]{64}$/;
const ARABIC_LETTER = /^[\u0621-\u064A\u0671]$/u;
const ARABIC_TEXT = /[\u0621-\u064A\u0671]/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/;
const APPROVAL_STATUSES = new Set<WordStudyApprovalStatus>(["approved", "review-required", "blocked"]);
const AUDIT_STATUSES = new Set<WordStudyAuditStatus>(["passed", "failed", "not-run"]);
const RIGHTS_STATUSES = new Set<WordStudyRightsStatus>(["permitted", "permitted-with-conditions", "review-required", "prohibited", "unknown"]);
const PERMITTED_RIGHTS = new Set<WordStudyRightsStatus>(["permitted", "permitted-with-conditions"]);

function hasSafeText(value: unknown, maxLength = 256): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= maxLength && !/[<>\u0000-\u001f]/u.test(value);
}

function safeObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function isCanonicalVerseKey(verseKey: unknown): verseKey is string {
  if (typeof verseKey !== "string") return false;
  const match = /^(\d{1,3}):(\d{1,3})$/.exec(verseKey);
  if (!match) return false;
  const chapter = Number(match[1]);
  const verse = Number(match[2]);
  return chapter >= 1 && chapter <= QURAN_CHAPTER_VERSE_COUNTS.length && verse >= 1 && verse <= QURAN_CHAPTER_VERSE_COUNTS[chapter - 1];
}

export function coordinateKey(coordinate: WordCoordinate) {
  return `${coordinate.verseKey}|${coordinate.wordPosition}|${coordinate.page}|${coordinate.line}|${coordinate.sourceWordId ?? "missing"}`;
}

export function coordinatesMatch(expected: WordCoordinate, actual: WordCoordinate, requireSourceWordId = expected.sourceWordId !== undefined) {
  return expected.verseKey === actual.verseKey
    && expected.wordPosition === actual.wordPosition
    && expected.page === actual.page
    && expected.line === actual.line
    && (!requireSourceWordId || (expected.sourceWordId !== undefined && actual.sourceWordId === expected.sourceWordId));
}

export function pageWordIdentity(word: Pick<PageWord, "id" | "verseKey">) {
  return `${word.verseKey}|${word.id}`;
}

export function validateWordCoordinate(value: unknown): string[] {
  const coordinate = safeObject(value);
  if (!coordinate) return ["coordinate is malformed"];
  const issues: string[] = [];
  if (!isCanonicalVerseKey(coordinate.verseKey)) issues.push("verseKey is not a canonical Quran verse key");
  if (!Number.isInteger(coordinate.wordPosition) || Number(coordinate.wordPosition) < 1 || Number(coordinate.wordPosition) > MAX_WORD_POSITION) issues.push("wordPosition must be a one-based bounded integer");
  if (!Number.isInteger(coordinate.page) || Number(coordinate.page) < 1 || Number(coordinate.page) > 604) issues.push("page must be between 1 and 604");
  if (!Number.isInteger(coordinate.line) || Number(coordinate.line) < 1 || Number(coordinate.line) > 15) issues.push("line must be between 1 and 15");
  if (coordinate.sourceWordId !== undefined && (!Number.isInteger(coordinate.sourceWordId) || Number(coordinate.sourceWordId) < 1)) issues.push("sourceWordId must be a positive integer when present");
  return issues;
}

export function coordinateForPageWord(pageData: QuranPage, target: PageWord): WordCoordinate | null {
  return buildPageWordCoordinateIndex(pageData).get(pageWordIdentity(target)) ?? null;
}

export function buildPageWordCoordinateIndex(pageData: QuranPage) {
  const index = new Map<string, WordCoordinate>();
  const positions = new Map<string, number>();
  if (!Number.isInteger(pageData.page) || pageData.page < 1 || pageData.page > 604) return index;
  pageData.lines.forEach((line) => line.words.forEach((word) => {
    if (word.isEnd) return;
    const wordPosition = (positions.get(word.verseKey) ?? 0) + 1;
    positions.set(word.verseKey, wordPosition);
    const coordinate = { verseKey: word.verseKey, wordPosition, page: pageData.page, line: line.number, sourceWordId: word.id };
    if (!validateWordCoordinate(coordinate).length) index.set(pageWordIdentity(word), coordinate);
  }));
  return index;
}

export function pageWordForCoordinate(pageData: QuranPage, coordinate: WordCoordinate): PageWord | null {
  if (coordinate.page !== pageData.page || validateWordCoordinate(coordinate).length || coordinate.sourceWordId === undefined) return null;
  const verseWords = pageData.lines.flatMap((line) => line.words).filter((word) => !word.isEnd && word.verseKey === coordinate.verseKey);
  const word = verseWords[coordinate.wordPosition - 1] ?? null;
  if (!word) return null;
  const trusted = coordinateForPageWord(pageData, word);
  return trusted && coordinatesMatch(trusted, coordinate, true) ? word : null;
}

export function validateWordStudyMetadata(value: unknown): string[] {
  const metadata = safeObject(value);
  if (!metadata) return ["word-study metadata is malformed"];
  const issues: string[] = [];
  if (metadata.schemaVersion !== WORD_STUDY_SCHEMA_VERSION) issues.push("unsupported word-study metadata schema version");
  if (typeof metadata.sourceId !== "string" || !SAFE_ID.test(metadata.sourceId)) issues.push("sourceId is malformed");
  if (typeof metadata.datasetId !== "string" || !SAFE_ID.test(metadata.datasetId)) issues.push("datasetId is malformed");
  for (const field of ["provider", "dataset", "edition", "version", "revision"] as const) {
    if (!hasSafeText(metadata[field], 160)) issues.push(`${field} is required and must be safe text`);
  }

  const license = safeObject(metadata.license);
  const integrity = safeObject(metadata.integrity);
  const coverage = safeObject(metadata.coverage);
  if (!license) issues.push("license metadata is required");
  if (!integrity) issues.push("integrity metadata is required");
  if (!coverage) issues.push("coverage metadata is required");

  try {
    if (typeof metadata.sourceUrl !== "string" || new URL(metadata.sourceUrl).protocol !== "https:") issues.push("sourceUrl must use HTTPS");
    if (!license || typeof license.url !== "string" || new URL(license.url).protocol !== "https:") issues.push("license URL must use HTTPS");
  } catch {
    issues.push("source and license URLs must be valid");
  }

  if (license) {
    if (!hasSafeText(license.name, 160) || !hasSafeText(license.attribution, 500)) issues.push("license name and attribution are required");
    for (const field of ["redistribution", "offlineStorage", "modification"] as const) {
      if (!RIGHTS_STATUSES.has(license[field] as WordStudyRightsStatus)) issues.push(`license.${field} is invalid`);
    }
  }
  if (integrity) {
    if (integrity.algorithm !== "SHA-256") issues.push("unsupported checksum algorithm");
    if (typeof integrity.checksum !== "string" || !SHA256.test(integrity.checksum) || /^0{64}$/.test(integrity.checksum)) issues.push("a non-placeholder SHA-256 checksum is required");
    if (!hasSafeText(integrity.normalizationVersion, 160)) issues.push("normalizationVersion is required");
  }
  if (coverage) {
    for (const field of ["verses", "words", "lemmas", "roots", "occurrences"] as const) {
      if (!Number.isInteger(coverage[field]) || Number(coverage[field]) < 0) issues.push(`coverage.${field} must be a non-negative integer`);
    }
    if (!hasSafeText(coverage.description, 500)) issues.push("coverage description is required");
  }
  if (metadata.auditedAt !== null && (typeof metadata.auditedAt !== "string" || !ISO_DATE.test(metadata.auditedAt))) issues.push("auditedAt must be an ISO date or UTC timestamp");
  if (typeof metadata.enabled !== "boolean") issues.push("enabled must be explicit");
  if (!APPROVAL_STATUSES.has(metadata.approvalStatus as WordStudyApprovalStatus)) issues.push("approvalStatus is invalid");
  if (!AUDIT_STATUSES.has(metadata.auditStatus as WordStudyAuditStatus)) issues.push("auditStatus is invalid");
  if (!Array.isArray(metadata.blockers) || metadata.blockers.some((item) => !hasSafeText(item, 500))) issues.push("blockers must be safe text entries");
  if (metadata.enabled && metadata.approvalStatus !== "approved") issues.push("enabled providers require approved status");
  if (metadata.enabled && !hasSafeText(metadata.approvalReference, 300)) issues.push("enabled providers require an approval reference");
  if (metadata.enabled && Array.isArray(metadata.blockers) && metadata.blockers.length) issues.push("enabled providers cannot retain blockers");
  return issues;
}

function metadataSignature(metadata: WordStudySourceMetadata) {
  return JSON.stringify({
    schemaVersion: metadata.schemaVersion,
    sourceId: metadata.sourceId,
    datasetId: metadata.datasetId,
    revision: metadata.revision,
    enabled: metadata.enabled,
    approvalStatus: metadata.approvalStatus,
    approvalReference: metadata.approvalReference,
    license: metadata.license,
    integrity: metadata.integrity,
    blockers: metadata.blockers,
  });
}

function staticEligibilityIssues(metadata: WordStudySourceMetadata, policy: WordStudyActivationPolicy) {
  const issues = validateWordStudyMetadata(metadata);
  if (metadata.sourceId !== policy.sourceId) issues.push("provider source ID does not match its registration policy");
  if (!policy.supportedRevisions.includes(metadata.revision)) issues.push("provider revision is not supported by its registration policy");
  if (!policy.supportedChecksumAlgorithms.includes(metadata.integrity?.algorithm)) issues.push("provider checksum algorithm is not supported by its registration policy");
  if (!metadata.enabled || metadata.approvalStatus !== "approved" || !metadata.approvalReference?.trim()) issues.push("provider is not explicitly enabled and approved");
  for (const right of policy.requiredRights) {
    if (!PERMITTED_RIGHTS.has(metadata.license?.[right] as WordStudyRightsStatus)) issues.push(`license.${right} does not permit application use`);
  }
  return issues;
}

function validateAuditIdentity(audit: WordStudyAuditResult, metadata: WordStudySourceMetadata) {
  const issues: string[] = [];
  if (!audit || typeof audit !== "object" || !audit.valid) issues.push("provider audit did not pass");
  if (!audit?.identity || audit.identity.sourceId !== metadata.sourceId || audit.identity.datasetId !== metadata.datasetId || audit.identity.revision !== metadata.revision) issues.push("provider audit identity does not match metadata");
  if (audit?.identity?.integrity?.algorithm !== metadata.integrity.algorithm || audit?.identity?.integrity?.checksum !== metadata.integrity.checksum) issues.push("provider audit checksum identity does not match metadata");
  if (audit?.identity?.integrity?.status !== "verified") issues.push("provider audit did not verify dataset integrity");
  for (const field of ["words", "occurrences", "lemmas", "roots"] as const) {
    if (!Number.isInteger(audit?.counts?.[field]) || audit.counts[field] < 0 || audit.counts[field] !== metadata.coverage[field]) issues.push(`provider audit count for ${field} does not match metadata`);
  }
  return issues;
}

function validateProvenance(provenance: WordStudyProvenance, metadata: WordStudySourceMetadata, path: string, issues: string[]) {
  if (!provenance || typeof provenance !== "object") {
    issues.push(`${path} is required`);
    return;
  }
  if (provenance.sourceId !== metadata.sourceId) issues.push(`${path}.sourceId does not match provider metadata`);
  if (provenance.datasetId !== metadata.datasetId) issues.push(`${path}.datasetId does not match provider metadata`);
  if (provenance.revision !== metadata.revision) issues.push(`${path}.revision does not match provider metadata`);
}

function validateLemma(lemma: QuranLemma, path: string, issues: string[]) {
  if (!lemma || typeof lemma !== "object") {
    issues.push(`${path} is malformed`);
    return;
  }
  if (!SAFE_ID.test(lemma.id)) issues.push(`${path}.id is malformed`);
  if (!hasSafeText(lemma.arabic) || !ARABIC_TEXT.test(lemma.arabic)) issues.push(`${path}.arabic is malformed`);
  if (!hasSafeText(lemma.normalized)) issues.push(`${path}.normalized is malformed`);
}

function validateRoot(root: QuranRoot, path: string, issues: string[]) {
  if (!root || typeof root !== "object") {
    issues.push(`${path} is malformed`);
    return;
  }
  if (!SAFE_ID.test(root.id)) issues.push(`${path}.id is malformed`);
  if (!hasSafeText(root.arabic) || !ARABIC_TEXT.test(root.arabic)) issues.push(`${path}.arabic is malformed`);
  if (!Array.isArray(root.letters) || root.letters.length < 2 || root.letters.length > 5 || root.letters.some((letter) => typeof letter !== "string" || !ARABIC_LETTER.test(letter))) issues.push(`${path}.letters must contain two to five Arabic letters`);
}

export function validateWordStudyRecord(record: QuranWordStudyRecord, metadata: WordStudySourceMetadata, expectedCoordinate?: WordCoordinate) {
  const issues: string[] = [];
  if (!record || typeof record !== "object") return ["word record is malformed"];
  if (!SAFE_ID.test(record.id)) issues.push("word record id is malformed");
  const coordinateIssues = validateWordCoordinate(record.coordinate);
  coordinateIssues.forEach((issue) => issues.push(`coordinate: ${issue}`));
  if (expectedCoordinate && !coordinateIssues.length && !coordinatesMatch(expectedCoordinate, record.coordinate, expectedCoordinate.sourceWordId !== undefined)) issues.push("word record coordinate does not match the requested Mushaf word");
  validateProvenance(record.provenance, metadata, "provenance", issues);
  if (record.surfaceText !== undefined && !hasSafeText(record.surfaceText)) issues.push("surfaceText is malformed");
  if (record.transliteration !== undefined && !hasSafeText(record.transliteration)) issues.push("transliteration is malformed");
  if (record.vocabularyEntryId !== undefined && (typeof record.vocabularyEntryId !== "string" || !SAFE_ID.test(record.vocabularyEntryId))) issues.push("vocabularyEntryId is malformed");
  if (record.meanings !== undefined && (!Array.isArray(record.meanings) || record.meanings.some((meaning) => !meaning || typeof meaning.language !== "string" || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(meaning.language) || !hasSafeText(meaning.text, 500)))) issues.push("meanings are malformed");
  if (record.lemma) validateLemma(record.lemma, "lemma", issues);
  if (record.root) validateRoot(record.root, "root", issues);
  if (record.morphology !== undefined) {
    const morphology = record.morphology;
    if (!morphology || typeof morphology !== "object") issues.push("morphology is malformed");
    else {
      if (morphology.partOfSpeech !== undefined && !hasSafeText(morphology.partOfSpeech)) issues.push("morphology.partOfSpeech is malformed");
      if (morphology.grammaticalDescription !== undefined && !hasSafeText(morphology.grammaticalDescription, 500)) issues.push("morphology.grammaticalDescription is malformed");
      if (morphology.segments !== undefined && (!Array.isArray(morphology.segments) || morphology.segments.length > 20 || morphology.segments.some((segment) => !segment || !hasSafeText(segment.type) || !hasSafeText(segment.text)))) issues.push("morphology.segments are malformed");
    }
  }
  return issues;
}

function emptyAuditIdentity(metadata?: Partial<WordStudySourceMetadata>): WordStudyAuditIdentity {
  return {
    sourceId: metadata?.sourceId ?? "invalid:source",
    datasetId: metadata?.datasetId ?? "invalid:dataset",
    revision: metadata?.revision ?? "invalid-revision",
    integrity: { algorithm: "SHA-256", checksum: metadata?.integrity?.checksum ?? "0".repeat(64), status: "declared-only" },
  };
}

export function auditWordStudyDataset(value: WordStudyDataset): WordStudyAuditResult {
  const dataset = safeObject(value);
  const metadata = safeObject(dataset?.metadata) as unknown as WordStudySourceMetadata | null;
  const words = Array.isArray(dataset?.words) ? dataset.words as QuranWordStudyRecord[] : [];
  const occurrences = Array.isArray(dataset?.occurrences) ? dataset.occurrences as WordOccurrence[] : [];
  const issues = validateWordStudyMetadata(metadata).map((issue) => `metadata: ${issue}`);
  if (!dataset) issues.push("dataset is malformed");
  if (dataset?.schemaVersion !== WORD_STUDY_SCHEMA_VERSION) issues.push("dataset uses an unsupported schema version");
  if (!Array.isArray(dataset?.words)) issues.push("dataset words are malformed");
  if (!Array.isArray(dataset?.occurrences)) issues.push("dataset occurrences are malformed");
  const safeMetadata = metadata ?? QAC_REFERENCE_METADATA;
  const wordIds = new Set<string>();
  const coordinateIds = new Set<string>();
  const wordsById = new Map<string, QuranWordStudyRecord>();
  const lemmaIds = new Set<string>();
  const rootIds = new Set<string>();

  words.slice(0, MAX_OCCURRENCE_RESULTS).forEach((word, index) => {
    const path = `words.${index}`;
    validateWordStudyRecord(word, safeMetadata).forEach((issue) => issues.push(`${path}: ${issue}`));
    if (wordIds.has(word.id)) issues.push(`${path}.id is duplicated`);
    wordIds.add(word.id);
    wordsById.set(word.id, word);
    const identity = coordinateKey(word.coordinate);
    if (coordinateIds.has(identity)) issues.push(`${path}.coordinate is duplicated`);
    coordinateIds.add(identity);
    if (word.lemma) lemmaIds.add(word.lemma.id);
    if (word.root) rootIds.add(word.root.id);
  });
  if (words.length > MAX_OCCURRENCE_RESULTS) issues.push("dataset word count exceeds the audit bound");

  const occurrenceIds = new Set<string>();
  const mappedWordIds = new Set<string>();
  occurrences.slice(0, MAX_OCCURRENCE_RESULTS).forEach((occurrence, index) => {
    const path = `occurrences.${index}`;
    validateWordCoordinate(occurrence.coordinate).forEach((issue) => issues.push(`${path}.coordinate: ${issue}`));
    validateProvenance(occurrence.provenance, safeMetadata, `${path}.provenance`, issues);
    const word = wordsById.get(occurrence.wordId);
    if (!word) issues.push(`${path}.wordId has no mapped word record`);
    else if (!coordinatesMatch(word.coordinate, occurrence.coordinate, word.coordinate.sourceWordId !== undefined)) issues.push(`${path}.coordinate does not match its word record`);
    if (!occurrence.lemmaId && !occurrence.rootId) issues.push(`${path} must identify a lemma or root`);
    if (occurrence.lemmaId && !lemmaIds.has(occurrence.lemmaId)) issues.push(`${path}.lemmaId has no mapped lemma`);
    if (occurrence.rootId && !rootIds.has(occurrence.rootId)) issues.push(`${path}.rootId has no mapped root`);
    const identity = `${occurrence.wordId}|${occurrence.lemmaId ?? ""}|${occurrence.rootId ?? ""}|${coordinateKey(occurrence.coordinate)}`;
    if (occurrenceIds.has(identity)) issues.push(`${path} is duplicated`);
    occurrenceIds.add(identity);
    mappedWordIds.add(occurrence.wordId);
  });
  if (occurrences.length > MAX_OCCURRENCE_RESULTS) issues.push("dataset occurrence count exceeds the audit bound");

  words.forEach((word, index) => {
    if ((word.lemma || word.root) && !mappedWordIds.has(word.id)) issues.push(`words.${index} has linguistic metadata but no occurrence mapping`);
  });

  const actual = { words: words.length, occurrences: occurrences.length, lemmas: lemmaIds.size, roots: rootIds.size };
  if (metadata) {
    for (const field of ["words", "occurrences", "lemmas", "roots"] as const) {
      if (metadata.coverage?.[field] !== actual[field]) issues.push(`coverage.${field} does not match audited ${field}`);
    }
  }
  return { valid: issues.length === 0, issues, identity: emptyAuditIdentity(metadata ?? undefined), counts: actual };
}

export function validateOccurrenceResults(items: WordOccurrence[], kind: "lemma" | "root", identifier: string, metadata: WordStudySourceMetadata) {
  const issues: string[] = [];
  const identities = new Set<string>();
  if (!SAFE_ID.test(identifier)) issues.push("occurrence identifier is malformed");
  if (!Array.isArray(items)) return { valid: false, issues: ["occurrence response is malformed"], items: [] };
  if (items.length > MAX_OCCURRENCE_RESULTS) return { valid: false, issues: ["occurrence response exceeds the result bound"], items: [] };
  items.forEach((item, index) => {
    const path = `occurrences.${index}`;
    if (!item || typeof item !== "object") {
      issues.push(`${path} is malformed`);
      return;
    }
    if (!SAFE_ID.test(item.wordId)) issues.push(`${path}.wordId is malformed`);
    validateWordCoordinate(item.coordinate).forEach((issue) => issues.push(`${path}.coordinate: ${issue}`));
    validateProvenance(item.provenance, metadata, `${path}.provenance`, issues);
    if (kind === "lemma" && item.lemmaId !== identifier) issues.push(`${path}.lemmaId does not match the query`);
    if (kind === "root" && item.rootId !== identifier) issues.push(`${path}.rootId does not match the query`);
    const identity = `${item.wordId}|${coordinateKey(item.coordinate)}`;
    if (identities.has(identity)) issues.push(`${path} is duplicated`);
    identities.add(identity);
  });
  return { valid: issues.length === 0, issues, items: issues.length ? [] : items };
}

export class LatestWordStudyRequestGate {
  #nextId = 0;
  #current: WordStudyRequestToken | null = null;

  begin(key: string) {
    this.#current = { id: ++this.#nextId, key };
    return this.#current;
  }

  cancel() {
    this.#current = null;
    this.#nextId += 1;
  }

  isCurrent(token: WordStudyRequestToken) {
    return this.#current?.id === token.id && this.#current.key === token.key;
  }
}

interface RegisteredProvider {
  provider: WordStudyProvider;
  policy: WordStudyActivationPolicy;
}

export class WordStudyProviderRegistry {
  readonly #providers = new Map<string, RegisteredProvider>();
  readonly #activations = new Map<string, { signature: string; activation: VerifiedWordStudyActivation }>();
  readonly #activationPromises = new Map<string, Promise<WordStudyActivationResult>>();

  register(provider: WordStudyProvider, policy: WordStudyActivationPolicy) {
    if (!policy || typeof policy.sourceId !== "string" || !SAFE_ID.test(policy.sourceId) || !policy.supportedRevisions.length || !policy.supportedChecksumAlgorithms.length || !policy.requiredRights.length) throw new Error("Word-study provider registration policy is incomplete.");
    let metadata: unknown;
    try {
      metadata = provider.metadata();
    } catch {
      throw new Error(`Word-study provider ${policy.sourceId} metadata could not be read.`);
    }
    const declaredSourceId = safeObject(metadata)?.sourceId;
    if (declaredSourceId !== policy.sourceId) throw new Error(`Word-study provider ${policy.sourceId} does not match its registration policy.`);
    if (this.#providers.has(policy.sourceId)) throw new Error(`Word-study provider ${policy.sourceId} is already registered.`);
    this.#providers.set(policy.sourceId, { provider, policy });
  }

  listSourceIds() {
    return [...this.#providers.keys()];
  }

  listMetadata() {
    const result: WordStudySourceMetadata[] = [];
    this.#providers.forEach(({ provider }) => {
      try {
        const metadata = provider.metadata();
        if (!validateWordStudyMetadata(metadata).length) result.push(metadata);
      } catch {
        // Malformed providers remain registered but unavailable for controlled activation reporting.
      }
    });
    return result;
  }

  async activate(sourceId: string): Promise<WordStudyActivationResult> {
    const registration = this.#providers.get(sourceId);
    if (!registration) return { status: "unavailable", reason: "Word-study source is not registered." };
    let metadata: WordStudySourceMetadata;
    try {
      metadata = registration.provider.metadata();
    } catch {
      return { status: "error", reason: "Word-study source metadata could not be read." };
    }
    const issues = staticEligibilityIssues(metadata, registration.policy);
    if (issues.length) {
      this.#activations.delete(sourceId);
      return { status: "unavailable", reason: issues.join("; ") };
    }
    const signature = metadataSignature(metadata);
    const cached = this.#activations.get(sourceId);
    if (cached?.signature === signature) return { status: "active", activation: cached.activation };
    const pending = this.#activationPromises.get(sourceId);
    if (pending) return pending;
    const activationPromise = (async (): Promise<WordStudyActivationResult> => {
      try {
        const audit = await registration.provider.audit();
        const auditIssues = validateAuditIdentity(audit, metadata);
        if (auditIssues.length) return { status: "unavailable", reason: auditIssues.join("; ") };
        const activation = { provider: registration.provider, metadata: structuredClone(metadata), audit };
        this.#activations.set(sourceId, { signature, activation });
        return { status: "active", activation };
      } catch {
        return { status: "error", reason: "Word-study source audit failed." };
      } finally {
        this.#activationPromises.delete(sourceId);
      }
    })();
    this.#activationPromises.set(sourceId, activationPromise);
    return activationPromise;
  }

  getVerifiedActivation(sourceId: string) {
    const registration = this.#providers.get(sourceId);
    const cached = this.#activations.get(sourceId);
    if (!registration || !cached) return null;
    try {
      const metadata = registration.provider.metadata();
      if (staticEligibilityIssues(metadata, registration.policy).length || metadataSignature(metadata) !== cached.signature) {
        this.#activations.delete(sourceId);
        return null;
      }
      return cached.activation;
    } catch {
      this.#activations.delete(sourceId);
      return null;
    }
  }

  getActiveProvider(sourceId: string) {
    return this.getVerifiedActivation(sourceId)?.provider ?? null;
  }

  async getWord(sourceId: string, coordinate: WordCoordinate) {
    if (validateWordCoordinate(coordinate).length || coordinate.sourceWordId === undefined) return null;
    const activation = this.getVerifiedActivation(sourceId);
    if (!activation) return null;
    try {
      const record = await activation.provider.getWord(coordinate);
      return record && !validateWordStudyRecord(record, activation.metadata, coordinate).length ? record : null;
    } catch {
      return null;
    }
  }

  async getWordsForVerse(sourceId: string, verseKey: string) {
    if (!isCanonicalVerseKey(verseKey)) return [];
    const activation = this.getVerifiedActivation(sourceId);
    if (!activation) return [];
    try {
      const records = await activation.provider.getWordsForVerse(verseKey);
      const coordinates = new Set<string>();
      if (!Array.isArray(records) || records.length > MAX_OCCURRENCE_RESULTS || records.some((record) => record.coordinate.verseKey !== verseKey || record.coordinate.sourceWordId === undefined || validateWordStudyRecord(record, activation.metadata).length || coordinates.has(coordinateKey(record.coordinate)) || !coordinates.add(coordinateKey(record.coordinate)))) return [];
      return records;
    } catch {
      return [];
    }
  }

  async #queryOccurrences(sourceId: string, kind: "lemma" | "root", identifier: string): Promise<WordOccurrenceQueryResult> {
    if (!SAFE_ID.test(identifier)) return { status: "error", reason: "Occurrence identifier is malformed." };
    const activation = this.getVerifiedActivation(sourceId);
    if (!activation) return { status: "unavailable", reason: "No verified word-study source is active." };
    try {
      const response = kind === "lemma" ? await activation.provider.getOccurrencesByLemma(identifier) : await activation.provider.getOccurrencesByRoot(identifier);
      if (!response || !Array.isArray(response.items) || !Number.isInteger(response.total) || response.total < 0 || response.total !== response.items.length) return { status: "error", reason: "Occurrence source returned an incomplete audited total." };
      const result = validateOccurrenceResults(response.items, kind, identifier, activation.metadata);
      if (!result.valid) return { status: "error", reason: "Occurrence source returned invalid or duplicate coordinates." };
      return { status: "ok", items: result.items, total: response.total };
    } catch {
      return { status: "error", reason: "Occurrence source is temporarily unavailable." };
    }
  }

  getOccurrencesByLemma(sourceId: string, lemmaId: string) {
    return this.#queryOccurrences(sourceId, "lemma", lemmaId);
  }

  getOccurrencesByRoot(sourceId: string, rootId: string) {
    return this.#queryOccurrences(sourceId, "root", rootId);
  }
}

export const QAC_REFERENCE_METADATA = Object.freeze<WordStudySourceMetadata>({
  schemaVersion: WORD_STUDY_SCHEMA_VERSION,
  sourceId: "qac:morphology:0.4",
  datasetId: "quranic-arabic-corpus-morphology",
  provider: "Quranic Arabic Corpus",
  dataset: "Quranic Arabic Corpus morphology",
  edition: "Morphology corpus 0.4",
  version: "0.4",
  revision: "reference-only-unapproved",
  sourceUrl: "https://corpus.quran.com/download/",
  license: {
    name: "GNU General Public License with corpus-specific terms",
    url: "https://corpus.quran.com/download/",
    attribution: "Copyright © 2011 Kais Dukes. Quranic Arabic Corpus morphology version 0.4.",
    redistribution: "review-required",
    offlineStorage: "review-required",
    modification: "review-required",
  },
  integrity: {
    algorithm: "SHA-256",
    checksum: "a1d12923815341face765083805d2148ed2d9f5cc3f7d6665219d887675d8c46",
    normalizationVersion: "none-reference-only",
  },
  coverage: { verses: 0, words: 0, lemmas: 0, roots: 0, occurrences: 0, description: "No QAC records are imported into Mushaf Companion." },
  enabled: false,
  approvalStatus: "blocked",
  approvalReference: null,
  auditStatus: "not-run",
  auditedAt: null,
  blockers: ["Target-specific transformation and redistribution approval has not been granted."],
});

class DisabledQacReferenceProvider implements WordStudyProvider {
  metadata() { return QAC_REFERENCE_METADATA; }
  async getWord() { return null; }
  async getWordsForVerse() { return []; }
  async getOccurrencesByLemma() { return { items: [], total: 0 }; }
  async getOccurrencesByRoot() { return { items: [], total: 0 }; }
  async audit(): Promise<WordStudyAuditResult> {
    return {
      valid: false,
      issues: ["Provider is disabled pending source approval."],
      identity: emptyAuditIdentity(QAC_REFERENCE_METADATA),
      counts: { words: 0, occurrences: 0, lemmas: 0, roots: 0 },
    };
  }
}

const QAC_REFERENCE_POLICY = Object.freeze<WordStudyActivationPolicy>({
  sourceId: QAC_REFERENCE_METADATA.sourceId,
  supportedRevisions: [QAC_REFERENCE_METADATA.revision],
  supportedChecksumAlgorithms: ["SHA-256"],
  requiredRights: ["redistribution", "offlineStorage", "modification"],
});

export const WORD_STUDY_PROVIDER_REGISTRY = new WordStudyProviderRegistry();
WORD_STUDY_PROVIDER_REGISTRY.register(new DisabledQacReferenceProvider(), QAC_REFERENCE_POLICY);
