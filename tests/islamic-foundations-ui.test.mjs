import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
} from "../app/islamic-reference-library.ts";
import {
  computeCollectionReadiness,
  formatCollectionReadinessLabel,
  groupReferencesByType,
  listCollectionsForUi,
  getCollectionForUi,
  getTopicForUi,
  searchFoundationsLibrary,
  resolveIslamicReferenceHadith,
  getIslamicReferenceHadithTarget,
} from "../app/islamic-foundations-ui-state.mjs";
import { listHadithCollections } from "../app/hadith-registry.mjs";
import { listHadithRecords } from "../app/hadith-content.mjs";

test("1. Islamic Foundations entry exists in Learn panel", async () => {
  const learnCode = await readFile(
    new URL("../app/learn-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(learnCode, /<span>ISLAMIC FOUNDATIONS<\/span>/);
  assert.match(learnCode, /<h3 id="islamic-foundations-title">Reference Library<\/h3>/);
  assert.match(learnCode, /Browse Islamic Foundations/);
  assert.match(learnCode, /onOpenFoundations/);
});

test("2. Existing Hadith Library entry remains intact in Learn panel", async () => {
  const learnCode = await readFile(
    new URL("../app/learn-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(learnCode, /<span>HADITH LIBRARY<\/span>/);
  assert.match(learnCode, /<h3 id="hadith-library-title">Primary Hadith Collections<\/h3>/);
  assert.match(learnCode, /Browse Hadith Library/);
  assert.match(learnCode, /\{hadithAvailableCount\} available/);
});

test("3. All 10 M9R collections are represented in listCollectionsForUi", () => {
  const list = listCollectionsForUi();
  assert.equal(list.length, 10);
  const expectedIds = [
    "islam",
    "iman",
    "ihsan",
    "tawhid",
    "quran-and-sunnah",
    "akhlaq-and-adab",
    "taharah",
    "halal-and-haram",
    "dua-and-dhikr",
    "akhirah",
  ];
  assert.deepEqual(
    list.map((c) => c.id),
    expectedIds
  );
});

test("4. Collection counts derive dynamically from production data", () => {
  const list = listCollectionsForUi();
  const totalTopics = list.reduce((sum, c) => sum + c.topicsCount, 0);
  const readyTopics = list.reduce((sum, c) => sum + c.readyTopicsCount, 0);
  const plannedTopics = list.reduce((sum, c) => sum + c.plannedTopicsCount, 0);

  assert.equal(totalTopics, 49);
  assert.equal(readyTopics, 46);
  assert.equal(plannedTopics, 3);
});

test("5. Islam shows all 5 topics ready", () => {
  const islam = listCollectionsForUi().find((c) => c.id === "islam");
  assert.ok(islam);
  assert.equal(islam.topicsCount, 5);
  assert.equal(islam.readyTopicsCount, 5);
  assert.equal(islam.plannedTopicsCount, 0);
  assert.equal(islam.readinessState, "fully-ready");
  assert.equal(islam.readinessLabel, "5 of 5 topics source-ready");
  assert.equal(islam.overviewReferencesCount, 2);
  assert.equal(islam.totalReferencesCount, 22);
});

test("6. Iman shows all 6 topics ready", () => {
  const iman = listCollectionsForUi().find((c) => c.id === "iman");
  assert.ok(iman);
  assert.equal(iman.topicsCount, 6);
  assert.equal(iman.readyTopicsCount, 6);
  assert.equal(iman.plannedTopicsCount, 0);
  assert.equal(iman.readinessState, "fully-ready");
  assert.equal(iman.readinessLabel, "6 of 6 topics source-ready");
  assert.equal(iman.overviewReferencesCount, 5);
  assert.equal(iman.totalReferencesCount, 34);
});

test("7. Ihsan truthfully shows partial readiness", () => {
  const ihsan = listCollectionsForUi().find((c) => c.id === "ihsan");
  assert.ok(ihsan);
  assert.equal(ihsan.topicsCount, 4);
  assert.equal(ihsan.readyTopicsCount, 1);
  assert.equal(ihsan.plannedTopicsCount, 3);
  assert.equal(ihsan.readinessState, "partially-ready");
  assert.equal(ihsan.readinessLabel, "1 source-ready · 3 planned");
  assert.equal(ihsan.overviewReferencesCount, 0);
  assert.equal(ihsan.totalReferencesCount, 1);
});

test("8. Tawhid shows all 4 topics ready", () => {
  const tawhid = listCollectionsForUi().find((c) => c.id === "tawhid");
  assert.ok(tawhid);
  assert.equal(tawhid.topicsCount, 4);
  assert.equal(tawhid.readyTopicsCount, 4);
  assert.equal(tawhid.plannedTopicsCount, 0);
  assert.equal(tawhid.readinessState, "fully-ready");
  assert.equal(tawhid.readinessLabel, "4 of 4 topics source-ready");
  assert.equal(tawhid.overviewReferencesCount, 0);
  assert.equal(tawhid.totalReferencesCount, 16);
});

test("8b. Qur'an and Sunnah shows all 4 topics ready", () => {
  const qs = listCollectionsForUi().find((c) => c.id === "quran-and-sunnah");
  assert.ok(qs);
  assert.equal(qs.topicsCount, 4);
  assert.equal(qs.readyTopicsCount, 4);
  assert.equal(qs.plannedTopicsCount, 0);
  assert.equal(qs.readinessState, "fully-ready");
  assert.equal(qs.readinessLabel, "4 of 4 topics source-ready");
  assert.equal(qs.overviewReferencesCount, 0);
  assert.equal(qs.totalReferencesCount, 15);
});

test("8c. Akhlaq and Adab shows all 6 topics ready", () => {
  const akhlaq = listCollectionsForUi().find((c) => c.id === "akhlaq-and-adab");
  assert.ok(akhlaq);
  assert.equal(akhlaq.topicsCount, 6);
  assert.equal(akhlaq.readyTopicsCount, 6);
  assert.equal(akhlaq.plannedTopicsCount, 0);
  assert.equal(akhlaq.readinessState, "fully-ready");
  assert.equal(akhlaq.readinessLabel, "6 of 6 topics source-ready");
  assert.equal(akhlaq.overviewReferencesCount, 0);
  assert.equal(akhlaq.totalReferencesCount, 21);
});

test("8d. Taharah shows all 4 topics ready", () => {
  const taharah = listCollectionsForUi().find((c) => c.id === "taharah");
  assert.ok(taharah);
  assert.equal(taharah.topicsCount, 4);
  assert.equal(taharah.readyTopicsCount, 4);
  assert.equal(taharah.plannedTopicsCount, 0);
  assert.equal(taharah.readinessState, "fully-ready");
  assert.equal(taharah.readinessLabel, "4 of 4 topics source-ready");
  assert.equal(taharah.overviewReferencesCount, 0);
  assert.equal(taharah.totalReferencesCount, 11);
});

test("8e. Halal and Haram shows all 5 topics ready", () => {
  const halal = listCollectionsForUi().find((c) => c.id === "halal-and-haram");
  assert.ok(halal);
  assert.equal(halal.topicsCount, 5);
  assert.equal(halal.readyTopicsCount, 5);
  assert.equal(halal.plannedTopicsCount, 0);
  assert.equal(halal.readinessState, "fully-ready");
  assert.equal(halal.readinessLabel, "5 of 5 topics source-ready");
  assert.equal(halal.overviewReferencesCount, 0);
  assert.equal(halal.totalReferencesCount, 12);
});

test("8f. Du'a and Dhikr shows all 4 topics ready", () => {
  const dua = listCollectionsForUi().find((c) => c.id === "dua-and-dhikr");
  assert.ok(dua);
  assert.equal(dua.topicsCount, 4);
  assert.equal(dua.readyTopicsCount, 4);
  assert.equal(dua.plannedTopicsCount, 0);
  assert.equal(dua.readinessState, "fully-ready");
  assert.equal(dua.readinessLabel, "4 of 4 topics source-ready");
  assert.equal(dua.overviewReferencesCount, 0);
  assert.equal(dua.totalReferencesCount, 8);
});

test("9. Akhirah collection shows all 7 topics ready", () => {
  const akhirah = listCollectionsForUi().find((c) => c.id === "akhirah");
  assert.ok(akhirah);
  assert.equal(akhirah.topicsCount, 7);
  assert.equal(akhirah.readyTopicsCount, 7);
  assert.equal(akhirah.readinessState, "fully-ready");
});

test("10. Planned topic cannot fabricate references", () => {
  const topic = getTopicForUi("ihsan", "ihsan-sincerity");
  assert.ok(topic);
  assert.equal(topic.status, "planned");
  assert.equal(topic.references.length, 0);
  assert.equal(topic.referencesCount, 0);
  assert.equal(topic.groupedReferences.quran.length, 0);
  assert.equal(topic.groupedReferences.hadith.length, 0);
  assert.equal(topic.groupedReferences.scholarly.length, 0);
});

test("11. Planned topic has zero production references across all 3 planned topics", () => {
  const library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY;
  const plannedTopics = library.collections.flatMap((c) =>
    c.topics.filter((t) => t.status === "planned")
  );
  assert.equal(plannedTopics.length, 3);
  for (const topic of plannedTopics) {
    assert.equal(topic.references.length, 0);
  }
});

test("11. Opening Islam returns correct collection", () => {
  const detail = getCollectionForUi("islam");
  assert.ok(detail);
  assert.equal(detail.id, "islam");
  assert.equal(detail.title, "Islam — Outer Practice & Submission");
  assert.equal(detail.topics.length, 5);
  assert.equal(detail.overviewReferences.length, 2);
  assert.deepEqual(
    detail.topics.map((t) => t.id),
    [
      "islam-shahadah",
      "islam-salah",
      "islam-zakat",
      "islam-sawm",
      "islam-hajj",
    ]
  );
});

test("12. Opening Iman returns correct collection", () => {
  const detail = getCollectionForUi("iman");
  assert.ok(detail);
  assert.equal(detail.id, "iman");
  assert.equal(detail.title, "Iman — Inner Conviction & Faith");
  assert.equal(detail.topics.length, 6);
  assert.equal(detail.overviewReferences.length, 5);
  assert.deepEqual(
    detail.topics.map((t) => t.id),
    [
      "iman-belief-in-allah",
      "iman-belief-in-angels",
      "iman-belief-in-revealed-books",
      "iman-belief-in-messengers",
      "iman-belief-in-last-day",
      "iman-belief-in-qadr",
    ]
  );
});

test("13. Opening a valid ready topic returns its references", () => {
  const topic = getTopicForUi("iman", "iman-belief-in-allah");
  assert.ok(topic);
  assert.equal(topic.id, "iman-belief-in-allah");
  assert.equal(topic.collectionId, "iman");
  assert.equal(topic.collectionTitle, "Iman — Inner Conviction & Faith");
  assert.equal(topic.status, "reference-ready");
  assert.equal(topic.references.length, 4);
  assert.equal(topic.groupedReferences.quran.length, 2);
  assert.equal(topic.groupedReferences.hadith.length, 1);
  assert.equal(topic.groupedReferences.scholarly.length, 1);
});

test("14. Unknown collection ID fails safely", () => {
  const detail = getCollectionForUi("unknown-col");
  assert.equal(detail, null);
});

test("15. Unknown topic ID fails safely", () => {
  const topic = getTopicForUi("iman", "unknown-topic");
  assert.equal(topic, null);
});

test("16. Topic cannot be opened under the wrong collection", () => {
  const topic = getTopicForUi("islam", "iman-belief-in-allah");
  assert.equal(topic, null);
});

test("17. Collection-level references are preserved in Islam and Iman", () => {
  const islam = getCollectionForUi("islam");
  assert.equal(islam.overviewReferences.length, 2);
  assert.equal(islam.groupedOverviewReferences.hadith.length, 1);
  assert.equal(islam.groupedOverviewReferences.scholarly.length, 1);

  const iman = getCollectionForUi("iman");
  assert.equal(iman.overviewReferences.length, 5);
  assert.equal(iman.groupedOverviewReferences.quran.length, 3);
  assert.equal(iman.groupedOverviewReferences.hadith.length, 1);
  assert.equal(iman.groupedOverviewReferences.scholarly.length, 1);
});

test("18. Qur'an reference action routes through existing internal Quran contract", () => {
  const topic = getTopicForUi("iman", "iman-belief-in-allah");
  for (const qRef of topic.groupedReferences.quran) {
    assert.equal(qRef.action, "internal-quran-navigation");
    assert.ok(qRef.locator);
    assert.ok(qRef.verseKeys.length > 0);
  }
});

test("19. Hadith reference action invokes M9RH bridge", () => {
  const topic = getTopicForUi("iman", "iman-belief-in-allah");
  const hadithRef = topic.groupedReferences.hadith[0];
  assert.ok(hadithRef);
  const result = resolveIslamicReferenceHadith(hadithRef);
  assert.equal(result.status, "resolved");
  assert.equal(result.target, "hadith:muslim:8");
});

test("20. Hadith bridge result for Muslim 8 gives hadith:muslim:8", () => {
  const topic = getTopicForUi("iman", "iman-belief-in-angels");
  const hadithRef = topic.groupedReferences.hadith[0];
  const target = getIslamicReferenceHadithTarget(hadithRef);
  assert.equal(target, "hadith:muslim:8");
});

test("21. Bukhari 528 gives hadith:bukhari:528", () => {
  const topic = getTopicForUi("islam", "islam-salah");
  const hadithRef = topic.groupedReferences.hadith[0];
  const target = getIslamicReferenceHadithTarget(hadithRef);
  assert.equal(target, "hadith:bukhari:528");
});

test("22. Hadith bridge source mismatch does not navigate", () => {
  const mismatchRef = {
    id: "hadith:test:mismatch",
    type: "hadith",
    title: "Mismatch",
    collectionId: "muslim",
    collection: "Sahih Muslim",
    locator: "8",
    sourceName: "HadeethEnc",
    sourceRecordId: "99999",
    sourceUrl: "https://hadeethenc.com/en/browse/hadith/99999",
    action: "internal-hadith-navigation",
    contentPolicy: "metadata-only",
  };
  const result = resolveIslamicReferenceHadith(mismatchRef);
  assert.equal(result.status, "source-mismatch");
  assert.equal(result.target, null);
});

test("23. Scholarly action uses validated source URL", () => {
  const topic = getTopicForUi("iman", "iman-belief-in-allah");
  const scholarlyRef = topic.groupedReferences.scholarly[0];
  assert.ok(scholarlyRef);
  assert.equal(scholarlyRef.action, "external-link");
  assert.equal(scholarlyRef.sourceUrl, "https://risala.prh.gov.sa/en/content/81");
});

test("24. Alharamain scholarly references use /en/content/81 for Creed and /en/content/251 for What A Muslim Must Know", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const scholarly = allRefs.filter((r) => r.type === "scholarly");
  assert.equal(scholarly.length, 31);
  const content81 = scholarly.filter((s) => s.sourceUrl === "https://risala.prh.gov.sa/en/content/81");
  const content251 = scholarly.filter((s) => s.sourceUrl === "https://risala.prh.gov.sa/en/content/251");
  assert.equal(content81.length, 26);
  assert.equal(content251.length, 5);
});

test("25. /en/content/381 is not reintroduced anywhere", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const scholarly = allRefs.filter((r) => r.type === "scholarly");
  for (const s of scholarly) {
    assert.notEqual(s.sourceUrl, "https://risala.prh.gov.sa/en/content/381");
  }
});

test("26. External scholarly action is safe in panel component", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(panelCode, /target="_blank"/);
  assert.match(panelCode, /rel="noopener noreferrer"/);
});

test("27. No M9R source body is rendered or bundled", async () => {
  const [panelCode, uiStateCode] = await Promise.all([
    readFile(new URL("../app/islamic-foundations-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/islamic-foundations-ui-state.mjs", import.meta.url), "utf8"),
  ]);
  const forbiddenBody = /‘Umar ibn al-Khattāb|Islam is to testify that there is no god but Allah|Tafsir Ibn Kathir/i;
  assert.doesNotMatch(panelCode, forbiddenBody);
  assert.doesNotMatch(uiStateCode, forbiddenBody);
});

test("28. No Hadith body is duplicated into Foundations panel", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(panelCode, /translations\[0\]\.text/);
});

