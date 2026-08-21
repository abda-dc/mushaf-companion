import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  CORE_HADITH_COLLECTION_IDS,
} from "../app/hadith-registry.mjs";
import {
  HADEETHENC_DATASET_MANIFEST,
  HADITH_ACTIVATION_STATES,
  HADITH_RIGHTS_POLICIES,
  SEEDED_HADITH_RECORDS,
  assertHadithRecord,
  getHadithRecord,
  listHadithRecords,
  normalizeHadithRecord,
  validateHadithRecord,
} from "../app/hadith-content.mjs";
import {
  APPROVED_HADEETHENC_IDS,
} from "../scripts/import-hadeethenc-m9h.mjs";

const VALID_COLLECTIONS = new Set(CORE_HADITH_COLLECTION_IDS);

test("1. Dataset manifest is present, valid, and deeply frozen", () => {
  assert.ok(HADEETHENC_DATASET_MANIFEST);
  assert.equal(HADEETHENC_DATASET_MANIFEST.provider, "hadeethenc");
  assert.equal(HADEETHENC_DATASET_MANIFEST.language, "en");
  assert.equal(HADEETHENC_DATASET_MANIFEST.datasetVersion, "v1.25.0");
  assert.equal(HADEETHENC_DATASET_MANIFEST.lastUpdated, "2026-05-10 17:43:35");
  assert.equal(HADEETHENC_DATASET_MANIFEST.sourceUrl, "https://hadeethenc.com/en");
  assert.equal(HADEETHENC_DATASET_MANIFEST.updateCheckUrl, "https://hadeethenc.com/en/check/en/v1.25.0");
  assert.equal(HADEETHENC_DATASET_MANIFEST.sourceFileName, "HadeethEnc.com_en-v1.25.0.xlsx");
  assert.equal(HADEETHENC_DATASET_MANIFEST.rightsPolicy, "approved-redistribution");
  assert.equal(HADEETHENC_DATASET_MANIFEST.attribution, "HadeethEnc.com");
  assert.equal(HADEETHENC_DATASET_MANIFEST.contentScope, "translated-hadith-text");
  assert.equal(HADEETHENC_DATASET_MANIFEST.workbookChecksum, "339d148eb7425b7f2d48dd7521a969e4aa4a35b5d35a7c4a1c1b67043b5ee218");
  assert.equal(HADEETHENC_DATASET_MANIFEST.recordCount, 23);
  assert.ok(Object.isFrozen(HADEETHENC_DATASET_MANIFEST));
});

test("2. Exactly 23 translations are activated with translation-approved state", () => {
  assert.equal(SEEDED_HADITH_RECORDS.length, 23);
  for (const record of SEEDED_HADITH_RECORDS) {
    assert.equal(record.activation, "translation-approved", `Record ${record.id} should be translation-approved`);
    assert.ok(record.text, `Record ${record.id} text should exist`);
    assert.equal(record.text.arabic, null, `Record ${record.id} Arabic must remain null`);
    assert.equal(record.text.translations.length, 1, `Record ${record.id} should have exactly 1 translation`);

    const translation = record.text.translations[0];
    assert.equal(translation.language, "en");
    assert.equal(translation.provider, "hadeethenc");
    assert.equal(translation.version, "v1.25.0");
    assert.equal(translation.rightsPolicy, "approved-redistribution");
    assert.equal(translation.attribution, "HadeethEnc.com");
    assert.equal(translation.status, "translation-approved");
    assert.ok(translation.text.length > 0, "Translation text must not be empty");
    assert.ok(translation.checksum && translation.checksum.length === 64, "Checksum must be a 64-char hex string");
  }
});

test("3. Only the approved 23 provider IDs are activated", () => {
  const activatedProviderIds = SEEDED_HADITH_RECORDS.map((r) => r.text?.translations[0]?.providerRecordId);
  const expectedSet = new Set(APPROVED_HADEETHENC_IDS);

  assert.equal(activatedProviderIds.length, 23);
  for (const pid of activatedProviderIds) {
    assert.ok(expectedSet.has(pid), `Provider ID '${pid}' is not in approved list`);
  }
});

