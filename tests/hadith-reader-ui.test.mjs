import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  listHadithCollections,
  getHadithCollection,
  CORE_HADITH_COLLECTION_IDS,
} from "../app/hadith-registry.mjs";
import {
  listHadithRecords,
  getHadithRecord,
  HADEETHENC_DATASET_MANIFEST,
} from "../app/hadith-content.mjs";
import {
  formatHadithTarget,
  parseHadithTarget,
  resolveHadithReference,
  resolveHadithReferenceByCanonicalLabel,
  searchHadithMetadata,
} from "../app/hadith-resolver.mjs";

test("1. Hadith Library exposes all six registered collections", () => {
  const collections = listHadithCollections();
  assert.equal(collections.length, 6);
  const ids = collections.map((c) => c.id);
  assert.deepEqual(ids, [
    "bukhari",
    "muslim",
    "abu-dawud",
    "tirmidhi",
    "nasai",
    "ibn-majah",
  ]);
});

test("2. Sahih Muslim displays exactly 21 locally approved records", () => {
  const allRecords = listHadithRecords();
  const muslimRecords = allRecords.filter((r) => r.collectionId === "muslim");
  assert.equal(muslimRecords.length, 21);
  const numbers = muslimRecords.map((r) => r.canonicalNumber);
  assert.deepEqual(numbers, [
    "8",
    "153",
    "2859",
    "2653",
    "2664",
    "16",
    "15",
    "1401",
    "2607",
    "2865",
    "2548",
    "1827",
    "2553",
    "223",
    "1599",
    "1934",
    "1515",
    "373",
    "2735",
    "2581",
    "2844",
  ]);
});

test("3. Sahih al-Bukhari displays exactly 19 locally approved records", () => {
  const allRecords = listHadithRecords();
  const bukhariRecords = allRecords.filter((r) => r.collectionId === "bukhari");
  assert.equal(bukhariRecords.length, 19);
  const numbers = bukhariRecords.map((r) => r.canonicalNumber);
  assert.deepEqual(numbers, [
    "4485",
    "528",
    "1397",
    "1521",
    "2856",
    "2736",
    "5027",
    "3461",
    "7137",
    "6014",
    "164",
    "272",
    "6954",
    "1471",
    "5232",
    "6389",
    "4699",
    "4712",
    "4779",
  ]);
});

test("4. Abu Dawud and Tirmidhi display one approved record each and the remaining two collections display zero", () => {
  const allRecords = listHadithRecords();

  const abuDawudRecords = allRecords.filter((r) => r.collectionId === "abu-dawud");
  assert.equal(abuDawudRecords.length, 1);
  assert.equal(abuDawudRecords[0].canonicalNumber, "5074");
  assert.equal(abuDawudRecords[0].canonicalLabel, "Sunan Abi Dawud 5074");

  const tirmidhiRecords = allRecords.filter((r) => r.collectionId === "tirmidhi");
  assert.equal(tirmidhiRecords.length, 1);
  assert.equal(tirmidhiRecords[0].canonicalNumber, "2307");
  assert.equal(tirmidhiRecords[0].canonicalLabel, "Jami' at-Tirmidhi 2307");

  for (const collectionId of ["nasai", "ibn-majah"]) {
    const colRecords = allRecords.filter((r) => r.collectionId === collectionId);
    assert.equal(
      colRecords.length,
      0,
      `Collection '${collectionId}' should have 0 approved records`
    );
  }
});

test("5. No complete-corpus claim or fabricated corpus totals appear in UI code or metadata", async () => {
  const [panelCode, contentCode] = await Promise.all([
    readFile(new URL("../app/hadith-reader-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/hadith-content.mjs", import.meta.url), "utf8"),
  ]);

  // Assert no fabricated totals like 7563, 7275, etc.
  assert.doesNotMatch(panelCode, /\b7563\b|\b7275\b|\b4341\b/);
  assert.doesNotMatch(contentCode, /\b7563\b|\b7275\b|\b4341\b/);

  // Assert neutral truth copy
  assert.match(panelCode, /No internally approved Hadith records have been added to/);
  assert.match(panelCode, /More source-verified records can be added as the Hadith library expands/);
});

test("6. Opening Muslim 8 resolves through M9H resolver with translation-approved status", () => {
  const target = "hadith:muslim:8";
  const parsed = parseHadithTarget(target);
  assert.ok(parsed);
  assert.equal(parsed.collectionId, "muslim");
  assert.equal(parsed.number, "8");

  const resolution = resolveHadithReference(parsed);
  assert.equal(resolution.status, "resolved-translation-approved");
  assert.ok(resolution.record);
  assert.equal(resolution.record.id, "muslim:8");
});