test("29. No Quran body is duplicated into Foundations panel", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(panelCode, /uthmani|qcfCode|arabicText/);
});

test("30. No scholarly body is duplicated into Foundations panel", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(panelCode, /articleBody|chapterContent/);
});

test("31. No dangerouslySetInnerHTML in IslamicFoundationsPanel", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(panelCode, /dangerouslySetInnerHTML/);
});

test("32. Back Topic -> Collection contract is valid", () => {
  const col = getCollectionForUi("iman");
  const topic = getTopicForUi("iman", "iman-belief-in-allah");
  assert.ok(col);
  assert.ok(topic);
  assert.equal(topic.collectionId, col.id);
});

test("33. Back Collection -> Library contract is valid", () => {
  const collections = listCollectionsForUi();
  assert.equal(collections.length, 10);
  assert.ok(collections.some((c) => c.id === "iman"));
});

test("34. Close remains separate from Back in panel component", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(panelCode, /className="foundations-back-button"/);
  assert.match(panelCode, /className="panel-close"/);
  assert.match(panelCode, /onClick=\{onClose\}/);
});

test("35. All 46 reference-ready topics are reachable via getTopicForUi", () => {
  const readyExpected = [
    ["islam", "islam-shahadah"],
    ["islam", "islam-salah"],
    ["islam", "islam-zakat"],
    ["islam", "islam-sawm"],
    ["islam", "islam-hajj"],
    ["iman", "iman-belief-in-allah"],
    ["iman", "iman-belief-in-angels"],
    ["iman", "iman-belief-in-revealed-books"],
    ["iman", "iman-belief-in-messengers"],
    ["iman", "iman-belief-in-last-day"],
    ["iman", "iman-belief-in-qadr"],
    ["ihsan", "ihsan-meaning-of-ihsan"],
    ["tawhid", "tawhid-worship-of-allah-alone"],
    ["tawhid", "tawhid-allahs-lordship"],
    ["tawhid", "tawhid-names-and-attributes"],
    ["tawhid", "tawhid-shirk"],
    ["quran-and-sunnah", "quran-and-sunnah-quran"],
    ["quran-and-sunnah", "quran-and-sunnah-sunnah"],
    ["quran-and-sunnah", "quran-and-sunnah-hadith"],
    ["quran-and-sunnah", "quran-and-sunnah-relationship-between-quran-and-sunnah"],
    ["akhlaq-and-adab", "akhlaq-and-adab-truthfulness"],
    ["akhlaq-and-adab", "akhlaq-and-adab-humility"],
    ["akhlaq-and-adab", "akhlaq-and-adab-parents-and-family"],
    ["akhlaq-and-adab", "akhlaq-and-adab-neighbors"],
    ["akhlaq-and-adab", "akhlaq-and-adab-justice"],
    ["akhlaq-and-adab", "akhlaq-and-adab-good-manners"],
    ["taharah", "taharah-purification"],
    ["taharah", "taharah-wudu"],
    ["taharah", "taharah-ghusl"],
    ["taharah", "taharah-cleanliness-and-prayer"],
    ["halal-and-haram", "halal-and-haram-lawful-and-unlawful"],
    ["halal-and-haram", "halal-and-haram-food"],
    ["halal-and-haram", "halal-and-haram-income"],
    ["halal-and-haram", "halal-and-haram-transactions"],
    ["halal-and-haram", "halal-and-haram-relationships-and-conduct"],
    ["dua-and-dhikr", "dua-and-dhikr-dua"],
    ["dua-and-dhikr", "dua-and-dhikr-dhikr"],
    ["dua-and-dhikr", "dua-and-dhikr-morning-and-evening-remembrance"],
    ["dua-and-dhikr", "dua-and-dhikr-etiquette-of-supplication"],
    ["akhirah", "akhirah-death"],
    ["akhirah", "akhirah-life-of-the-grave"],
    ["akhirah", "akhirah-resurrection"],
    ["akhirah", "akhirah-day-of-judgment"],
    ["akhirah", "akhirah-accountability"],
    ["akhirah", "akhirah-paradise"],
    ["akhirah", "akhirah-hellfire"],
  ];

  for (const [colId, topicId] of readyExpected) {
    const topic = getTopicForUi(colId, topicId);
    assert.ok(topic, `Topic ${topicId} in ${colId} should be reachable`);
    assert.equal(topic.status, "reference-ready");
    assert.ok(topic.references.length >= 1);
  }
});