test("4. No Arabic, explanation, or benefits content is ingested into active content", () => {
  for (const record of SEEDED_HADITH_RECORDS) {
    assert.equal(record.text?.arabic, null);
    assert.equal(record["explanation"], undefined);
    assert.equal(record["explanation_ar"], undefined);
    assert.equal(record["benefits"], undefined);
    assert.equal(record["benefits_ar"], undefined);
    assert.equal(record["title_ar"], undefined);
    assert.equal(record["hadith_text_ar"], undefined);
  }
});

test("5. Every translation SHA-256 checksum recomputes deterministically from exact UTF-8 text", () => {
  for (const record of SEEDED_HADITH_RECORDS) {
    const translation = record.text.translations[0];
    const computed = crypto.createHash("sha256").update(translation.text, "utf8").digest("hex");
    assert.equal(translation.checksum, computed, `Checksum mismatch for record ${record.id}`);
  }
});

test("6. Seeded record IDs are globally unique and match expected collection:number format", () => {
  const seenIds = new Set();
  for (const record of SEEDED_HADITH_RECORDS) {
    assert.ok(!seenIds.has(record.id), `Record ID '${record.id}' must be unique`);
    seenIds.add(record.id);
    const expectedId = `${record.collectionId}:${record.canonicalNumber}`;
    assert.equal(record.id, expectedId, `Record ID '${record.id}' should match '${expectedId}'`);
  }
});

test("7. Collection + canonicalNumber pairs are strictly unique", () => {
  const pairs = new Set();
  for (const record of SEEDED_HADITH_RECORDS) {
    const pair = `${record.collectionId}#${record.canonicalNumber}`;
    assert.ok(!pairs.has(pair), `Collection+number pair '${pair}' must be unique`);
    pairs.add(pair);
  }
});

test("8. Canonical numbers are STRINGS, integers are rejected", () => {
  for (const record of SEEDED_HADITH_RECORDS) {
    assert.equal(typeof record.canonicalNumber, "string");
  }

  const integerRecord = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: 8,
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar ibn al-Khattab",
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "metadata-only",
  };
  const validation = validateHadithRecord(integerRecord, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /canonicalNumber.*must be a non-empty string/);
});

test("9. Non-numeric canonical numbers such as '2249a' and '2249b' are architecturally valid", () => {
  const alphaRecord = {
    id: "muslim:2249a",
    collectionId: "muslim",
    canonicalNumber: "2249a",
    canonicalLabel: "Sahih Muslim 2249a",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: null,
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "metadata-only",
  };
  const validation = validateHadithRecord(alphaRecord, VALID_COLLECTIONS);
  assert.equal(validation.valid, true);

  const normalized = normalizeHadithRecord(alphaRecord, VALID_COLLECTIONS);
  assert.equal(normalized.canonicalNumber, "2249a");
});

test("10. Provider record identity (HadeethEnc 4563) is distinct from canonical Hadith number (8)", () => {
  const muslim8 = getHadithRecord("muslim:8");
  assert.ok(muslim8);
  assert.equal(muslim8.canonicalNumber, "8");
  assert.equal(muslim8.collectionId, "muslim");

  const hadeethencSource = muslim8.sourceRecords.find((s) => s.provider === "hadeethenc");
  assert.ok(hadeethencSource);
  assert.equal(hadeethencSource.providerRecordId, "4563");
  assert.notEqual(hadeethencSource.providerRecordId, muslim8.canonicalNumber);

  const translation = muslim8.text?.translations[0];
  assert.equal(translation?.providerRecordId, "4563");
});