test("7. Muslim 8 displays exact approved English translation from HadeethEnc", () => {
  const record = getHadithRecord("muslim:8");
  assert.ok(record);
  assert.equal(record.text?.translations.length, 1);

  const translation = record.text.translations[0];
  assert.equal(translation.language, "en");
  assert.equal(translation.attribution, "HadeethEnc.com");
  assert.equal(translation.version, "v1.25.0");
  assert.equal(translation.status, "translation-approved");
  assert.equal(translation.text.length, 1886);
  assert.equal(
    translation.checksum,
    "f0abe0a43f6a03cb1c557714216cbf0a482feebce284ea3f254219523b50e31c"
  );
  assert.match(
    translation.text,
    /^‘Umar ibn al-Khattāb \(may Allah be pleased with him\) reported: One day, we were sitting with the Messenger of Allah/
  );
});

test("8. Translation source is HadeethEnc.com and dataset version v1.25.0 is surfaced", () => {
  assert.equal(HADEETHENC_DATASET_MANIFEST.attribution, "HadeethEnc.com");
  assert.equal(HADEETHENC_DATASET_MANIFEST.datasetVersion, "v1.25.0");
  assert.equal(HADEETHENC_DATASET_MANIFEST.rightsPolicy, "approved-redistribution");
});

test("9. Provider record 4563 is shown as provenance, distinct from canonical number 8", () => {
  const record = getHadithRecord("muslim:8");
  assert.ok(record);
  assert.equal(record.canonicalNumber, "8");
  assert.equal(record.sourceRecords[0].providerRecordId, "4563");
  assert.notEqual(record.canonicalNumber, record.sourceRecords[0].providerRecordId);
});

test("10. Canonical reference remains 'Sahih Muslim 8'", () => {
  const record = getHadithRecord("muslim:8");
  assert.ok(record);
  assert.equal(record.canonicalLabel, "Sahih Muslim 8");
});