test("36. All 3 planned topics remain truthful/planned", () => {
  const allCols = listCollectionsForUi();
  let totalPlanned = 0;
  for (const col of allCols) {
    const colDetail = getCollectionForUi(col.id);
    for (const topic of colDetail.topics) {
      if (topic.status === "planned") {
        totalPlanned++;
        assert.equal(topic.referencesCount, 0);
      }
    }
  }
  assert.equal(totalPlanned, 3);
});

test("37. Global production counts reflect 49 / 46 / 3", () => {
  const list = listCollectionsForUi();
  const total = list.reduce((sum, c) => sum + c.topicsCount, 0);
  const ready = list.reduce((sum, c) => sum + c.readyTopicsCount, 0);
  const planned = list.reduce((sum, c) => sum + c.plannedTopicsCount, 0);

  assert.equal(total, 49);
  assert.equal(ready, 46);
  assert.equal(planned, 3);
});

test("38. Total references reflect 154", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  assert.equal(allRefs.length, 154);
});

test("39. Hadith references reflect 48", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const hadithRefs = allRefs.filter((r) => r.type === "hadith");
  assert.equal(hadithRefs.length, 48);
});

test("40. Unique Hadith target count reflects 42", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const hadithRefs = allRefs.filter((r) => r.type === "hadith");
  const uniqueTargets = new Set(
    hadithRefs.map((r) => getIslamicReferenceHadithTarget(r))
  );
  assert.equal(uniqueTargets.size, 42);
});