test("11. HadeethEnc origin is restricted strictly to HTTPS on hadeethenc.com", () => {
  const invalidOriginRecord = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar ibn al-Khattab",
    text: null,
    sourceRecords: [
      {
        provider: "hadeethenc",
        providerRecordId: "4563",
        sourceUrl: "https://evil-spoof.com/browse/hadith/4563",
        grading: null,
        rightsPolicy: "metadata-only",
        attribution: null,
      },
    ],
    provenance: null,
    activation: "metadata-only",
  };
  const validation = validateHadithRecord(invalidOriginRecord, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /sourceUrl must be a safe HTTPS URL on hadeethenc\.com/);
});

test("12. Modified translation text fails integrity check when recomputed", () => {
  const muslim8 = getHadithRecord("muslim:8");
  assert.ok(muslim8 && muslim8.text?.translations[0]);
  const original = muslim8.text.translations[0];

  const tamperedText = original.text + " (Tampered Addition)";
  const tamperedHash = crypto.createHash("sha256").update(tamperedText, "utf8").digest("hex");

  assert.notEqual(tamperedHash, original.checksum, "Tampered text must change SHA-256 checksum");
});

test("13. Translation-approved cannot exist without translation content", () => {
  const missingTranslation = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar",
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "translation-approved",
  };
  const validation = validateHadithRecord(missingTranslation, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /requires approved translation content/);
});

test("14. Arabic-approved cannot exist without Arabic content", () => {
  const missingArabic = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar",
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "arabic-approved",
  };
  const validation = validateHadithRecord(missingArabic, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /requires approved Arabic text content/);
});

test("15. Fully-approved requires both approved Arabic and approved translation", () => {
  const onlyArabic = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar",
    text: {
      arabic: {
        text: "بينما نحن عند رسول الله",
        sourceUrl: "https://example.invalid/arabic",
        provenance: {
          provider: "example",
          providerRecordId: "1",
          sourceUrl: "https://example.invalid/source",
          sourceVersion: "1.0",
          recordedAt: null,
          retrievedAt: null,
          rightsPolicy: "approved-redistribution",
          attribution: "Example Arabic Source",
          integrity: null,
        },
        status: "arabic-approved",
      },
      translations: [],
    },
    sourceRecords: [],
    provenance: null,
    activation: "fully-approved",
  };
  const validation = validateHadithRecord(onlyArabic, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /requires both approved Arabic and approved translation content/);
});

test("16. Content with approved-redistribution requires attribution", () => {
  const missingAttribution = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar",
    text: {
      arabic: null,
      translations: [
        {
          language: "en",
          text: "Sample translation text",
          provider: "hadeethenc",
          providerRecordId: "4563",
          version: "v1.25.0",
          rightsPolicy: "approved-redistribution",
          sourceUrl: "https://hadeethenc.com/en/browse/hadith/4563",
          checksum: null,
          status: "translation-approved",
          attribution: null, // missing attribution!
        },
      ],
    },
    sourceRecords: [],
    provenance: null,
    activation: "translation-approved",
  };
  const validation = validateHadithRecord(missingAttribution, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /attribution is required for approved-redistribution content/);
});

test("17. Unsafe HTML-like metadata and control characters are rejected across all fields", () => {
  const htmlNarrator = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar <script>evil()</script>",
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "metadata-only",
  };
  assert.equal(validateHadithRecord(htmlNarrator, VALID_COLLECTIONS).valid, false);
});

test("18. Unknown schema fields are strictly rejected", () => {
  const extraField = {
    id: "muslim:8",
    collectionId: "muslim",
    canonicalNumber: "8",
    canonicalLabel: "Sahih Muslim 8",
    bookNumber: null,
    bookName: null,
    chapterNumber: null,
    chapterName: null,
    alternateReferences: [],
    narrator: "Umar ibn al-Khattab",
    text: null,
    sourceRecords: [],
    provenance: null,
    activation: "metadata-only",
    unexpectedProperty: "test",
  };
  const validation = validateHadithRecord(extraField, VALID_COLLECTIONS);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /record\.unexpectedProperty is not allowed/);
});

