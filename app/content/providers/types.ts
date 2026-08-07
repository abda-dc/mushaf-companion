import {
  EXPECTED_AYAH_COUNT,
  EXPECTED_SURAH_COUNT,
  QURAN_CHAPTER_VERSE_COUNTS,
  type ScriptCode,
  type TranslationCoverageReport,
  type TranslationSourceRegistryEntry,
} from "../source-registry.schema.ts";

export const MAX_TRANSLATION_PACKAGE_BYTES = 16 * 1024 * 1024;
export const TRANSLATION_NORMALIZATION_VERSION = "translation-record-jsonl-v1";

export interface TranslationRecord {
  verseKey: string;
  translation: string;
  footnotes: string;
}

export interface ProviderRequest {
  providerName: string;
  providerId: string;
  fetchImpl?: typeof fetch;
}

export interface AcquiredTranslationSource {
  providerName: string;
  providerId: string;
  bytes: Uint8Array;
  contentType: string;
  retrievedAt: string;
  etag: string | null;
  lastModified: string | null;
}

export interface TranslationAuditReport {
  sourceId: string;
  providerName: string;
  providerId: string;
  valid: boolean;
  errors: readonly string[];
  coverage: TranslationCoverageReport;
  rawChecksum: string;
  normalizedChecksum: string;
}

export interface TranslationPack {
  schemaVersion: 1;
  sourceId: string;
  providerName: string;
  providerId: string;
  editionRevision: string;
  language: TranslationSourceRegistryEntry["language"];
  attribution: string;
  rawChecksum: string;
  normalizedChecksum: string;
  records: readonly TranslationRecord[];
  activated: false;
}

export interface TranslationProviderAdapter {
  describeSource(): TranslationSourceRegistryEntry;
  acquire(request: ProviderRequest): Promise<AcquiredTranslationSource>;
  normalize(acquired: AcquiredTranslationSource): Promise<readonly TranslationRecord[]>;
  validate(acquired: AcquiredTranslationSource, records: readonly TranslationRecord[]): Promise<TranslationAuditReport>;
  buildPack(acquired: AcquiredTranslationSource, records: readonly TranslationRecord[]): Promise<TranslationPack>;
  checkForUpdate(request: ProviderRequest): Promise<{ updateAvailable: boolean; observedRevision: string | null }>;
}

const UNSAFE_MARKUP = /<(?:script|style|iframe|object|embed|svg|math|link|meta)\b/i;
const ANY_MARKUP = /<\/?[a-z][^>]*>/i;
const UNPAIRED_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;

export function assertExactProviderRequest(source: TranslationSourceRegistryEntry, request: ProviderRequest): void {
  if (request.providerName !== source.provider.name || request.providerId !== source.provider.id) {
    throw new Error(`Provider identity mismatch for ${source.sourceId}; no fallback source was used.`);
  }
}

export function assertPackageSize(byteLength: number, declaredLength?: string | null): void {
  const declared = declaredLength ? Number(declaredLength) : 0;
  if (Number.isFinite(declared) && declared > MAX_TRANSLATION_PACKAGE_BYTES) throw new Error("Translation package exceeds the compressed-size limit.");
  if (!Number.isInteger(byteLength) || byteLength <= 0 || byteLength > MAX_TRANSLATION_PACKAGE_BYTES) throw new Error("Translation package is empty or exceeds the decompressed-size limit.");
}

export async function readResponseBytesWithLimit(response: Response, maxBytes = MAX_TRANSLATION_PACKAGE_BYTES): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  const declared = declaredLength ? Number(declaredLength) : 0;
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error("Provider response exceeds the declared-size limit.");
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.byteLength || bytes.byteLength > maxBytes) throw new Error("Provider response is empty or exceeds the decompressed-size limit.");
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("Provider response exceeded the decompressed-size limit.");
        throw new Error("Provider response exceeds the decompressed-size limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!total) throw new Error("Provider response is empty.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function decodeUtf8Strict(bytes: Uint8Array): string {
  assertPackageSize(bytes.byteLength);
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function assertWellFormedUnicode(value: string, field = "translation"): void {
  if (UNPAIRED_SURROGATE.test(value) || value.includes("\u0000") || value.includes("\uFFFD")) throw new Error(`${field} contains malformed Unicode.`);
}

export function assertSafeProviderText(value: string, field = "translation"): void {
  assertWellFormedUnicode(value, field);
  if (UNSAFE_MARKUP.test(value) || ANY_MARKUP.test(value)) throw new Error(`${field} contains provider markup and was rejected.`);
}

export function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const hexadecimal = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      if (!Number.isInteger(codePoint) || codePoint <= 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) throw new Error("XML contains an invalid character entity.");
      return String.fromCodePoint(codePoint);
    }
    return ({ amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' } as Record<string, string>)[entity.toLowerCase()] ?? match;
  });
}

export function unwrapXmlText(value: string): string {
  const cdata = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  const text = cdata ? cdata[1] : decodeXmlEntities(value.trim());
  assertSafeProviderText(text);
  return text;
}

export function canonicalizeTranslationRecords(records: readonly TranslationRecord[]): string {
  return [...records]
    .sort(compareVerseKeys)
    .map((record) => JSON.stringify({ verseKey: record.verseKey, translation: record.translation, footnotes: record.footnotes }))
    .join("\n") + "\n";
}