test("41. M9H approved record count reflects 42", () => {
  const records = listHadithRecords();
  assert.equal(records.length, 42);
  const approved = records.filter((r) => r.activation === "translation-approved");
  assert.equal(approved.length, 42);
});

test("42. M9H content is not modified by Foundations UI", () => {
  const collections = listHadithCollections();
  assert.equal(collections.length, 6);
});

test("43. Strict Domain Separation: Islamic Foundations UI has no EducationProgress dependency", async () => {
  const [panelCode, uiStateCode] = await Promise.all([
    readFile(new URL("../app/islamic-foundations-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/islamic-foundations-ui-state.mjs", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(panelCode, /EducationProgress|education-state/i);
  assert.doesNotMatch(uiStateCode, /EducationProgress|education-state/i);
});

test("44. Strict Domain Separation: Islamic Foundations UI has no Today Study dependency", async () => {
  const [panelCode, uiStateCode] = await Promise.all([
    readFile(new URL("../app/islamic-foundations-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/islamic-foundations-ui-state.mjs", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(panelCode, /today-study|TodayStudy/i);
  assert.doesNotMatch(uiStateCode, /today-study|TodayStudy/i);
});

test("45. Strict Domain Separation: Islamic Foundations UI has no Evidence dependency", async () => {
  const [panelCode, uiStateCode] = await Promise.all([
    readFile(new URL("../app/islamic-foundations-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/islamic-foundations-ui-state.mjs", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(panelCode, /evidence-layer|evidence-query/i);
  assert.doesNotMatch(uiStateCode, /evidence-layer|evidence-query/i);
});

test("46. Core M9H modules still have no M9R dependency", async () => {
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

test("47. Learn UI existing labels/tools are preserved", async () => {
  const learnCode = await readFile(
    new URL("../app/learn-panel.tsx", import.meta.url),
    "utf8"
  );
  for (const label of [
    "TODAY&apos;S STUDY",
    "HADITH LIBRARY",
    "ISLAMIC FOUNDATIONS",
    "GUIDED COURSES",
    "CURRENT LESSON",
    "LEARNING PROGRESS",
    "MY MUSHAF",
    "QURAN VOCABULARY",
    "TAJWEED",
    "PRIVATE NOTES",
    "READER STUDY",
  ]) {
    assert.match(learnCode, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("48. Responsive CSS includes mobile handling for foundations panel", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.islamic-foundations-panel/);
  assert.match(css, /\.foundations-collection-grid/);
  assert.match(css, /@media\s*\(max-width:\s*790px\)\s*\{[\s\S]*\.foundations-panel-content/);
});

test("49. Status is represented textually, not color-only", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(panelCode, /SOURCE-READY/);
  assert.match(panelCode, /PARTIALLY READY/);
  assert.match(panelCode, /PLANNED/);
  assert.match(panelCode, /Sources for this topic have not been activated yet/);
});

test("50. Interactive collection/topic rows use semantic button/link behavior", async () => {
  const panelCode = await readFile(
    new URL("../app/islamic-foundations-panel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(panelCode, /<button[^>]*className="foundations-collection-card"/);
  assert.match(panelCode, /<button[^>]*className="foundations-primary-action"/);
  assert.match(panelCode, /<button[^>]*className="foundations-action-button"/);
  assert.match(panelCode, /<a[^>]*className="foundations-action-link"/);
});

test("51. Search finds collections by title and description", () => {
  const res = searchFoundationsLibrary("submission");
  assert.ok(res.matchedCollections.length >= 1);
  assert.equal(res.matchedCollections[0].id, "islam");
});

test("52. Search finds topics by title, description, and citations", () => {
  const resByTitle = searchFoundationsLibrary("Angels");
  assert.ok(resByTitle.matchedTopics.some((t) => t.id === "iman-belief-in-angels"));

  const resByLocator = searchFoundationsLibrary("2:255");
  assert.ok(resByLocator.matchedTopics.some((t) => t.id === "iman-belief-in-allah"));

  const resByHadith = searchFoundationsLibrary("528");
  assert.ok(resByHadith.matchedTopics.some((t) => t.id === "islam-salah"));
});

test("53. Empty search behaves predictably and returns empty results", () => {
  const res = searchFoundationsLibrary("   ");
  assert.equal(res.matchedCollections.length, 0);
  assert.equal(res.matchedTopics.length, 0);
});

test("54. Reference grouping groups references properly by type", () => {
  const sampleRefs = [
    { type: "quran", locator: "2:255" },
    { type: "hadith", collection: "Sahih Muslim", locator: "8" },
    { type: "scholarly", title: "Test Creed" },
  ];
  const grouped = groupReferencesByType(sampleRefs);
  assert.equal(grouped.quran.length, 1);
  assert.equal(grouped.hadith.length, 1);
  assert.equal(grouped.scholarly.length, 1);
});