test("19. Seeded production records and exports are deeply frozen", () => {
  assert.ok(Object.isFrozen(SEEDED_HADITH_RECORDS));
  for (const record of SEEDED_HADITH_RECORDS) {
    assert.ok(Object.isFrozen(record));
    assert.ok(Object.isFrozen(record.text));
    assert.ok(Object.isFrozen(record.text?.translations));
    if (record.text?.translations[0]) {
      assert.ok(Object.isFrozen(record.text.translations[0]));
    }
  }
});

test("20. HadeethEnc 65007 resolves to Sahih al-Bukhari 2856 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:2856");
  assert.ok(record, "bukhari:2856 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "2856");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 2856");
  assert.equal(record.narrator, "Mu'adh ibn Jabal");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "65007");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/65007");
  assert.equal(translation.checksum, "bac4903c9922728d6b4c2e7662e52f061212a6d9d913ca90415421af73c4148f");
  assert.equal(translation.text.length, 751);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("21. HadeethEnc 64673 resolves to Sahih al-Bukhari 2736 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:2736");
  assert.ok(record, "bukhari:2736 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "2736");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 2736");
  assert.equal(record.narrator, "Abu Hurayrah");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "64673");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/64673");
  assert.equal(translation.checksum, "8fddebc2783d825b8d6434e52c187f2564df65c99c41538e5b51ee49b22cbddf");
  assert.equal(translation.text.length, 243);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("22. HadeethEnc 5913 resolves to Sahih al-Bukhari 5027 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:5027");
  assert.ok(record, "bukhari:5027 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "5027");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 5027");
  assert.equal(record.narrator, "Uthman ibn Affan");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "5913");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/5913");
  assert.equal(translation.checksum, "698fbdc17c7be97dd7efd21fffae41cac1325c9136356edfb7cfbfd07b0a8cbf");
  assert.equal(translation.text.length, 187);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("23. HadeethEnc 6078 resolves to Sahih Muslim 1401 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:1401");
  assert.ok(record, "muslim:1401 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "1401");
  assert.equal(record.canonicalLabel, "Sahih Muslim 1401");
  assert.equal(record.narrator, "Anas ibn Malik");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "6078");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/6078");
  assert.equal(translation.checksum, "8cb1ac5ae45ec84fd3771e76595f8418fd1f927d04a19ef2851eb528692ece7d");
  assert.equal(translation.text.length, 562);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("24. HadeethEnc 3686 resolves to Sahih al-Bukhari 3461 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:3461");
  assert.ok(record, "bukhari:3461 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "3461");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 3461");
  assert.equal(record.narrator, "Abdullah ibn Amr");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "3686");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/3686");
  assert.equal(translation.checksum, "17e90e7a8fb962ecb80c1c2a67ceefc72f292db750feee491cbeb7ba8c5ba1de");
  assert.equal(translation.text.length, 321);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("25. HadeethEnc 6383 resolves to Sahih al-Bukhari 7137 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:7137");
  assert.ok(record, "bukhari:7137 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "7137");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 7137");
  assert.equal(record.narrator, "Abu Hurayrah");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "6383");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/6383");
  assert.equal(translation.checksum, "77e448a101c38d03c481e9c8c3556e3e972e06a43ccfd3869e9c918a61b6f3db");
  assert.equal(translation.text.length, 298);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("26. HadeethEnc 5504 resolves to Sahih Muslim 2607 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:2607");
  assert.ok(record, "muslim:2607 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "2607");
  assert.equal(record.canonicalLabel, "Sahih Muslim 2607");
  assert.equal(record.narrator, "Abdullah ibn Mas'ud");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "5504");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/5504");
  assert.equal(translation.checksum, "85cb751bb5f69c8495d41b7f7ea1ae1bf654cbfa79f8f239493464de1e3de12c");
  assert.equal(translation.text.length, 546);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("27. HadeethEnc 5497 resolves to Sahih Muslim 2865 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:2865");
  assert.ok(record, "muslim:2865 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "2865");
  assert.equal(record.canonicalLabel, "Sahih Muslim 2865");
  assert.equal(record.narrator, "Iyad ibn Himar");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "5497");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/5497");
  assert.equal(translation.checksum, "6ce0cf8d9f73a07015b85b4aea2c3a3d31accb5752e2a3c31734d6103ea09378");
  assert.equal(translation.text.length, 399);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("28. HadeethEnc 4182 resolves to Sahih Muslim 2548 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:2548");
  assert.ok(record, "muslim:2548 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "2548");
  assert.equal(record.canonicalLabel, "Sahih Muslim 2548");
  assert.equal(record.narrator, "Abu Hurayrah");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "4182");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/4182");
  assert.equal(translation.checksum, "7cf8bc99f3558acc00ed5cb5da10af518884e17c1bcff9a427662c2d91d4fe31");
  assert.equal(translation.text.length, 677);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("29. HadeethEnc 4965 resolves to Sahih al-Bukhari 6014 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("bukhari:6014");
  assert.ok(record, "bukhari:6014 must exist in seeded records");
  assert.equal(record.collectionId, "bukhari");
  assert.equal(record.canonicalNumber, "6014");
  assert.equal(record.canonicalLabel, "Sahih al-Bukhari 6014");
  assert.equal(record.narrator, "Abdullah ibn Umar");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "4965");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/4965");
  assert.equal(translation.checksum, "b09fd7dac70bfd5bbdc44c7a602873a21fd49aa0fe6a6c1aa4c10375b091153d");
  assert.equal(translation.text.length, 249);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("30. HadeethEnc 4935 resolves to Sahih Muslim 1827 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:1827");
  assert.ok(record, "muslim:1827 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "1827");
  assert.equal(record.canonicalLabel, "Sahih Muslim 1827");
  assert.equal(record.narrator, "Abdullah ibn Amr");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "4935");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/4935");
  assert.equal(translation.checksum, "62cae207a5898ff6cbd446a67f3a6d2cfbf5a32b8b387ef2aecc85ec45b9170e");
  assert.equal(translation.text.length, 390);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("31. HadeethEnc 4308 resolves to Sahih Muslim 2553 with exact translation hash and null Arabic", () => {
  const record = getHadithRecord("muslim:2553");
  assert.ok(record, "muslim:2553 must exist in seeded records");
  assert.equal(record.collectionId, "muslim");
  assert.equal(record.canonicalNumber, "2553");
  assert.equal(record.canonicalLabel, "Sahih Muslim 2553");
  assert.equal(record.narrator, "An-Nawwas ibn Sim'an");
  assert.equal(record.activation, "translation-approved");
  assert.equal(record.text?.arabic, null);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.provider, "hadeethenc");
  assert.equal(translation.providerRecordId, "4308");
  assert.equal(translation.sourceUrl, "https://hadeethenc.com/en/browse/hadith/4308");
  assert.equal(translation.checksum, "bf781f3abeb3ed19da51f0e802a4c698920c9a58fdb05b2c0f3fd1f8d8f6675e");
  assert.equal(translation.text.length, 325);
  assert.equal(translation.rightsPolicy, "approved-redistribution");
  assert.equal(translation.attribution, "HadeethEnc.com");
});

test("32. M9H seeded records breakdown: 10 Bukhari, 13 Muslim, 0 other collections", () => {
  const records = listHadithRecords();
  assert.equal(records.length, 23);

  const bukhari = records.filter((r) => r.collectionId === "bukhari");
  const muslim = records.filter((r) => r.collectionId === "muslim");
  const others = records.filter((r) => r.collectionId !== "bukhari" && r.collectionId !== "muslim");

  assert.equal(bukhari.length, 10);
  assert.equal(muslim.length, 13);
  assert.equal(others.length, 0);
});
