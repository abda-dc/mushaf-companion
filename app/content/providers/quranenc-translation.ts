import { assertOfflinePackPermitted, type TranslationSourceRegistryEntry } from "../source-registry.schema.ts";
import {
  MAX_TRANSLATION_PACKAGE_BYTES,
  assertExactProviderRequest,
  auditTranslationRecords,
  decodeUtf8Strict,
  readResponseBytesWithLimit,
  sha256Hex,
  unwrapXmlText,
  type AcquiredTranslationSource,
  type ProviderRequest,
  type TranslationAuditReport,
  type TranslationPack,
  type TranslationProviderAdapter,
  type TranslationRecord,
} from "./types.ts";

const FORBIDDEN_XML = /<!DOCTYPE\b|<!ENTITY\b|<\?xml-stylesheet\b/i;

function xmlTagText(container: string, tag: string): string {
  const match = container.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) throw new Error(`QuranEnc package is missing ${tag} metadata.`);
  return unwrapXmlText(match[1]);
}

function assertQuranEncXmlSafety(xml: string): void {
  if (FORBIDDEN_XML.test(xml)) throw new Error("QuranEnc XML contains a forbidden DTD, entity declaration, or stylesheet instruction.");
  if (!xml.startsWith("<translation_root>") || !xml.trimEnd().endsWith("</translation_root>")) throw new Error("QuranEnc XML root is malformed.");
  if ((xml.match(/<sura\b/g) ?? []).length > 114 || (xml.match(/<aya\b/g) ?? []).length > 6236) throw new Error("QuranEnc XML exceeds the canonical Quran record limits.");
}

export function parseQuranEncXml(source: TranslationSourceRegistryEntry, bytes: Uint8Array): readonly TranslationRecord[] {
  const xml = decodeUtf8Strict(bytes);
  assertQuranEncXmlSafety(xml);
  const meta = xml.match(/<meta>([\s\S]*?)<\/meta>/i)?.[1];
  if (!meta) throw new Error("QuranEnc package is missing metadata.");
  const providerId = xmlTagText(meta, "id");
  const revision = xmlTagText(meta, "updated_at");
  const sourceUrl = xmlTagText(meta, "source");
  if (providerId !== source.provider.id) throw new Error(`QuranEnc package identity mismatch: expected ${source.provider.id}, received ${providerId}.`);
  if (!revision.includes(source.edition.revision)) throw new Error(`QuranEnc package revision mismatch: expected ${source.edition.revision}.`);
  if (new URL(sourceUrl).hostname !== "quranenc.com") throw new Error("QuranEnc package source identity is invalid.");

  const records: TranslationRecord[] = [];
  const surahPattern = /<sura\s+number="(\d{1,3})"\s*>([\s\S]*?)<\/sura>/gi;
  for (const surahMatch of xml.matchAll(surahPattern)) {
    const chapter = Number(surahMatch[1]);
    const ayahPattern = /<aya\s+number="(\d{1,3})"\s*>([\s\S]*?)<\/aya>/gi;
    for (const ayahMatch of surahMatch[2].matchAll(ayahPattern)) {
      const verse = Number(ayahMatch[1]);
      const translationMatch = ayahMatch[2].match(/<translation>([\s\S]*?)<\/translation>/i);
      const footnotesMatch = ayahMatch[2].match(/<footnotes>([\s\S]*?)<\/footnotes>/i);
      if (!translationMatch || !footnotesMatch) throw new Error(`QuranEnc verse ${chapter}:${verse} is missing translation or footnote fields.`);
      records.push({
        verseKey: `${chapter}:${verse}`,
        translation: unwrapXmlText(translationMatch[1]),
        footnotes: unwrapXmlText(footnotesMatch[1]),
      });
    }
  }
  if (!records.length) throw new Error("QuranEnc package contains no translation records.");
  return records;
}

export class QuranEncTranslationAdapter implements TranslationProviderAdapter {
  readonly #source: TranslationSourceRegistryEntry;

  constructor(source: TranslationSourceRegistryEntry) {
    if (source.provider.name !== "QuranEnc") throw new Error("QuranEnc adapter requires a QuranEnc source entry.");
    this.#source = source;
  }

  describeSource(): TranslationSourceRegistryEntry {
    return this.#source;
  }

  async acquire(request: ProviderRequest): Promise<AcquiredTranslationSource> {
    assertExactProviderRequest(this.#source, request);
    if (!this.#source.provider.packageUrl) throw new Error(`QuranEnc source ${this.#source.sourceId} has no package URL.`);
    const response = await (request.fetchImpl ?? fetch)(this.#source.provider.packageUrl, { redirect: "follow", cache: "no-store", headers: { accept: "application/xml,text/xml;q=0.9" } });
    if (!response.ok) throw new Error(`QuranEnc package request failed with status ${response.status}.`);
    const bytes = await readResponseBytesWithLimit(response);
    return {
      providerName: this.#source.provider.name,
      providerId: this.#source.provider.id,
      bytes,
      contentType: response.headers.get("content-type") ?? "application/xml",
      retrievedAt: new Date().toISOString(),
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    };
  }

  async normalize(acquired: AcquiredTranslationSource): Promise<readonly TranslationRecord[]> {
    if (acquired.providerName !== this.#source.provider.name || acquired.providerId !== this.#source.provider.id) throw new Error("QuranEnc acquired payload identity does not match the requested source.");
    return parseQuranEncXml(this.#source, acquired.bytes);
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
    if (!this.#source.provider.checkForUpdatesUrl) throw new Error("QuranEnc source has no update-check URL.");
    const response = await (request.fetchImpl ?? fetch)(this.#source.provider.checkForUpdatesUrl, { cache: "no-store", redirect: "follow", headers: { accept: "application/json,text/plain;q=0.9" } });
    if (!response.ok) throw new Error(`QuranEnc update check failed with status ${response.status}.`);
    const bytes = await readResponseBytesWithLimit(response, Math.min(MAX_TRANSLATION_PACKAGE_BYTES, 128 * 1024));
    const body = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const observedRevision = body.match(/v?\d+\.\d+\.\d+(?:-xml\.\d+)?/i)?.[0]?.replace(/^v/i, "") ?? null;
    return { updateAvailable: observedRevision !== null && observedRevision !== this.#source.edition.revision, observedRevision };
  }
}

export async function fingerprintQuranEncPackage(source: TranslationSourceRegistryEntry, bytes: Uint8Array): Promise<{ rawChecksum: string; normalizedChecksum: string; records: number }> {
  const records = parseQuranEncXml(source, bytes);
  return {
    rawChecksum: await sha256Hex(bytes),
    normalizedChecksum: await sha256Hex([...records].sort((left, right) => {
      const [lc, lv] = left.verseKey.split(":").map(Number);
      const [rc, rv] = right.verseKey.split(":").map(Number);
      return lc - rc || lv - rv;
    }).map((record) => JSON.stringify({ verseKey: record.verseKey, translation: record.translation, footnotes: record.footnotes })).join("\n") + "\n"),
    records: records.length,
  };
}
