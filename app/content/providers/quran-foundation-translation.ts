import { assertOfflinePackPermitted, canonicalVerseKeys, type TranslationSourceRegistryEntry } from "../source-registry.schema.ts";
import {
  MAX_TRANSLATION_PACKAGE_BYTES,
  assertExactProviderRequest,
  assertSafeProviderText,
  auditTranslationRecords,
  decodeUtf8Strict,
  readResponseBytesWithLimit,
  type AcquiredTranslationSource,
  type ProviderRequest,
  type TranslationAuditReport,
  type TranslationPack,
  type TranslationProviderAdapter,
  type TranslationRecord,
} from "./types.ts";

const ALLOWED_FOOTNOTE = /<sup\s+foot_note=(?:"?\d+"?)>\d+<\/sup>/gi;
const ANY_TAG = /<\/?[a-z][^>]*>/i;
const UNSAFE_TAG = /<(?:script|style|iframe|object|embed|svg|math|link|meta)\b/i;

export function normalizeQuranFoundationText(value: string): string {
  if (UNSAFE_TAG.test(value)) throw new Error("Quran Foundation translation contains unsafe provider markup.");
  const withoutFootnotes = value.replace(ALLOWED_FOOTNOTE, "");
  if (ANY_TAG.test(withoutFootnotes)) throw new Error("Quran Foundation translation contains unsupported provider markup.");
  const decoded = withoutFootnotes
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
  assertSafeProviderText(decoded);
  return decoded;
}

export function parseQuranFoundationJson(source: TranslationSourceRegistryEntry, bytes: Uint8Array): readonly TranslationRecord[] {
  const body = decodeUtf8Strict(bytes);
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("Quran Foundation translation response is not valid JSON.");
  }
  const translations = (payload as { translations?: unknown })?.translations;
  if (!Array.isArray(translations)) throw new Error("Quran Foundation translation response has no translation array.");
  const keys = canonicalVerseKeys();
  if (translations.length !== keys.length) throw new Error(`Quran Foundation resource ${source.provider.id} must contain exactly 6,236 translations.`);
  return translations.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error(`Quran Foundation translation record ${index + 1} is malformed.`);
    const record = item as { resource_id?: unknown; text?: unknown };
    if (String(record.resource_id) !== source.provider.id) throw new Error(`Quran Foundation resource identity mismatch at record ${index + 1}; no fallback source was used.`);
    if (typeof record.text !== "string") throw new Error(`Quran Foundation translation record ${index + 1} has no text.`);
    return { verseKey: keys[index], translation: normalizeQuranFoundationText(record.text), footnotes: "" };
  });
}

export class QuranFoundationTranslationAdapter implements TranslationProviderAdapter {
  readonly #source: TranslationSourceRegistryEntry;

  constructor(source: TranslationSourceRegistryEntry) {
    if (source.provider.name !== "Quran Foundation Content API") throw new Error("Quran Foundation adapter requires a Quran Foundation source entry.");
    this.#source = source;
  }

  describeSource(): TranslationSourceRegistryEntry {
    return this.#source;
  }

  async acquire(request: ProviderRequest): Promise<AcquiredTranslationSource> {
    assertExactProviderRequest(this.#source, request);
    const url = this.#source.retrieval.url;
    const response = await (request.fetchImpl ?? fetch)(url, { cache: "no-store", redirect: "follow", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Quran Foundation translation request failed with status ${response.status}.`);
    const bytes = await readResponseBytesWithLimit(response);
    return {
      providerName: this.#source.provider.name,
      providerId: this.#source.provider.id,
      bytes,
      contentType: response.headers.get("content-type") ?? "application/json",
      retrievedAt: new Date().toISOString(),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    };
  }

  async normalize(acquired: AcquiredTranslationSource): Promise<readonly TranslationRecord[]> {
    if (acquired.providerName !== this.#source.provider.name || acquired.providerId !== this.#source.provider.id) throw new Error("Quran Foundation acquired payload identity does not match the requested source.");
    return parseQuranFoundationJson(this.#source, acquired.bytes);
  }

  async validate(acquired: AcquiredTranslationSource, records: readonly TranslationRecord[]): Promise<TranslationAuditReport> {
    return auditTranslationRecords(this.#source, acquired, records);
  }

  async buildPack(acquired: AcquiredTranslationSource, records: readonly TranslationRecord[]): Promise<TranslationPack> {
    assertOfflinePackPermitted(this.#source);
    const audit = await this.validate(acquired, records);
    if (!audit.valid) throw new Error(`Translation pack validation failed: ${audit.errors.join(" ")}`);
    return {
      schemaVersion: 1,
      sourceId: this.#source.sourceId,
      providerName: this.#source.provider.name,
      providerId: this.#source.provider.id,
      editionRevision: this.#source.edition.revision,
      language: this.#source.language,
      attribution: this.#source.license.attribution,
      rawChecksum: audit.rawChecksum,
      normalizedChecksum: audit.normalizedChecksum,
      records,
      activated: false,
    };
  }

  async checkForUpdate(request: ProviderRequest): Promise<{ updateAvailable: boolean; observedRevision: string | null }> {
    assertExactProviderRequest(this.#source, request);
    if (!this.#source.provider.checkForUpdatesUrl) throw new Error("Quran Foundation source has no update-check URL.");
    const response = await (request.fetchImpl ?? fetch)(this.#source.provider.checkForUpdatesUrl, { cache: "no-store", headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Quran Foundation resource check failed with status ${response.status}.`);
    const bytes = await readResponseBytesWithLimit(response, Math.min(MAX_TRANSLATION_PACKAGE_BYTES, 512 * 1024));
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as { translations?: Array<{ id?: number }> };
    const exact = payload.translations?.find((entry) => String(entry.id) === this.#source.provider.id);
    if (!exact) throw new Error(`Quran Foundation resource ${this.#source.provider.id} is unavailable; no fallback source was used.`);
    return { updateAvailable: false, observedRevision: this.#source.edition.revision };
  }
}
