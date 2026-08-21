import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
  validateIslamicReferenceLibrary,
} from "../app/islamic-reference-library.ts";
import {
  resolveIslamicReferenceHadith,
  getIslamicReferenceHadithTarget,
} from "../app/islamic-reference-hadith-bridge.mjs";
import {
  listHadithCollections,
} from "../app/hadith-registry.mjs";
import {
  listHadithRecords,
  HADEETHENC_DATASET_MANIFEST,
} from "../app/hadith-content.mjs";

function getAllM9RReferences() {
  const library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY;
  return library.collections.flatMap((col) => [
    ...col.references,
    ...col.topics.flatMap((t) => t.references),
  ]);
}

function getM9RHadithReferences() {
  return getAllM9RReferences().filter((r) => r.type === "hadith");
}

test("1. Every existing M9R Hadith reference uses internal-hadith-navigation action", () => {
  const hadithRefs = getM9RHadithReferences();
  assert.equal(hadithRefs.length, 32);
  for (const ref of hadithRefs) {
    assert.equal(ref.action, "internal-hadith-navigation");
  }
});

test("2. Every existing M9R Hadith reference contains canonical collection identity (collectionId)", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    assert.ok(ref.collectionId, `Missing collectionId on ${ref.id}`);
    assert.ok(
      ref.collectionId === "muslim" || ref.collectionId === "bukhari",
      `Unexpected collectionId ${ref.collectionId}`
    );
  }
});

test("3. All existing M9R Hadith references resolve successfully through the bridge", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const result = resolveIslamicReferenceHadith(ref);
    assert.equal(
      result.status,
      "resolved",
      `Failed to resolve ${ref.id}: ${result.reason}`
    );
    assert.ok(result.hadithResolution);
    assert.equal(result.hadithResolution.status, "resolved-translation-approved");
  }
});

test("4. Every resolution returns a valid hadith:* target string", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const target = getIslamicReferenceHadithTarget(ref);
    assert.ok(target);
    assert.match(target, /^hadith:(?:muslim|bukhari):[0-9]+$/);
  }
});

test("5. Every existing mapped record resolves as resolved-translation-approved in M9H", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const result = resolveIslamicReferenceHadith(ref);
    assert.equal(result.hadithResolution?.status, "resolved-translation-approved");
    assert.equal(result.hadithResolution?.record?.activation, "translation-approved");
  }
});

test("6. Every mapped record has exact approved English text available internally", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const result = resolveIslamicReferenceHadith(ref);
    const translations = result.hadithResolution?.record?.text?.translations;
    assert.ok(translations && translations.length > 0);
    assert.equal(translations[0].language, "en");
    assert.equal(translations[0].attribution, "HadeethEnc.com");
    assert.ok(translations[0].text.length > 50);
  }
});

test("7. No M9R record contains the Hadith body, Arabic text, explanation, or benefits", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    assert.equal(ref.contentPolicy, "metadata-only");
    assert.equal(ref["body"], undefined);
    assert.equal(ref["content"], undefined);
    assert.equal(ref["arabic"], undefined);
    assert.equal(ref["explanation"], undefined);
    assert.equal(ref["benefits"], undefined);
  }
});

test("8. HadeethEnc provider IDs remain provenance identity, not canonical numbers", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const result = resolveIslamicReferenceHadith(ref);
    const sourceRecord = result.hadithResolution?.sourceRecord;
    assert.ok(sourceRecord);
    assert.equal(sourceRecord.providerRecordId, ref.sourceRecordId);
    assert.equal(ref.sourceName, "HadeethEnc");
  }
});

test("9. HadeethEnc 4563 resolves to Sahih Muslim 8 (hadith:muslim:8)", () => {
  const imanOverview = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.references.find((r) => r.id === "hadith:iman-overview:hadeethenc-4563");
  assert.ok(imanOverview);

  const result = resolveIslamicReferenceHadith(imanOverview);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:8");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 8");
});

test("10. HadeethEnc 3272 resolves to Sahih Muslim 153 (hadith:muslim:153)", () => {
  const messengersRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-messengers")
    ?.references.find((r) => r.id === "hadith:iman-messengers:hadeethenc-3272");
  assert.ok(messengersRef);

  const result = resolveIslamicReferenceHadith(messengersRef);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:153");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 153");
});

test("11. HadeethEnc 65046 resolves to Sahih al-Bukhari 4485 (hadith:bukhari:4485)", () => {
  const revealedBooksRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-revealed-books")
    ?.references.find((r) => r.id === "hadith:iman-revealed-books:hadeethenc-65046");
  assert.ok(revealedBooksRef);

  const result = resolveIslamicReferenceHadith(revealedBooksRef);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:bukhari:4485");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 4485");
});

