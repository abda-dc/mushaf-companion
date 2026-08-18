import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  formatHadithTarget,
  getHadithCollection,
  getHadithRecord,
  getHadithSourceRecord,
  listHadithCollections,
  listHadithRecords,
  parseHadithTarget,
  resolveHadithReference,
  resolveHadithReferenceByCanonicalLabel,
  searchHadithMetadata,
} from "../app/hadith-resolver.mjs";

test("1. Resolver finds muslim:8 and returns resolved-translation-approved state", () => {
  const result = resolveHadithReference({ collectionId: "muslim", number: "8" });
  assert.equal(result.status, "resolved-translation-approved");
  assert.equal(result.target, "hadith:muslim:8");
  assert.ok(result.record);
  assert.equal(result.record.id, "muslim:8");
  assert.equal(result.record.canonicalNumber, "8");
  assert.equal(result.record.narrator, "Umar ibn al-Khattab");
  assert.ok(result.collection);
  assert.equal(result.collection.id, "muslim");
  assert.equal(result.collection.displayName, "Sahih Muslim");
  assert.ok(result.sourceRecord);
  assert.equal(result.sourceRecord.provider, "hadeethenc");
  assert.equal(result.sourceRecord.providerRecordId, "4563");
  assert.equal(result.externalUrl, "https://hadeethenc.com/en/browse/hadith/4563");

  // English translation is available internally
  assert.ok(result.record.text?.translations[0]);
  const tr = result.record.text.translations[0];
  assert.equal(tr.language, "en");
  assert.equal(tr.provider, "hadeethenc");
  assert.equal(tr.providerRecordId, "4563");
  assert.equal(tr.version, "v1.25.0");
  assert.equal(tr.status, "translation-approved");
  assert.equal(tr.attribution, "HadeethEnc.com");
  assert.equal(tr.text.length, 1886);
  assert.equal(tr.checksum, "f0abe0a43f6a03cb1c557714216cbf0a482feebce284ea3f254219523b50e31c");
});

test("2. Resolver finds bukhari:4485 by structured reference", () => {
  const result = resolveHadithReference({ collectionId: "bukhari", number: "4485" });
  assert.equal(result.status, "resolved-translation-approved");
  assert.equal(result.target, "hadith:bukhari:4485");
  assert.ok(result.record);
  assert.equal(result.record.id, "bukhari:4485");
  assert.equal(result.record.narrator, "Abu Hurayrah");
  assert.equal(result.collection?.displayName, "Sahih al-Bukhari");
  assert.equal(result.sourceRecord?.providerRecordId, "65046");
  assert.equal(result.externalUrl, "https://hadeethenc.com/en/browse/hadith/65046");
  assert.equal(result.record.text?.translations[0]?.providerRecordId, "65046");
});

test("3. Resolver resolves all 13 seeded records as resolved-translation-approved", () => {
  const allRecords = listHadithRecords();
  assert.equal(allRecords.length, 13);

  for (const record of allRecords) {
    const result = resolveHadithReference({
      collectionId: record.collectionId,
      number: record.canonicalNumber,
    });
    assert.equal(result.status, "resolved-translation-approved");
    assert.equal(result.target, `hadith:${record.collectionId}:${record.canonicalNumber}`);
    assert.equal(result.record?.id, record.id);
    assert.ok(result.record?.text?.translations[0]?.text.length > 0);
  }
});

test("4. Unknown record returns not-found with descriptive reason", () => {
  const result = resolveHadithReference({ collectionId: "muslim", number: "99999" });
  assert.equal(result.status, "not-found");
  assert.equal(result.record, null);
  assert.equal(result.target, null);
  assert.ok(result.collection);
  assert.equal(result.collection.id, "muslim");
  assert.match(result.reason ?? "", /not found in internal records/);
});

test("5. Unknown collection returns not-found", () => {
  const result = resolveHadithReference({ collectionId: "nonexistent-collection", number: "1" });
  assert.equal(result.status, "not-found");
  assert.equal(result.record, null);
  assert.equal(result.collection, null);
  assert.match(result.reason ?? "", /is not registered/);
});

test("6. Internal navigation target formatting and parsing", () => {
  assert.equal(formatHadithTarget("muslim", "8"), "hadith:muslim:8");
  assert.equal(formatHadithTarget("bukhari", "528"), "hadith:bukhari:528");
  assert.equal(formatHadithTarget("abu-dawud", "2249a"), "hadith:abu-dawud:2249a");

  assert.deepEqual(parseHadithTarget("hadith:muslim:8"), {
    collectionId: "muslim",
    number: "8",
  });
  assert.deepEqual(parseHadithTarget("hadith:bukhari:528"), {
    collectionId: "bukhari",
    number: "528",
  });
  assert.deepEqual(parseHadithTarget("hadith:abu-dawud:2249a"), {
    collectionId: "abu-dawud",
    number: "2249a",
  });
});

test("7. Malformed internal navigation targets are rejected safely", () => {
  assert.equal(parseHadithTarget("quran:1:1"), null);
  assert.equal(parseHadithTarget("hadith:"), null);
  assert.equal(parseHadithTarget("hadith:muslim"), null);
  assert.equal(parseHadithTarget("hadith:muslim:"), null);
  assert.equal(parseHadithTarget("hadith:muslim:8:extra"), null);
  assert.equal(parseHadithTarget("hadith:<script>:8"), null);
  assert.equal(parseHadithTarget(null), null);
  assert.equal(parseHadithTarget(undefined), null);
  assert.equal(parseHadithTarget(123), null);

  assert.throws(() => formatHadithTarget("", "8"), /Invalid collectionId/);
  assert.throws(() => formatHadithTarget("muslim", ""), /Invalid number/);
  assert.throws(() => formatHadithTarget("<script>", "8"), /Invalid collectionId/);
});