export async function sha256Hex(value: Uint8Array | string): Promise<string> {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function compareVerseKeys(left: TranslationRecord, right: TranslationRecord): number {
  const [leftChapter, leftVerse] = left.verseKey.split(":").map(Number);
  const [rightChapter, rightVerse] = right.verseKey.split(":").map(Number);
  return leftChapter - rightChapter || leftVerse - rightVerse;
}

function hasExpectedScript(value: string, script: ScriptCode): boolean {
  if (script === "Ethi") return /\p{Script=Ethiopic}/u.test(value);
  if (script === "Latn") return /\p{Script=Latin}/u.test(value);
  return /\p{Script=Arabic}/u.test(value);
}

export async function auditTranslationRecords(
  source: TranslationSourceRegistryEntry,
  acquired: AcquiredTranslationSource,
  records: readonly TranslationRecord[],
): Promise<TranslationAuditReport> {
  const errors: string[] = [];
  if (acquired.providerName !== source.provider.name || acquired.providerId !== source.provider.id) errors.push("Acquired provider identity does not match the requested source.");

  const expectedKeys = new Set<string>();
  for (let chapter = 1; chapter <= QURAN_CHAPTER_VERSE_COUNTS.length; chapter += 1) {
    for (let verse = 1; verse <= QURAN_CHAPTER_VERSE_COUNTS[chapter - 1]; verse += 1) expectedKeys.add(`${chapter}:${verse}`);
  }
  const observed = new Map<string, number>();
  const emptyVerseKeys: string[] = [];
  const invalidVerseKeys: string[] = [];
  const invalidScriptVerseKeys: string[] = [];
  const actualChapters = new Set<number>();
  for (const record of records) {
    const match = /^(\d{1,3}):(\d{1,3})$/.exec(record.verseKey);
    if (!match || !expectedKeys.has(record.verseKey)) invalidVerseKeys.push(record.verseKey);
    else actualChapters.add(Number(match[1]));
    observed.set(record.verseKey, (observed.get(record.verseKey) ?? 0) + 1);
    if (!record.translation.trim()) emptyVerseKeys.push(record.verseKey);
    try {
      assertSafeProviderText(record.translation, `translation ${record.verseKey}`);
      assertSafeProviderText(record.footnotes, `footnotes ${record.verseKey}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Unsafe provider text at ${record.verseKey}.`);
    }
    if (record.translation.trim() && !hasExpectedScript(record.translation, source.language.script)) invalidScriptVerseKeys.push(record.verseKey);
  }

  const missingVerseKeys = [...expectedKeys].filter((key) => !observed.has(key));
  const duplicateVerseKeys = [...observed].filter(([, count]) => count > 1).map(([key]) => key);
  const chapterVerseCounts = QURAN_CHAPTER_VERSE_COUNTS.map((_, index) => records.filter((record) => record.verseKey.startsWith(`${index + 1}:`)).length);
  const coverage: TranslationCoverageReport = {
    expectedSurahs: EXPECTED_SURAH_COUNT,
    actualSurahs: actualChapters.size,
    expectedAyahs: EXPECTED_AYAH_COUNT,
    actualAyahs: records.length,
    chapterVerseCounts,
    missingVerseKeys,
    duplicateVerseKeys,
    emptyVerseKeys,
    invalidVerseKeys,
    invalidScriptVerseKeys,
    validatedAt: source.coverage.validatedAt,
  };

  if (actualChapters.size !== EXPECTED_SURAH_COUNT) errors.push(`Expected 114 surahs; received ${actualChapters.size}.`);
  if (records.length !== EXPECTED_AYAH_COUNT) errors.push(`Expected 6,236 ayat; received ${records.length}.`);
  if (missingVerseKeys.length) errors.push(`Missing ${missingVerseKeys.length} verse keys.`);
  if (duplicateVerseKeys.length) errors.push(`Found ${duplicateVerseKeys.length} duplicate verse keys.`);
  if (emptyVerseKeys.length) errors.push(`Found ${emptyVerseKeys.length} empty translations.`);
  if (invalidVerseKeys.length) errors.push(`Found ${invalidVerseKeys.length} invalid chapter/verse keys.`);
  if (invalidScriptVerseKeys.length) errors.push(`Found ${invalidScriptVerseKeys.length} translations without the expected ${source.language.script} script.`);
  if (chapterVerseCounts.some((count, index) => count !== QURAN_CHAPTER_VERSE_COUNTS[index])) errors.push("Chapter and verse boundaries do not match the canonical Quran layout.");

  const rawChecksum = await sha256Hex(acquired.bytes);
  const normalizedChecksum = await sha256Hex(canonicalizeTranslationRecords(records));
  if (rawChecksum !== source.integrity.rawChecksum) errors.push(`Raw package checksum drifted: expected ${source.integrity.rawChecksum}, received ${rawChecksum}.`);
  if (normalizedChecksum !== source.integrity.normalizedChecksum) errors.push(`Normalized package checksum drifted: expected ${source.integrity.normalizedChecksum}, received ${normalizedChecksum}.`);
  return {
    sourceId: source.sourceId,
    providerName: acquired.providerName,
    providerId: acquired.providerId,
    valid: errors.length === 0,
    errors,
    coverage,
    rawChecksum,
    normalizedChecksum,
  };
}