test("12. HadeethEnc 5460 resolves to Sahih Muslim 2859 (hadith:muslim:2859)", () => {
  const lastDayRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-last-day")
    ?.references.find((r) => r.id === "hadith:iman-last-day:hadeethenc-5460");
  assert.ok(lastDayRef);

  const result = resolveIslamicReferenceHadith(lastDayRef);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:2859");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2859");
});

test("13. HadeethEnc 65038 resolves to Sahih Muslim 2653 (hadith:muslim:2653)", () => {
  const qadrRef1 = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-qadr")
    ?.references.find((r) => r.id === "hadith:iman-qadr:hadeethenc-65038");
  assert.ok(qadrRef1);

  const result = resolveIslamicReferenceHadith(qadrRef1);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:2653");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2653");
});

test("14. HadeethEnc 5493 resolves to Sahih Muslim 2664 (hadith:muslim:2664)", () => {
  const qadrRef2 = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-qadr")
    ?.references.find((r) => r.id === "hadith:iman-qadr:hadeethenc-5493");
  assert.ok(qadrRef2);

  const result = resolveIslamicReferenceHadith(qadrRef2);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:2664");
  assert.equal(result.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2664");
});

test("15. Batch 1 Five Pillars Hadith references resolve correctly through bridge", () => {
  const islamCollection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "islam");
  assert.ok(islamCollection);

  // Islam overview: Muslim 16 / 65000
  const overviewHadith = islamCollection.references.find((r) => r.id === "hadith:islam-overview:hadeethenc-65000");
  assert.ok(overviewHadith);
  const overviewResult = resolveIslamicReferenceHadith(overviewHadith);
  assert.equal(overviewResult.status, "resolved");
  assert.equal(overviewResult.target, "hadith:muslim:16");
  assert.equal(overviewResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 16");

  // Shahadah: Muslim 8 / 4563
  const shahadahHadith = islamCollection.topics.find((t) => t.id === "islam-shahadah")?.references.find((r) => r.type === "hadith");
  assert.ok(shahadahHadith);
  const shahadahResult = resolveIslamicReferenceHadith(shahadahHadith);
  assert.equal(shahadahResult.status, "resolved");
  assert.equal(shahadahResult.target, "hadith:muslim:8");

  // Salah: Bukhari 528 / 4968
  const salahHadith = islamCollection.topics.find((t) => t.id === "islam-salah")?.references.find((r) => r.type === "hadith");
  assert.ok(salahHadith);
  const salahResult = resolveIslamicReferenceHadith(salahHadith);
  assert.equal(salahResult.status, "resolved");
  assert.equal(salahResult.target, "hadith:bukhari:528");
  assert.equal(salahResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 528");

  // Zakat: Bukhari 1397 / 3689
  const zakatHadith = islamCollection.topics.find((t) => t.id === "islam-zakat")?.references.find((r) => r.type === "hadith");
  assert.ok(zakatHadith);
  const zakatResult = resolveIslamicReferenceHadith(zakatHadith);
  assert.equal(zakatResult.status, "resolved");
  assert.equal(zakatResult.target, "hadith:bukhari:1397");
  assert.equal(zakatResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 1397");

  // Sawm: Muslim 15 / 65003
  const sawmHadith = islamCollection.topics.find((t) => t.id === "islam-sawm")?.references.find((r) => r.type === "hadith");
  assert.ok(sawmHadith);
  const sawmResult = resolveIslamicReferenceHadith(sawmHadith);
  assert.equal(sawmResult.status, "resolved");
  assert.equal(sawmResult.target, "hadith:muslim:15");
  assert.equal(sawmResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 15");

  // Hajj: Bukhari 1521 / 2758
  const hajjHadith = islamCollection.topics.find((t) => t.id === "islam-hajj")?.references.find((r) => r.type === "hadith");
  assert.ok(hajjHadith);
  const hajjResult = resolveIslamicReferenceHadith(hajjHadith);
  assert.equal(hajjResult.status, "resolved");
  assert.equal(hajjResult.target, "hadith:bukhari:1521");
  assert.equal(hajjResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 1521");
});

test("16. Batch 2 Belief in Allah and Belief in the Angels Hadith references resolve correctly through bridge", () => {
  const imanCollection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "iman");
  assert.ok(imanCollection);

  // Belief in Allah: Muslim 8 / 4563
  const allahHadith = imanCollection.topics.find((t) => t.id === "iman-belief-in-allah")?.references.find((r) => r.type === "hadith");
  assert.ok(allahHadith);
  assert.equal(allahHadith.id, "hadith:iman-belief-in-allah:hadeethenc-4563");
  const allahResult = resolveIslamicReferenceHadith(allahHadith);
  assert.equal(allahResult.status, "resolved");
  assert.equal(allahResult.target, "hadith:muslim:8");
  assert.equal(allahResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 8");

  // Belief in the Angels: Muslim 8 / 4563
  const angelsHadith = imanCollection.topics.find((t) => t.id === "iman-belief-in-angels")?.references.find((r) => r.type === "hadith");
  assert.ok(angelsHadith);
  assert.equal(angelsHadith.id, "hadith:iman-belief-in-angels:hadeethenc-4563");
  const angelsResult = resolveIslamicReferenceHadith(angelsHadith);
  assert.equal(angelsResult.status, "resolved");
  assert.equal(angelsResult.target, "hadith:muslim:8");
  assert.equal(angelsResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 8");
});

test("17. Multiple M9R references safely reuse Muslim 8 (Hadith Jibril)", () => {
  const imanRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.references.find((r) => r.id === "hadith:iman-overview:hadeethenc-4563");
  const ihsanRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "ihsan")
    ?.topics.find((t) => t.id === "ihsan-meaning-of-ihsan")
    ?.references.find((r) => r.id === "hadith:ihsan-meaning:hadeethenc-4563");
  const shahadahRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "islam")
    ?.topics.find((t) => t.id === "islam-shahadah")
    ?.references.find((r) => r.id === "hadith:islam-shahadah:hadeethenc-4563");
  const allahRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-allah")
    ?.references.find((r) => r.id === "hadith:iman-belief-in-allah:hadeethenc-4563");
  const angelsRef = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections
    .find((c) => c.id === "iman")
    ?.topics.find((t) => t.id === "iman-belief-in-angels")
    ?.references.find((r) => r.id === "hadith:iman-belief-in-angels:hadeethenc-4563");

  assert.ok(imanRef);
  assert.ok(ihsanRef);
  assert.ok(shahadahRef);
  assert.ok(allahRef);
  assert.ok(angelsRef);

  // Assert all 5 have distinct globally unique reference IDs
  const refIds = new Set([imanRef.id, ihsanRef.id, shahadahRef.id, allahRef.id, angelsRef.id]);
  assert.equal(refIds.size, 5);

  const resIman = resolveIslamicReferenceHadith(imanRef);
  const resIhsan = resolveIslamicReferenceHadith(ihsanRef);
  const resShahadah = resolveIslamicReferenceHadith(shahadahRef);
  const resAllah = resolveIslamicReferenceHadith(allahRef);
  const resAngels = resolveIslamicReferenceHadith(angelsRef);

  assert.equal(resIman.status, "resolved");
  assert.equal(resIhsan.status, "resolved");
  assert.equal(resShahadah.status, "resolved");
  assert.equal(resAllah.status, "resolved");
  assert.equal(resAngels.status, "resolved");

  assert.equal(resIman.target, "hadith:muslim:8");
  assert.equal(resIhsan.target, "hadith:muslim:8");
  assert.equal(resShahadah.target, "hadith:muslim:8");
  assert.equal(resAllah.target, "hadith:muslim:8");
  assert.equal(resAngels.target, "hadith:muslim:8");
});

test("18. M9R reference IDs remain globally unique across all 120 references", () => {
  const allRefs = getAllM9RReferences();
  const ids = allRefs.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 120);
});

test("19. Malformed and unregistered collection ID fails safely", () => {
  const invalidRef = {
    id: "hadith:test:1",
    type: "hadith",
    title: "Test",
    collectionId: "unregistered-collection",
    collection: "Unregistered",
    locator: "1",
    narrator: null,
    grading: { label: "Authentic", authority: "HadeethEnc", reference: null },
    sourceName: "HadeethEnc",
    sourceRecordId: "4563",
    sourceUrl: "https://hadeethenc.com/en/browse/hadith/4563",
    action: "internal-hadith-navigation",
    contentPolicy: "metadata-only",
  };

  const result = resolveIslamicReferenceHadith(invalidRef);
  assert.equal(result.status, "not-found");
  assert.equal(result.target, null);
  assert.match(result.reason ?? "", /is not registered/);
});

test("20. Unknown canonical number fails safely with not-found", () => {
  const unknownNumRef = {
    id: "hadith:test:2",
    type: "hadith",
    title: "Test",
    collectionId: "muslim",
    collection: "Sahih Muslim",
    locator: "999999",
    narrator: null,
    grading: { label: "Authentic", authority: "HadeethEnc", reference: null },
    sourceName: "HadeethEnc",
    sourceRecordId: "4563",
    sourceUrl: "https://hadeethenc.com/en/browse/hadith/4563",
    action: "internal-hadith-navigation",
    contentPolicy: "metadata-only",
  };

  const result = resolveIslamicReferenceHadith(unknownNumRef);
  assert.equal(result.status, "not-found");
  assert.equal(result.target, null);
  assert.match(result.reason ?? "", /not found in internal records/);
});

test("21. Wrong HadeethEnc provider ID produces source-mismatch failure", () => {
  const mismatchRef = {
    id: "hadith:test:3",
    type: "hadith",
    title: "Test",
    collectionId: "muslim",
    collection: "Sahih Muslim",
    locator: "8",
    narrator: null,
    grading: { label: "Authentic", authority: "HadeethEnc", reference: null },
    sourceName: "HadeethEnc",
    sourceRecordId: "99999",
    sourceUrl: "https://hadeethenc.com/en/browse/hadith/99999",
    action: "internal-hadith-navigation",
    contentPolicy: "metadata-only",
  };

  const result = resolveIslamicReferenceHadith(mismatchRef);
  assert.equal(result.status, "source-mismatch");
  assert.equal(result.target, null);
  assert.match(result.reason ?? "", /Source provenance mismatch/);
});

test("22. Non-hadith reference or wrong action produces invalid-reference failure", () => {
  const nonHadith = resolveIslamicReferenceHadith({ type: "quran", id: "test" });
  assert.equal(nonHadith.status, "invalid-reference");

  const wrongAction = resolveIslamicReferenceHadith({
    type: "hadith",
    action: "external-link",
    collectionId: "muslim",
    locator: "8",
  });
  assert.equal(wrongAction.status, "invalid-reference");
});

test("23. External fallback remains approved HadeethEnc HTTPS URL", () => {
  const hadithRefs = getM9RHadithReferences();
  for (const ref of hadithRefs) {
    const result = resolveIslamicReferenceHadith(ref);
    assert.equal(result.externalFallbackUrl, ref.sourceUrl);
    assert.match(result.externalFallbackUrl ?? "", /^https:\/\/hadeethenc\.com\/en\/browse\/hadith\/[0-9]+$/);
  }
});

test("24. Quran references remain unaffected by Hadith integration", () => {
  const quranRefs = getAllM9RReferences().filter((r) => r.type === "quran");
  assert.equal(quranRefs.length, 59);
  for (const ref of quranRefs) {
    assert.equal(ref.action, "internal-quran-navigation");
    assert.ok(ref.verseKeys.length > 0);
  }
});

test("25. Scholarly external references remain unaffected by Hadith integration", () => {
  const scholarlyRefs = getAllM9RReferences().filter((r) => r.type === "scholarly");
  assert.equal(scholarlyRefs.length, 29);
  const content81 = scholarlyRefs.filter((r) => r.sourceUrl === "https://risala.prh.gov.sa/en/content/81");
  const content251 = scholarlyRefs.filter((r) => r.sourceUrl === "https://risala.prh.gov.sa/en/content/251");
  assert.equal(content81.length, 26);
  assert.equal(content251.length, 3);
  for (const ref of scholarlyRefs) {
    assert.equal(ref.action, "external-link");
    assert.equal(ref.sourceName, "Alharamain's Message");
    assert.notEqual(ref.sourceUrl, "https://risala.prh.gov.sa/en/content/381");
  }
});

test("26. M9R collection/topic/reference counts reflect Batch 6 additions", () => {
  const library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY;
  assert.equal(library.collections.length, 10);
  const allTopics = library.collections.flatMap((c) => c.topics);
  assert.equal(allTopics.length, 49);
  const readyTopics = allTopics.filter((t) => t.status === "reference-ready");
  assert.equal(readyTopics.length, 30);
  const plannedTopics = allTopics.filter((t) => t.status === "planned");
  assert.equal(plannedTopics.length, 19);

  const allRefs = getAllM9RReferences();
  assert.equal(allRefs.length, 120);
  assert.equal(getM9RHadithReferences().length, 32);

  // Exactly 27 unique Hadith internal targets
  const uniqueTargets = new Set(
    getM9RHadithReferences().map((r) => getIslamicReferenceHadithTarget(r))
  );
  assert.equal(uniqueTargets.size, 27);
});

test("27. M9H collection/content counts reflect approved seeded records", () => {
  const collections = listHadithCollections();
  assert.equal(collections.length, 6);

  const records = listHadithRecords();
  assert.equal(records.length, 27);
  const approved = records.filter((r) => r.activation === "translation-approved");
  assert.equal(approved.length, 27);

  assert.equal(HADEETHENC_DATASET_MANIFEST.datasetVersion, "v1.25.0");
});

test("28. Tawhid Hadith references resolve correctly through bridge and support multi-citation reuse of 65007", () => {
  const tawhidCollection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "tawhid");
  assert.ok(tawhidCollection);

  // Tawhid Worship: Bukhari 2856 / 65007
  const worshipHadith = tawhidCollection.topics.find((t) => t.id === "tawhid-worship-of-allah-alone")?.references.find((r) => r.type === "hadith");
  assert.ok(worshipHadith);
  assert.equal(worshipHadith.id, "hadith:tawhid-worship:hadeethenc-65007");
  const worshipResult = resolveIslamicReferenceHadith(worshipHadith);
  assert.equal(worshipResult.status, "resolved");
  assert.equal(worshipResult.target, "hadith:bukhari:2856");
  assert.equal(worshipResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 2856");
  assert.equal(worshipResult.hadithResolution?.record?.narrator, "Mu'adh ibn Jabal");

  // Tawhid Names: Bukhari 2736 / 64673
  const namesHadith = tawhidCollection.topics.find((t) => t.id === "tawhid-names-and-attributes")?.references.find((r) => r.type === "hadith");
  assert.ok(namesHadith);
  assert.equal(namesHadith.id, "hadith:tawhid-names:hadeethenc-64673");
  const namesResult = resolveIslamicReferenceHadith(namesHadith);
  assert.equal(namesResult.status, "resolved");
  assert.equal(namesResult.target, "hadith:bukhari:2736");
  assert.equal(namesResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 2736");
  assert.equal(namesResult.hadithResolution?.record?.narrator, "Abu Hurayrah");

  // Tawhid Shirk: Bukhari 2856 / 65007 (Reused record, distinct M9R ID)
  const shirkHadith = tawhidCollection.topics.find((t) => t.id === "tawhid-shirk")?.references.find((r) => r.type === "hadith");
  assert.ok(shirkHadith);
  assert.equal(shirkHadith.id, "hadith:tawhid-shirk:hadeethenc-65007");
  const shirkResult = resolveIslamicReferenceHadith(shirkHadith);
  assert.equal(shirkResult.status, "resolved");
  assert.equal(shirkResult.target, "hadith:bukhari:2856");
  assert.equal(shirkResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 2856");

  // Verify two distinct M9R citation IDs resolve to the same underlying M9H record
  assert.notEqual(worshipHadith.id, shirkHadith.id);
  assert.equal(worshipResult.hadithResolution?.record?.id, shirkResult.hadithResolution?.record?.id);
});

test("29. Core M9H modules have no M9R dependency", async () => {
  const [registryCode, contentCode, resolverCode] = await Promise.all([
    readFile(new URL("../app/hadith-registry.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/hadith-content.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/hadith-resolver.mjs", import.meta.url), "utf8"),
  ]);

  const forbiddenM9R = /islamic-reference|islamic-foundations/i;
  assert.doesNotMatch(registryCode, forbiddenM9R);
  assert.doesNotMatch(contentCode, forbiddenM9R);
  assert.doesNotMatch(resolverCode, forbiddenM9R);
});

test("30. Bridge module does not duplicate Hadith text", async () => {
  const bridgeCode = await readFile(
    new URL("../app/islamic-reference-hadith-bridge.mjs", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(bridgeCode, /‘Umar ibn al-Khattāb|Messenger of Allah|Prophet/i);
});

test("31. Bridge uses M9H resolver and formatHadithTarget rather than a second resolver", async () => {
  const bridgeCode = await readFile(
    new URL("../app/islamic-reference-hadith-bridge.mjs", import.meta.url),
    "utf8"
  );
  assert.match(bridgeCode, /resolveHadithReference/);
  assert.match(bridgeCode, /formatHadithTarget/);
});

test("32. Validated production reference library is deeply frozen", () => {
  assert.ok(Object.isFrozen(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY));
  assert.ok(Object.isFrozen(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections));
  assert.ok(Object.isFrozen(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections[0].references));
  assert.ok(Object.isFrozen(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections[1].references));
});

test("33. Strict Domain Separation: No EducationProgress dependency", async () => {
  const bridgeCode = await readFile(
    new URL("../app/islamic-reference-hadith-bridge.mjs", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(bridgeCode, /EducationProgress|education-state/i);
});

test("34. Strict Domain Separation: No Today Study dependency", async () => {
  const bridgeCode = await readFile(
    new URL("../app/islamic-reference-hadith-bridge.mjs", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(bridgeCode, /today-study|TodayStudy/i);
});

test("35. Strict Domain Separation: No Evidence dependency", async () => {
  const bridgeCode = await readFile(
    new URL("../app/islamic-reference-hadith-bridge.mjs", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(bridgeCode, /evidence-layer|evidence-query/i);
});

test("36. Qur'an and Sunnah Batch 4 Hadith references resolve correctly through bridge with 6078 canonicalized to Sahih Muslim 1401", () => {
  const qsCollection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "quran-and-sunnah");
  assert.ok(qsCollection);

  // 1. Qur'an: Bukhari 5027 / 5913
  const quranHadith = qsCollection.topics.find((t) => t.id === "quran-and-sunnah-quran")?.references.find((r) => r.type === "hadith");
  assert.ok(quranHadith);
  assert.equal(quranHadith.id, "hadith:quran-sunnah-quran:hadeethenc-5913");
  assert.equal(quranHadith.collectionId, "bukhari");
  assert.equal(quranHadith.locator, "5027");
  assert.equal(quranHadith.sourceRecordId, "5913");
  const quranResult = resolveIslamicReferenceHadith(quranHadith);
  assert.equal(quranResult.status, "resolved");
  assert.equal(quranResult.target, "hadith:bukhari:5027");
  assert.equal(quranResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 5027");
  assert.equal(quranResult.hadithResolution?.record?.narrator, "Uthman ibn Affan");

  // 2. Sunnah: Muslim 1401 / 6078 (explicit provider-aligned canonical target)
  const sunnahHadith = qsCollection.topics.find((t) => t.id === "quran-and-sunnah-sunnah")?.references.find((r) => r.type === "hadith");
  assert.ok(sunnahHadith);
  assert.equal(sunnahHadith.id, "hadith:quran-sunnah-sunnah:hadeethenc-6078");
  assert.equal(sunnahHadith.collectionId, "muslim");
  assert.equal(sunnahHadith.locator, "1401");
  assert.equal(sunnahHadith.sourceRecordId, "6078");
  const sunnahResult = resolveIslamicReferenceHadith(sunnahHadith);
  assert.equal(sunnahResult.status, "resolved");
  assert.equal(sunnahResult.target, "hadith:muslim:1401");
  assert.notEqual(sunnahResult.target, "hadith:bukhari:5063");
  assert.equal(sunnahResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 1401");
  assert.equal(sunnahResult.hadithResolution?.record?.narrator, "Anas ibn Malik");

  // 3. Hadith: Bukhari 3461 / 3686
  const hadithHadith = qsCollection.topics.find((t) => t.id === "quran-and-sunnah-hadith")?.references.find((r) => r.type === "hadith");
  assert.ok(hadithHadith);
  assert.equal(hadithHadith.id, "hadith:quran-sunnah-hadith:hadeethenc-3686");
  assert.equal(hadithHadith.collectionId, "bukhari");
  assert.equal(hadithHadith.locator, "3461");
  assert.equal(hadithHadith.sourceRecordId, "3686");
  const hadithResult = resolveIslamicReferenceHadith(hadithHadith);
  assert.equal(hadithResult.status, "resolved");
  assert.equal(hadithResult.target, "hadith:bukhari:3461");
  assert.equal(hadithResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 3461");
  assert.equal(hadithResult.hadithResolution?.record?.narrator, "Abdullah ibn Amr");

  // 4. Relationship: Bukhari 7137 / 6383
  const relHadith = qsCollection.topics.find((t) => t.id === "quran-and-sunnah-relationship-between-quran-and-sunnah")?.references.find((r) => r.type === "hadith");
  assert.ok(relHadith);
  assert.equal(relHadith.id, "hadith:quran-sunnah-relationship:hadeethenc-6383");
  assert.equal(relHadith.collectionId, "bukhari");
  assert.equal(relHadith.locator, "7137");
  assert.equal(relHadith.sourceRecordId, "6383");
  const relResult = resolveIslamicReferenceHadith(relHadith);
  assert.equal(relResult.status, "resolved");
  assert.equal(relResult.target, "hadith:bukhari:7137");
  assert.equal(relResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 7137");
  assert.equal(relResult.hadithResolution?.record?.narrator, "Abu Hurayrah");
});

test("37. Akhlaq and Adab Batch 5 Hadith references resolve correctly through bridge", () => {
  const collection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "akhlaq-and-adab");
  assert.ok(collection);

  // 1. Truthfulness: Muslim 2607 / 5504
  const truthHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-truthfulness")?.references.find((r) => r.type === "hadith");
  assert.ok(truthHadith);
  assert.equal(truthHadith.id, "hadith:akhlaq-and-adab-truthfulness:hadeethenc-5504");
  assert.equal(truthHadith.collectionId, "muslim");
  assert.equal(truthHadith.locator, "2607");
  assert.equal(truthHadith.sourceRecordId, "5504");
  const truthResult = resolveIslamicReferenceHadith(truthHadith);
  assert.equal(truthResult.status, "resolved");
  assert.equal(truthResult.target, "hadith:muslim:2607");
  assert.equal(truthResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2607");
  assert.equal(truthResult.hadithResolution?.record?.narrator, "Abdullah ibn Mas'ud");

  // 2. Humility: Muslim 2865 / 5497
  const humilityHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-humility")?.references.find((r) => r.type === "hadith");
  assert.ok(humilityHadith);
  assert.equal(humilityHadith.id, "hadith:akhlaq-and-adab-humility:hadeethenc-5497");
  assert.equal(humilityHadith.collectionId, "muslim");
  assert.equal(humilityHadith.locator, "2865");
  assert.equal(humilityHadith.sourceRecordId, "5497");
  const humilityResult = resolveIslamicReferenceHadith(humilityHadith);
  assert.equal(humilityResult.status, "resolved");
  assert.equal(humilityResult.target, "hadith:muslim:2865");
  assert.equal(humilityResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2865");
  assert.equal(humilityResult.hadithResolution?.record?.narrator, "Iyad ibn Himar");

  // 3. Parents and Family: Muslim 2548 / 4182
  const parentsHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-parents-and-family")?.references.find((r) => r.type === "hadith");
  assert.ok(parentsHadith);
  assert.equal(parentsHadith.id, "hadith:akhlaq-and-adab-parents-and-family:hadeethenc-4182");
  assert.equal(parentsHadith.collectionId, "muslim");
  assert.equal(parentsHadith.locator, "2548");
  assert.equal(parentsHadith.sourceRecordId, "4182");
  const parentsResult = resolveIslamicReferenceHadith(parentsHadith);
  assert.equal(parentsResult.status, "resolved");
  assert.equal(parentsResult.target, "hadith:muslim:2548");
  assert.equal(parentsResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2548");
  assert.equal(parentsResult.hadithResolution?.record?.narrator, "Abu Hurayrah");

  // 4. Neighbors: Bukhari 6014 / 4965
  const neighborsHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-neighbors")?.references.find((r) => r.type === "hadith");
  assert.ok(neighborsHadith);
  assert.equal(neighborsHadith.id, "hadith:akhlaq-and-adab-neighbors:hadeethenc-4965");
  assert.equal(neighborsHadith.collectionId, "bukhari");
  assert.equal(neighborsHadith.locator, "6014");
  assert.equal(neighborsHadith.sourceRecordId, "4965");
  const neighborsResult = resolveIslamicReferenceHadith(neighborsHadith);
  assert.equal(neighborsResult.status, "resolved");
  assert.equal(neighborsResult.target, "hadith:bukhari:6014");
  assert.equal(neighborsResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 6014");
  assert.equal(neighborsResult.hadithResolution?.record?.narrator, "Abdullah ibn Umar");

  // 5. Justice: Muslim 1827 / 4935
  const justiceHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-justice")?.references.find((r) => r.type === "hadith");
  assert.ok(justiceHadith);
  assert.equal(justiceHadith.id, "hadith:akhlaq-and-adab-justice:hadeethenc-4935");
  assert.equal(justiceHadith.collectionId, "muslim");
  assert.equal(justiceHadith.locator, "1827");
  assert.equal(justiceHadith.sourceRecordId, "4935");
  const justiceResult = resolveIslamicReferenceHadith(justiceHadith);
  assert.equal(justiceResult.status, "resolved");
  assert.equal(justiceResult.target, "hadith:muslim:1827");
  assert.equal(justiceResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 1827");
  assert.equal(justiceResult.hadithResolution?.record?.narrator, "Abdullah ibn Amr");

  // 6. Good Manners: Muslim 2553 / 4308
  const mannersHadith = collection.topics.find((t) => t.id === "akhlaq-and-adab-good-manners")?.references.find((r) => r.type === "hadith");
  assert.ok(mannersHadith);
  assert.equal(mannersHadith.id, "hadith:akhlaq-and-adab-good-manners:hadeethenc-4308");
  assert.equal(mannersHadith.collectionId, "muslim");
  assert.equal(mannersHadith.locator, "2553");
  assert.equal(mannersHadith.sourceRecordId, "4308");
  const mannersResult = resolveIslamicReferenceHadith(mannersHadith);
  assert.equal(mannersResult.status, "resolved");
  assert.equal(mannersResult.target, "hadith:muslim:2553");
  assert.equal(mannersResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 2553");
  assert.equal(mannersResult.hadithResolution?.record?.narrator, "An-Nawwas ibn Sim'an");
});

test("38. All four Taharah Hadith references resolve correctly through generic bridge", () => {
  const collection = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find((c) => c.id === "taharah");
  assert.ok(collection);
  assert.equal(collection.topics.length, 4);

  // 1. Purification: Muslim 223 / 65004
  const purificationHadith = collection.topics.find((t) => t.id === "taharah-purification")?.references.find((r) => r.type === "hadith");
  assert.ok(purificationHadith);
  assert.equal(purificationHadith.id, "hadith:taharah-purification:hadeethenc-65004");
  assert.equal(purificationHadith.collectionId, "muslim");
  assert.equal(purificationHadith.locator, "223");
  assert.equal(purificationHadith.sourceRecordId, "65004");
  const purificationResult = resolveIslamicReferenceHadith(purificationHadith);
  assert.equal(purificationResult.status, "resolved");
  assert.equal(purificationResult.target, "hadith:muslim:223");
  assert.equal(purificationResult.hadithResolution?.record?.canonicalLabel, "Sahih Muslim 223");
  assert.equal(purificationResult.hadithResolution?.record?.narrator, "Abu Malik al-Ash'ari");

  // 2. Wudu: Bukhari 164 / 3313
  const wuduHadith = collection.topics.find((t) => t.id === "taharah-wudu")?.references.find((r) => r.type === "hadith");
  assert.ok(wuduHadith);
  assert.equal(wuduHadith.id, "hadith:taharah-wudu:hadeethenc-3313");
  assert.equal(wuduHadith.collectionId, "bukhari");
  assert.equal(wuduHadith.locator, "164");
  assert.equal(wuduHadith.sourceRecordId, "3313");
  const wuduResult = resolveIslamicReferenceHadith(wuduHadith);
  assert.equal(wuduResult.status, "resolved");
  assert.equal(wuduResult.target, "hadith:bukhari:164");
  assert.equal(wuduResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 164");
  assert.equal(wuduResult.hadithResolution?.record?.narrator, "Uthman ibn Affan");

  // 3. Ghusl: Bukhari 272 / 3316
  const ghuslHadith = collection.topics.find((t) => t.id === "taharah-ghusl")?.references.find((r) => r.type === "hadith");
  assert.ok(ghuslHadith);
  assert.equal(ghuslHadith.id, "hadith:taharah-ghusl:hadeethenc-3316");
  assert.equal(ghuslHadith.collectionId, "bukhari");
  assert.equal(ghuslHadith.locator, "272");
  assert.equal(ghuslHadith.sourceRecordId, "3316");
  const ghuslResult = resolveIslamicReferenceHadith(ghuslHadith);
  assert.equal(ghuslResult.status, "resolved");
  assert.equal(ghuslResult.target, "hadith:bukhari:272");
  assert.equal(ghuslResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 272");
  assert.equal(ghuslResult.hadithResolution?.record?.narrator, "Aishah");

  // 4. Cleanliness and Prayer: Bukhari 6954 / 3534
  const cleanlinessHadith = collection.topics.find((t) => t.id === "taharah-cleanliness-and-prayer")?.references.find((r) => r.type === "hadith");
  assert.ok(cleanlinessHadith);
  assert.equal(cleanlinessHadith.id, "hadith:taharah-cleanliness-and-prayer:hadeethenc-3534");
  assert.equal(cleanlinessHadith.collectionId, "bukhari");
  assert.equal(cleanlinessHadith.locator, "6954");
  assert.equal(cleanlinessHadith.sourceRecordId, "3534");
  const cleanlinessResult = resolveIslamicReferenceHadith(cleanlinessHadith);
  assert.equal(cleanlinessResult.status, "resolved");
  assert.equal(cleanlinessResult.target, "hadith:bukhari:6954");
  assert.equal(cleanlinessResult.hadithResolution?.record?.canonicalLabel, "Sahih al-Bukhari 6954");
  assert.equal(cleanlinessResult.hadithResolution?.record?.narrator, "Abu Hurayrah");
});
