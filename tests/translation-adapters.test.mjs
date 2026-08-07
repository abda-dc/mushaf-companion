import assert from "node:assert/strict";
import test from "node:test";

import { findTranslationSource } from "../app/content/source-registry.ts";
import { canonicalVerseKeys } from "../app/content/source-registry.schema.ts";
import { QuranEncTranslationAdapter, parseQuranEncXml } from "../app/content/providers/quranenc-translation.ts";
import { normalizeQuranFoundationText, parseQuranFoundationJson } from "../app/content/providers/quran-foundation-translation.ts";
import {
  MAX_TRANSLATION_PACKAGE_BYTES,
  assertPackageSize,
  assertSafeProviderText,
  auditTranslationRecords,
  canonicalizeTranslationRecords,
  decodeUtf8Strict,
  sha256Hex,
} from "../app/content/providers/types.ts";

function sourceCopy(sourceId) {
  const source = findTranslationSource(sourceId);
  assert.ok(source, `expected registry source ${sourceId}`);
  return structuredClone(source);
}

function completeRecords(text = "ትርጉም") {
  return canonicalVerseKeys().map((verseKey) => ({ verseKey, translation: text, footnotes: "" }));
}

async function fixture(source, records) {
  const bytes = new TextEncoder().encode(`fixture:${source.sourceId}`);
  source.integrity.rawChecksum = await sha256Hex(bytes);
  source.integrity.normalizedChecksum = await sha256Hex(canonicalizeTranslationRecords(records));
  return {
    acquired: {
      providerName: source.provider.name,
      providerId: source.provider.id,
      bytes,
      contentType: "application/octet-stream",
      retrievedAt: "2026-08-07T00:00:00.000Z",
      etag: null,
      lastModified: null,
    },
    source,
  };
}

test("provider adapters reject wrong provider and resource identifiers before fetching", async () => {
  const source = sourceCopy("quranenc:amharic_zain");
  const adapter = new QuranEncTranslationAdapter(source);
  let fetched = false;
  await assert.rejects(
    adapter.acquire({
      providerName: "QuranEnc",
      providerId: "amharic_sadiq",
      fetchImpl: async () => {
        fetched = true;
        throw new Error("must not fetch");
      },
    }),
    /identity mismatch.*no fallback source was used/i,
  );
  assert.equal(fetched, false);
});

test("translation audits reject missing, duplicate, empty, and out-of-bound ayat", async () => {
  const goodRecords = completeRecords();
  const { source, acquired } = await fixture(sourceCopy("quranenc:amharic_zain"), goodRecords);
  assert.equal((await auditTranslationRecords(source, acquired, goodRecords)).valid, true);

  const missing = await auditTranslationRecords(source, acquired, goodRecords.slice(0, -1));
  assert.match(missing.errors.join(" "), /Missing 1 verse keys/);

  const duplicateRecords = [...goodRecords.slice(0, -1), goodRecords[0]];
  const duplicate = await auditTranslationRecords(source, acquired, duplicateRecords);
  assert.match(duplicate.errors.join(" "), /duplicate verse keys/);
  assert.match(duplicate.errors.join(" "), /Missing 1 verse keys/);

  const emptyRecords = goodRecords.map((record, index) => index === 0 ? { ...record, translation: "" } : record);
  const empty = await auditTranslationRecords(source, acquired, emptyRecords);
  assert.match(empty.errors.join(" "), /empty translations/);

  const invalidRecords = goodRecords.map((record, index) => index === 0 ? { ...record, verseKey: "115:1" } : record);
  const invalid = await auditTranslationRecords(source, acquired, invalidRecords);
  assert.match(invalid.errors.join(" "), /invalid chapter\/verse keys/);
});

test("Quran Foundation normalization requires resource 20 and never uses another result", () => {
  const source = sourceCopy("quran-foundation:translation:20");
  const wrongResource = {
    translations: canonicalVerseKeys().map(() => ({ resource_id: 87, text: "Another language" })),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(wrongResource));
  assert.throws(() => parseQuranFoundationJson(source, bytes), /resource identity mismatch.*no fallback source was used/i);
});

test("Unicode survives strict handling for Amharic, Somali, Afaan Oromoo, and Arabic", () => {
  const samples = [
    "በአላህ ስም",
    "Magaca Eebbe",
    "Maqaa Rabbiitiin",
    "بِسْمِ ٱللَّهِ",
  ];
  for (const sample of samples) {
    const roundTrip = decodeUtf8Strict(new TextEncoder().encode(sample));
    assert.equal(roundTrip, sample);
    assert.doesNotThrow(() => assertSafeProviderText(roundTrip));
  }
});

test("unsafe XML and provider markup fail closed", () => {
  const source = sourceCopy("quranenc:amharic_zain");
  const xml = '<!DOCTYPE translation_root [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><translation_root></translation_root>';
  assert.throws(() => parseQuranEncXml(source, new TextEncoder().encode(xml)), /forbidden DTD.*entity/i);
  assert.throws(() => normalizeQuranFoundationText("Safe<script>alert(1)</script>"), /unsafe provider markup/);
  assert.throws(() => normalizeQuranFoundationText("Safe <b>bold</b>"), /unsupported provider markup/);
  assert.throws(() => assertPackageSize(MAX_TRANSLATION_PACKAGE_BYTES + 1), /exceeds the decompressed-size limit/);
});

test("an incomplete QuranEnc pack cannot be built or activated", async () => {
  const records = completeRecords();
  const { source, acquired } = await fixture(sourceCopy("quranenc:amharic_zain"), records);
  const adapter = new QuranEncTranslationAdapter(source);
  await assert.rejects(adapter.buildPack(acquired, records.slice(0, -1)), /validation failed.*Missing 1 verse keys/i);
});