test("11. Arabic unavailable state is surfaced without claiming collection is unavailable", async () => {
  const panelCode = await readFile(
    new URL("../app/hadith-reader-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(
    panelCode,
    /Arabic text is not yet available internally for this record\./
  );
  assert.match(
    panelCode,
    /Arabic text requires scholarly review and rights verification/
  );
});

test("12. No Arabic source text, explanation, or benefits are ingested or rendered in active Hadith content", () => {
  const allRecords = listHadithRecords();
  for (const record of allRecords) {
    assert.equal(record.text?.arabic, null);
    assert.equal(record["explanation"], undefined);
    assert.equal(record["explanation_ar"], undefined);
    assert.equal(record["benefits"], undefined);
    assert.equal(record["benefits_ar"], undefined);
  }
});

test("13. Verified-source external link uses approved HTTPS URL on hadeethenc.com", () => {
  const record = getHadithRecord("muslim:8");
  assert.ok(record);
  assert.equal(
    record.sourceRecords[0].sourceUrl,
    "https://hadeethenc.com/en/browse/hadith/4563"
  );
});

test("14. Malformed and unknown internal targets fail safely without crashing", () => {
  assert.equal(parseHadithTarget("malformed-target"), null);
  assert.equal(parseHadithTarget("hadith:"), null);
  assert.equal(parseHadithTarget("hadith:muslim"), null);

  const unknownColTarget = parseHadithTarget("hadith:unknown:99999");
  assert.ok(unknownColTarget);
  const unknownColResult = resolveHadithReference(unknownColTarget);
  assert.equal(unknownColResult.status, "not-found");
  assert.equal(unknownColResult.record, null);
  assert.match(unknownColResult.reason ?? "", /is not registered/);

  const unknownNumTarget = parseHadithTarget("hadith:muslim:99999");
  assert.ok(unknownNumTarget);
  const unknownNumResult = resolveHadithReference(unknownNumTarget);
  assert.equal(unknownNumResult.status, "not-found");
  assert.equal(unknownNumResult.record, null);
  assert.match(unknownNumResult.reason ?? "", /not found in internal records/);
});

test("15. Valid 'hadith:bukhari:528' opens correct record", () => {
  const parsed = parseHadithTarget("hadith:bukhari:528");
  assert.ok(parsed);
  const result = resolveHadithReference(parsed);
  assert.equal(result.status, "resolved-translation-approved");
  assert.ok(result.record);
  assert.equal(result.record.id, "bukhari:528");
  assert.equal(result.record.canonicalLabel, "Sahih al-Bukhari 528");
  assert.equal(result.sourceRecord?.providerRecordId, "4968");
});

test("16. Search finds Muslim 8 by canonical number and narrator", () => {
  const byNumber = searchHadithMetadata("8");
  assert.ok(byNumber.some((r) => r.id === "muslim:8"));

  const byNarrator = searchHadithMetadata("Umar");
  assert.ok(byNarrator.some((r) => r.id === "muslim:8"));

  const byAbuHurayrah = searchHadithMetadata("Abu Hurayrah");
  assert.ok(byAbuHurayrah.some((r) => r.id === "bukhari:4485"));
});

test("17. Empty search behaves predictably and returns empty array", () => {
  assert.deepEqual(searchHadithMetadata(""), []);
  assert.deepEqual(searchHadithMetadata("   "), []);
});

test("18. Reader component does NOT use dangerouslySetInnerHTML for Hadith text", async () => {
  const panelCode = await readFile(
    new URL("../app/hadith-reader-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(panelCode, /dangerouslySetInnerHTML/);
});

test("19. Strict Domain Separation: Hadith UI has zero dependencies on EducationProgress, Today Study, Evidence, or M9R", async () => {
  const panelCode = await readFile(
    new URL("../app/hadith-reader-panel.tsx", import.meta.url),
    "utf8"
  );
  const forbiddenPatterns = [
    /education-content/i,
    /education-state/i,
    /education-citation/i,
    /today-study/i,
    /evidence-layer/i,
    /EducationCatalog/i,
    /EducationCourse/i,
    /EducationProgress/i,
    /islamic-foundations/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      panelCode,
      pattern,
      `HadithReaderPanel must NOT import or reference ${pattern}`
    );
  }
});

test("20. LearnPanel renders Hadith Library entry and preserves all required hub labels", async () => {
  const learnCode = await readFile(
    new URL("../app/learn-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(learnCode, /HADITH LIBRARY/);
  assert.match(learnCode, /Primary Hadith Collections/);
  assert.match(learnCode, /onOpenHadith/);

  // Preserve all required hub labels from learn-ui.test.mjs
  for (const label of [
    "TODAY&apos;S STUDY",
    "GUIDED COURSES",
    "CURRENT LESSON",
    "LEARNING PROGRESS",
    "MY MUSHAF",
    "QURAN VOCABULARY",
    "TAJWEED",
    "PRIVATE NOTES",
    "READER STUDY",
  ]) {
    assert.match(
      learnCode,
      new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
});

test("21. Initial navigation precedence: invalid initialRecordId does NOT fall through to valid initialCollectionId", async () => {
  const panelCode = await readFile(
    new URL("../app/hadith-reader-panel.tsx", import.meta.url),
    "utf8"
  );

  // Verify deriveInitialHadithState function exists and defines exact precedence
  assert.match(panelCode, /function deriveInitialHadithState\(/);

  // Verify that inside `if (initialRecordId)`, when record is not found, it explicitly returns library state
  // and does NOT fall through to `if (initialCollectionId)`
  const recordBranchMatch = panelCode.match(
    /if\s*\(\s*initialRecordId\s*\)\s*\{[\s\S]*?const record = getHadithRecord\(initialRecordId\);[\s\S]*?if\s*\(\s*record\s*\)\s*\{[\s\S]*?view:\s*"reader"[\s\S]*?\}[\s\S]*?return\s*\{[\s\S]*?view:\s*"library"[\s\S]*?\};?\s*\}/
  );
  assert.ok(
    recordBranchMatch,
    "deriveInitialHadithState must explicitly return library state when initialRecordId is invalid without falling through to initialCollectionId"
  );

  // Verify the full precedence chain in order: initialTarget -> initialRecordId -> initialCollectionId -> library
  const targetIndex = panelCode.indexOf("if (initialTarget)");
  const recordIndex = panelCode.indexOf("if (initialRecordId)");
  const collectionIndex = panelCode.indexOf("if (initialCollectionId)");

  assert.ok(targetIndex > 0, "initialTarget check must exist");
  assert.ok(recordIndex > targetIndex, "initialRecordId must follow initialTarget");
  assert.ok(collectionIndex > recordIndex, "initialCollectionId must follow initialRecordId");

  // Verify helper behavior for all precedence cases
  // A. Valid initialTarget -> resolves to reader
  const validTarget = parseHadithTarget("hadith:muslim:8");
  assert.ok(validTarget);
  const resolvedTarget = resolveHadithReference(validTarget);
  assert.equal(resolvedTarget.status, "resolved-translation-approved");
  assert.ok(resolvedTarget.record);

  // B. Malformed target -> fails safely with error, does not resolve to record
  const malformedTarget = parseHadithTarget("invalid-target");
  assert.equal(malformedTarget, null);

  // C. Valid initialRecordId -> resolves to reader
  const validRecord = getHadithRecord("muslim:8");
  assert.ok(validRecord);
  assert.equal(validRecord.id, "muslim:8");

  // D. Invalid initialRecordId with valid initialCollectionId -> record is null, collection is valid
  const invalidRecord = getHadithRecord("invalid-record-id");
  assert.equal(invalidRecord, null);
  const validCollection = getHadithCollection("muslim");
  assert.ok(validCollection);

  // E. Valid initialCollectionId alone -> resolves to collection
  assert.equal(validCollection.id, "muslim");
});