test("8. Resolves Hadith references by natural and canonical labels", () => {
  const muslim8 = resolveHadithReferenceByCanonicalLabel("Sahih Muslim 8");
  assert.equal(muslim8.status, "resolved-translation-approved");
  assert.equal(muslim8.record?.id, "muslim:8");

  const bukhari528 = resolveHadithReferenceByCanonicalLabel("Sahih al-Bukhari 528");
  assert.equal(bukhari528.status, "resolved-translation-approved");
  assert.equal(bukhari528.record?.id, "bukhari:528");

  const bukhariShort = resolveHadithReferenceByCanonicalLabel("Bukhari 4485");
  assert.equal(bukhariShort.status, "resolved-translation-approved");
  assert.equal(bukhariShort.record?.id, "bukhari:4485");

  const unseededBukhari = resolveHadithReferenceByCanonicalLabel("Sahih al-Bukhari 9999");
  assert.equal(unseededBukhari.status, "not-found");
  assert.equal(unseededBukhari.collection?.id, "bukhari");

  const unrecognized = resolveHadithReferenceByCanonicalLabel("Some Random Book 12");
  assert.equal(unrecognized.status, "not-found");
});

test("9. HadeethEnc source record is distinct from canonical collection numbering", () => {
  const muslim8 = getHadithRecord("muslim:8");
  assert.ok(muslim8);
  const source = getHadithSourceRecord(muslim8, "hadeethenc");
  assert.ok(source);
  assert.equal(source.providerRecordId, "4563");
  assert.equal(muslim8.canonicalNumber, "8");
  assert.notEqual(source.providerRecordId, muslim8.canonicalNumber);
  assert.equal(source.sourceUrl, "https://hadeethenc.com/en/browse/hadith/4563");
});

test("10. Deterministic metadata search across canonical number, label, narrator, and collection", () => {
  const umarResults = searchHadithMetadata("Umar");
  assert.equal(umarResults.length, 1);
  assert.equal(umarResults[0].id, "muslim:8");

  const bukhariResults = searchHadithMetadata("Bukhari");
  assert.equal(bukhariResults.length, 6); // 4485, 528, 1397, 1521, 2856, 2736

  const specificNumber = searchHadithMetadata("4485");
  assert.equal(specificNumber.length, 1);
  assert.equal(specificNumber[0].id, "bukhari:4485");

  const muadhResults = searchHadithMetadata("Mu'adh");
  assert.equal(muadhResults.length, 1);
  assert.equal(muadhResults[0].id, "bukhari:2856");

  const emptySearch = searchHadithMetadata("");
  assert.deepEqual(emptySearch, []);

  const noMatch = searchHadithMetadata("nonexistent term xyz");
  assert.deepEqual(noMatch, []);
});

test("11. Resolver resolves Tawhid Hadith targets bukhari:2856 and bukhari:2736", () => {
  const res2856 = resolveHadithReference({ collectionId: "bukhari", number: "2856" });
  assert.equal(res2856.status, "resolved-translation-approved");
  assert.equal(res2856.target, "hadith:bukhari:2856");
  assert.equal(res2856.record?.id, "bukhari:2856");
  assert.equal(res2856.record?.narrator, "Mu'adh ibn Jabal");
  assert.equal(res2856.sourceRecord?.providerRecordId, "65007");

  const res2736 = resolveHadithReference({ collectionId: "bukhari", number: "2736" });
  assert.equal(res2736.status, "resolved-translation-approved");
  assert.equal(res2736.target, "hadith:bukhari:2736");
  assert.equal(res2736.record?.id, "bukhari:2736");
  assert.equal(res2736.record?.narrator, "Abu Hurayrah");
  assert.equal(res2736.sourceRecord?.providerRecordId, "64673");

  const label2856 = resolveHadithReferenceByCanonicalLabel("Sahih al-Bukhari 2856");
  assert.equal(label2856.status, "resolved-translation-approved");
  assert.equal(label2856.record?.id, "bukhari:2856");

  const label2736 = resolveHadithReferenceByCanonicalLabel("Sahih al-Bukhari 2736");
  assert.equal(label2736.status, "resolved-translation-approved");
  assert.equal(label2736.record?.id, "bukhari:2736");
});

test("12. Strict Domain Separation: No dependencies on Education, Today Study, Evidence, or M9R", async () => {
  const filesToCheck = [
    "app/hadith-registry.mjs",
    "app/hadith-content.mjs",
    "app/hadith-resolver.mjs",
  ];

  const forbiddenImports = [
    /education-content/i,
    /education-state/i,
    /education-citation/i,
    /today-study/i,
    /evidence-layer/i,
    /evidence-panel/i,
    /learn-panel/i,
    /learn-focus/i,
    /EducationCatalog/i,
    /EducationCourse/i,
    /EducationLesson/i,
    /EducationProgress/i,
    /KnowledgeCheck/i,
  ];

  for (const filePath of filesToCheck) {
    const content = await readFile(filePath, "utf-8");
    for (const pattern of forbiddenImports) {
      assert.doesNotMatch(
        content,
        pattern,
        `File '${filePath}' must NOT import or reference forbidden pattern ${pattern}`
      );
    }
  }
});
