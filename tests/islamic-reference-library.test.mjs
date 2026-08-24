import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
  REQUIRED_CORE_COLLECTION_IDS,
  REQUIRED_CORE_TOPIC_IDS,
  validateIslamicReferenceLibrary,
} from "../app/islamic-reference-library.ts";

function cloneLibrary() {
  return structuredClone(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY);
}

function allTopics(library) {
  return library.collections.flatMap((collection) => collection.topics);
}

function allReferences(library) {
  return library.collections.flatMap((collection) => [
    ...collection.references,
    ...collection.topics.flatMap((topic) => topic.references),
  ]);
}

function findCollection(library, id) {
  const collection = library.collections.find((entry) => entry.id === id);
  assert.ok(collection, `Missing collection ${id}`);
  return collection;
}

function findTopic(library, id) {
  const topic = allTopics(library).find((entry) => entry.id === id);
  assert.ok(topic, `Missing topic ${id}`);
  return topic;
}

function firstReferenceOfType(library, type) {
  const reference = allReferences(library).find((entry) => entry.type === type);
  assert.ok(reference, `No ${type} reference found`);
  return reference;
}

function assertInvalid(library, expectedIssue) {
  const result = validateIslamicReferenceLibrary(library);
  assert.equal(result.valid, false);
  assert.equal(result.library, null);
  assert.ok(
    result.issues.some((issue) => issue.includes(expectedIssue)),
    `Expected an issue containing ${JSON.stringify(expectedIssue)}; got ${result.issues.join("; ")}`,
  );
}

test("production library uses schema version 2 and the Islamic Foundations identity", () => {
  assert.equal(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.schemaVersion, 2);
  assert.equal(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.id, "islamic-foundations");
  assert.equal(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.title, "Islamic Foundations");
  assert.equal(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.revision, "m9r-v9");
});

test("production library validates successfully", () => {
  const result = validateIslamicReferenceLibrary(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.issues, []);
  assert.ok(result.library);
});

test("all ten required core collections exist", () => {
  const collectionIds = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.map(
    (collection) => collection.id,
  );

  assert.equal(collectionIds.length, 10);
  assert.deepEqual(collectionIds, [...REQUIRED_CORE_COLLECTION_IDS]);
});

test("additional valid collections and topics are architecturally permitted", () => {
  const library = cloneLibrary();
  library.collections.push({
    id: "future-foundations",
    title: "Future Foundations",
    description: "A future reference collection.",
    references: [],
    topics: [
      {
        id: "future-foundations-overview",
        title: "Overview",
        description: "Explore future references.",
        status: "planned",
        references: [],
      },
    ],
  });

  const result = validateIslamicReferenceLibrary(library);
  assert.equal(result.valid, true, result.issues.join("; "));
});

test("missing required core collections fail closed", () => {
  const library = cloneLibrary();
  library.collections = library.collections.filter(
    (collection) => collection.id !== "akhirah",
  );

  assertInvalid(library, "required core collection akhirah is missing");
});

test("collection IDs must be unique", () => {
  const library = cloneLibrary();
  library.collections[1].id = library.collections[0].id;

  assertInvalid(library, "collection IDs must be unique");
});

test("topic IDs must be globally unique", () => {
  const library = cloneLibrary();
  library.collections[1].topics[0].id = library.collections[0].topics[0].id;

  assertInvalid(library, "topic IDs must be globally unique");
});

test("reference IDs must be globally unique across collection and topic references", () => {
  const library = cloneLibrary();
  const iman = findCollection(library, "iman");
  const topic = findTopic(library, "iman-belief-in-revealed-books");
  topic.references[0].id = iman.references[0].id;

  assertInvalid(library, "reference IDs must be globally unique");
});

test("all required initial topic registries exist in their collections", () => {
  for (const collectionId of REQUIRED_CORE_COLLECTION_IDS) {
    const collection = findCollection(
      ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
      collectionId,
    );
    const topicIds = new Set(collection.topics.map((topic) => topic.id));

    for (const requiredTopicId of REQUIRED_CORE_TOPIC_IDS[collectionId]) {
      assert.equal(topicIds.has(requiredTopicId), true, requiredTopicId);
    }
  }
});

test("required topics must remain in their registered core collection", () => {
  const library = cloneLibrary();
  const islam = findCollection(library, "islam");
  islam.topics = islam.topics.filter((topic) => topic.id !== "islam-salah");

  assertInvalid(library, "required topic islam-salah is missing from islam");
});

test("planned and reference-ready production topics obey status semantics", () => {
  const topics = allTopics(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY);
  const planned = topics.filter((topic) => topic.status === "planned");
  const ready = topics.filter((topic) => topic.status === "reference-ready");

  assert.equal(topics.length, 49);
  assert.equal(planned.length, 3);
  assert.equal(ready.length, 46);
  assert.ok(planned.every((topic) => topic.references.length === 0));
  assert.ok(ready.every((topic) => topic.references.length >= 1));
});

test("planned topics containing references fail closed", () => {
  const library = cloneLibrary();
  const planned = findTopic(library, "ihsan-sincerity");
  planned.references.push(
    structuredClone(findCollection(library, "iman").references[0]),
  );
  planned.references[0].id = "quran:ihsan-sincerity:2-177";

  assertInvalid(library, "planned topics must not contain references");
});

test("reference-ready topics with zero references fail closed", () => {
  const library = cloneLibrary();
  findTopic(library, "ihsan-meaning-of-ihsan").references = [];

  assertInvalid(library, "reference-ready topics require a reference");
});

test("Islam collection overview contains Muslim 16 and scholarly metadata", () => {
  const islam = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "islam");
  assert.equal(islam.references.length, 2);
  const hadith = islam.references.find((r) => r.type === "hadith");
  const scholarly = islam.references.find((r) => r.type === "scholarly");

  assert.ok(hadith);
  assert.equal(hadith.collectionId, "muslim");
  assert.equal(hadith.locator, "16");
  assert.equal(hadith.sourceRecordId, "65000");
  assert.equal(hadith.action, "internal-hadith-navigation");

  assert.ok(scholarly);
  assert.equal(scholarly.locator, "Pillars of Islam");
  assert.equal(scholarly.sourceUrl, "https://risala.prh.gov.sa/en/content/81");
});

test("all five Islam / Five Pillars topics are reference-ready with vetted sources", () => {
  const expected = new Map([
    ["islam-shahadah", { hadithRecordId: "4563", hadithLocator: "8", colId: "muslim", refCount: 4 }],
    ["islam-salah", { hadithRecordId: "4968", hadithLocator: "528", colId: "bukhari", refCount: 4 }],
    ["islam-zakat", { hadithRecordId: "3689", hadithLocator: "1397", colId: "bukhari", refCount: 4 }],
    ["islam-sawm", { hadithRecordId: "65003", hadithLocator: "15", colId: "muslim", refCount: 4 }],
    ["islam-hajj", { hadithRecordId: "2758", hadithLocator: "1521", colId: "bukhari", refCount: 4 }],
  ]);

  for (const [topicId, exp] of expected) {
    const topic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, topicId);
    assert.equal(topic.status, "reference-ready", `${topicId} should be reference-ready`);
    assert.equal(topic.references.length, exp.refCount, `${topicId} reference count mismatch`);

    const quranRefs = topic.references.filter((r) => r.type === "quran");
    assert.equal(quranRefs.length, 2, `${topicId} should have 2 Quran references`);

    const hadithRef = topic.references.find((r) => r.type === "hadith");
    assert.ok(hadithRef, `${topicId} missing Hadith reference`);
    assert.equal(hadithRef.collectionId, exp.colId);
    assert.equal(hadithRef.locator, exp.hadithLocator);
    assert.equal(hadithRef.sourceRecordId, exp.hadithRecordId);
    assert.equal(hadithRef.action, "internal-hadith-navigation");

    const scholarlyRef = topic.references.find((r) => r.type === "scholarly");
    assert.ok(scholarlyRef, `${topicId} missing scholarly reference`);
    assert.equal(scholarlyRef.sourceUrl, "https://risala.prh.gov.sa/en/content/81");
  }
});

test("scholarly references use /en/content/81 for Creed and /en/content/251 for What A Muslim Must Know", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const scholarlyRefs = allRefs.filter((r) => r.type === "scholarly");
  assert.equal(scholarlyRefs.length, 31);
  const content81 = scholarlyRefs.filter((r) => r.sourceUrl === "https://risala.prh.gov.sa/en/content/81");
  const content251 = scholarlyRefs.filter((r) => r.sourceUrl === "https://risala.prh.gov.sa/en/content/251");
  assert.equal(content81.length, 26);
  assert.equal(content251.length, 5);
  for (const ref of scholarlyRefs) {
    assert.notEqual(ref.sourceUrl, "https://risala.prh.gov.sa/en/content/381");
  }
});

test("all four Qur'an and Sunnah topics are reference-ready with vetted sources", () => {
  const qs = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "quran-and-sunnah");
  assert.equal(qs.topics.length, 4);
  assert.equal(qs.references.length, 0);

  // 1. Qur'an
  const quranTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "quran-and-sunnah-quran");
  assert.equal(quranTopic.status, "reference-ready");
  assert.equal(quranTopic.references.length, 4);
  assert.deepEqual(
    quranTopic.references.map((r) => r.id),
    [
      "quran:quran-sunnah-quran:15-9",
      "quran:quran-sunnah-quran:2-2",
      "hadith:quran-sunnah-quran:hadeethenc-5913",
      "scholarly:quran-sunnah-quran:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    quranTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["15:9", "2:2"],
  );
  const quranHadith = quranTopic.references.find((r) => r.type === "hadith");
  assert.ok(quranHadith);
  assert.equal(quranHadith.collectionId, "bukhari");
  assert.equal(quranHadith.locator, "5027");
  assert.equal(quranHadith.sourceRecordId, "5913");
  const quranScholarly = quranTopic.references.find((r) => r.type === "scholarly");
  assert.ok(quranScholarly);
  assert.equal(quranScholarly.locator, "Belief in the Revealed Books");

  // 2. Sunnah
  const sunnahTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "quran-and-sunnah-sunnah");
  assert.equal(sunnahTopic.status, "reference-ready");
  assert.equal(sunnahTopic.references.length, 4);
  assert.deepEqual(
    sunnahTopic.references.map((r) => r.id),
    [
      "quran:quran-sunnah-sunnah:33-21",
      "quran:quran-sunnah-sunnah:59-7",
      "hadith:quran-sunnah-sunnah:hadeethenc-6078",
      "scholarly:quran-sunnah-sunnah:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    sunnahTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["33:21", "59:7"],
  );
  const sunnahHadith = sunnahTopic.references.find((r) => r.type === "hadith");
  assert.ok(sunnahHadith);
  assert.equal(sunnahHadith.collectionId, "muslim");
  assert.equal(sunnahHadith.locator, "1401");
  assert.equal(sunnahHadith.sourceRecordId, "6078");
  const sunnahScholarly = sunnahTopic.references.find((r) => r.type === "scholarly");
  assert.ok(sunnahScholarly);
  assert.equal(
    sunnahScholarly.locator,
    "Objectives of the Islamic Creed — following the messengers' example",
  );

  // 3. Hadith
  const hadithTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "quran-and-sunnah-hadith");
  assert.equal(hadithTopic.status, "reference-ready");
  assert.equal(hadithTopic.references.length, 3);
  assert.deepEqual(
    hadithTopic.references.map((r) => r.id),
    [
      "quran:quran-sunnah-hadith:49-6",
      "hadith:quran-sunnah-hadith:hadeethenc-3686",
      "scholarly:quran-sunnah-hadith:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    hadithTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["49:6"],
  );
  const hadithHadith = hadithTopic.references.find((r) => r.type === "hadith");
  assert.ok(hadithHadith);
  assert.equal(hadithHadith.collectionId, "bukhari");
  assert.equal(hadithHadith.locator, "3461");
  assert.equal(hadithHadith.sourceRecordId, "3686");
  const hadithScholarly = hadithTopic.references.find((r) => r.type === "scholarly");
  assert.ok(hadithScholarly);
  assert.equal(hadithScholarly.locator, "Belief in the Messengers — authentic reports");

  // 4. Relationship Between Qur'an and Sunnah
  const relTopic = findTopic(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
    "quran-and-sunnah-relationship-between-quran-and-sunnah",
  );
  assert.equal(relTopic.status, "reference-ready");
  assert.equal(relTopic.references.length, 4);
  assert.deepEqual(
    relTopic.references.map((r) => r.id),
    [
      "quran:quran-sunnah-relationship:16-44",
      "quran:quran-sunnah-relationship:4-59",
      "hadith:quran-sunnah-relationship:hadeethenc-6383",
      "scholarly:quran-sunnah-relationship:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    relTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["16:44", "4:59"],
  );
  const relHadith = relTopic.references.find((r) => r.type === "hadith");
  assert.ok(relHadith);
  assert.equal(relHadith.collectionId, "bukhari");
  assert.equal(relHadith.locator, "7137");
  assert.equal(relHadith.sourceRecordId, "6383");
  const relScholarly = relTopic.references.find((r) => r.type === "scholarly");
  assert.ok(relScholarly);
  assert.equal(relScholarly.locator, "Foundations of the Islamic Creed");
});

test("all six Akhlaq and Adab topics are reference-ready with vetted sources", () => {
  const collection = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab");
  assert.equal(collection.topics.length, 6);
  assert.equal(collection.references.length, 0);

  // 1. Truthfulness
  const truthTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-truthfulness");
  assert.equal(truthTopic.status, "reference-ready");
  assert.equal(truthTopic.references.length, 4);
  assert.deepEqual(
    truthTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-truthfulness:9-119",
      "quran:akhlaq-and-adab-truthfulness:33-70",
      "hadith:akhlaq-and-adab-truthfulness:hadeethenc-5504",
      "scholarly:akhlaq-and-adab-truthfulness:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    truthTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["9:119", "33:70"],
  );
  const truthHadith = truthTopic.references.find((r) => r.type === "hadith");
  assert.ok(truthHadith);
  assert.equal(truthHadith.collectionId, "muslim");
  assert.equal(truthHadith.locator, "2607");
  assert.equal(truthHadith.sourceRecordId, "5504");
  const truthScholarly = truthTopic.references.find((r) => r.type === "scholarly");
  assert.ok(truthScholarly);
  assert.equal(truthScholarly.locator, "Introduction — Islam enjoins truthfulness and forbids lying");

  // 2. Humility
  const humilityTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-humility");
  assert.equal(humilityTopic.status, "reference-ready");
  assert.equal(humilityTopic.references.length, 3);
  assert.deepEqual(
    humilityTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-humility:25-63",
      "quran:akhlaq-and-adab-humility:31-18",
      "hadith:akhlaq-and-adab-humility:hadeethenc-5497",
    ],
  );
  assert.deepEqual(
    humilityTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["25:63", "31:18"],
  );
  const humilityHadith = humilityTopic.references.find((r) => r.type === "hadith");
  assert.ok(humilityHadith);
  assert.equal(humilityHadith.collectionId, "muslim");
  assert.equal(humilityHadith.locator, "2865");
  assert.equal(humilityHadith.sourceRecordId, "5497");
  assert.equal(humilityTopic.references.filter((r) => r.type === "scholarly").length, 0);

  // 3. Parents and Family
  const parentsTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-parents-and-family");
  assert.equal(parentsTopic.status, "reference-ready");
  assert.equal(parentsTopic.references.length, 4);
  assert.deepEqual(
    parentsTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-parents-and-family:17-23",
      "quran:akhlaq-and-adab-parents-and-family:4-36",
      "hadith:akhlaq-and-adab-parents-and-family:hadeethenc-4182",
      "scholarly:akhlaq-and-adab-parents-and-family:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    parentsTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["17:23", "4:36"],
  );
  const parentsHadith = parentsTopic.references.find((r) => r.type === "hadith");
  assert.ok(parentsHadith);
  assert.equal(parentsHadith.collectionId, "muslim");
  assert.equal(parentsHadith.locator, "2548");
  assert.equal(parentsHadith.sourceRecordId, "4182");
  const parentsScholarly = parentsTopic.references.find((r) => r.type === "scholarly");
  assert.ok(parentsScholarly);
  assert.equal(parentsScholarly.locator, "Introduction — dutifulness to parents and upholding kinship ties");

  // 4. Neighbors
  const neighborsTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-neighbors");
  assert.equal(neighborsTopic.status, "reference-ready");
  assert.equal(neighborsTopic.references.length, 3);
  assert.deepEqual(
    neighborsTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-neighbors:4-36",
      "hadith:akhlaq-and-adab-neighbors:hadeethenc-4965",
      "scholarly:akhlaq-and-adab-neighbors:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    neighborsTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["4:36"],
  );
  const neighborsHadith = neighborsTopic.references.find((r) => r.type === "hadith");
  assert.ok(neighborsHadith);
  assert.equal(neighborsHadith.collectionId, "bukhari");
  assert.equal(neighborsHadith.locator, "6014");
  assert.equal(neighborsHadith.sourceRecordId, "4965");
  const neighborsScholarly = neighborsTopic.references.find((r) => r.type === "scholarly");
  assert.ok(neighborsScholarly);
  assert.equal(neighborsScholarly.locator, "Introduction — good neighborliness");

  // 5. Justice
  const justiceTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-justice");
  assert.equal(justiceTopic.status, "reference-ready");
  assert.equal(justiceTopic.references.length, 4);
  assert.deepEqual(
    justiceTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-justice:4-135",
      "quran:akhlaq-and-adab-justice:5-8",
      "hadith:akhlaq-and-adab-justice:hadeethenc-4935",
      "scholarly:akhlaq-and-adab-justice:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    justiceTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["4:135", "5:8"],
  );
  const justiceHadith = justiceTopic.references.find((r) => r.type === "hadith");
  assert.ok(justiceHadith);
  assert.equal(justiceHadith.collectionId, "muslim");
  assert.equal(justiceHadith.locator, "1827");
  assert.equal(justiceHadith.sourceRecordId, "4935");
  const justiceScholarly = justiceTopic.references.find((r) => r.type === "scholarly");
  assert.ok(justiceScholarly);
  assert.equal(justiceScholarly.locator, "Introduction — justice and forbids injustice");

  // 6. Good Manners
  const mannersTopic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "akhlaq-and-adab-good-manners");
  assert.equal(mannersTopic.status, "reference-ready");
  assert.equal(mannersTopic.references.length, 3);
  assert.deepEqual(
    mannersTopic.references.map((r) => r.id),
    [
      "quran:akhlaq-and-adab-good-manners:68-4",
      "hadith:akhlaq-and-adab-good-manners:hadeethenc-4308",
      "scholarly:akhlaq-and-adab-good-manners:uthaymin-creed",
    ],
  );
  assert.deepEqual(
    mannersTopic.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys),
    ["68:4"],
  );
  const mannersHadith = mannersTopic.references.find((r) => r.type === "hadith");
  assert.ok(mannersHadith);
  assert.equal(mannersHadith.collectionId, "muslim");
  assert.equal(mannersHadith.locator, "2553");
  assert.equal(mannersHadith.sourceRecordId, "4308");
  const mannersScholarly = mannersTopic.references.find((r) => r.type === "scholarly");
  assert.ok(mannersScholarly);
  assert.equal(mannersScholarly.locator, "Introduction — every good manner and righteous act");

  // Verify Whitelist, Rejections, and Counts
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const quranRefs = allRefs.filter((r) => r.type === "quran");
  const hadithRefs = allRefs.filter((r) => r.type === "hadith");
  const scholarlyRefs = allRefs.filter((r) => r.type === "scholarly");

  assert.equal(allRefs.length, 154);
  assert.equal(quranRefs.length, 75);
  assert.equal(hadithRefs.length, 48);
  assert.equal(scholarlyRefs.length, 31);

  // Reused 4:36 verse key check
  const p36Refs = quranRefs.filter((r) => r.verseKeys.includes("4:36"));
  assert.equal(p36Refs.length, 2);
  assert.deepEqual(p36Refs.map((r) => r.id), [
    "quran:akhlaq-and-adab-parents-and-family:4-36",
    "quran:akhlaq-and-adab-neighbors:4-36",
  ]);

  // Unapproved key rejections
  const allVerseKeys = new Set(quranRefs.flatMap((r) => r.verseKeys));
  assert.equal(allVerseKeys.has("16:90"), false);
  assert.equal(allVerseKeys.has("7:199"), false);

  // All 9 approved Batch 5 keys are present
  const batch5Keys = ["4:36", "4:135", "5:8", "9:119", "17:23", "25:63", "31:18", "33:70", "68:4"];
  for (const k of batch5Keys) {
    assert.equal(allVerseKeys.has(k), true, `Missing approved Batch 5 key ${k}`);
  }

  // All 3 remaining planned topics are empty
  const plannedTopics = allTopics(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY).filter((t) => t.status === "planned");
  assert.equal(plannedTopics.length, 3);
  assert.ok(plannedTopics.every((t) => t.references.length === 0));
});

test("all four Tawhid topics are reference-ready with vetted sources", () => {
  const tawhid = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "tawhid");
  assert.equal(tawhid.topics.length, 4);
  assert.equal(tawhid.references.length, 0);

  const worship = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "tawhid-worship-of-allah-alone");
  assert.equal(worship.status, "reference-ready");
  assert.equal(worship.references.length, 4);
  assert.deepEqual(worship.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys), ["51:56", "16:36"]);
  const worshipHadith = worship.references.find((r) => r.type === "hadith");
  assert.ok(worshipHadith);
  assert.equal(worshipHadith.collectionId, "bukhari");
  assert.equal(worshipHadith.locator, "2856");
  assert.equal(worshipHadith.sourceRecordId, "65007");
  const worshipScholarly = worship.references.find((r) => r.type === "scholarly");
  assert.ok(worshipScholarly);
  assert.equal(worshipScholarly.locator, "Belief in Allah Almighty — His divinity");

  const lordship = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "tawhid-allahs-lordship");
  assert.equal(lordship.status, "reference-ready");
  assert.equal(lordship.references.length, 3);
  assert.deepEqual(lordship.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys), ["7:54", "39:62"]);
  assert.equal(lordship.references.some((r) => r.type === "hadith"), false);
  const lordshipScholarly = lordship.references.find((r) => r.type === "scholarly");
  assert.ok(lordshipScholarly);
  assert.equal(lordshipScholarly.locator, "Belief in Allah Almighty — His lordship");

  const names = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "tawhid-names-and-attributes");
  assert.equal(names.status, "reference-ready");
  assert.equal(names.references.length, 5);
  const namesQuran = names.references.filter((r) => r.type === "quran");
  assert.equal(namesQuran.length, 3);
  assert.deepEqual(namesQuran[0].verseKeys, ["42:11"]);
  assert.deepEqual(namesQuran[1].verseKeys, ["7:180"]);
  assert.deepEqual(namesQuran[2].verseKeys, ["112:1", "112:2", "112:3", "112:4"]);
  assert.equal(namesQuran[2].locator, "Surah 112");
  const namesHadith = names.references.find((r) => r.type === "hadith");
  assert.ok(namesHadith);
  assert.equal(namesHadith.collectionId, "bukhari");
  assert.equal(namesHadith.locator, "2736");
  assert.equal(namesHadith.sourceRecordId, "64673");
  const namesScholarly = names.references.find((r) => r.type === "scholarly");
  assert.ok(namesScholarly);
  assert.equal(namesScholarly.locator, "Belief in Allah Almighty — His names and attributes");

  const shirk = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "tawhid-shirk");
  assert.equal(shirk.status, "reference-ready");
  assert.equal(shirk.references.length, 4);
  assert.deepEqual(shirk.references.filter((r) => r.type === "quran").flatMap((r) => r.verseKeys), ["4:48", "31:13"]);
  const shirkHadith = shirk.references.find((r) => r.type === "hadith");
  assert.ok(shirkHadith);
  assert.equal(shirkHadith.collectionId, "bukhari");
  assert.equal(shirkHadith.locator, "2856");
  assert.equal(shirkHadith.sourceRecordId, "65007");
  const shirkScholarly = shirk.references.find((r) => r.type === "scholarly");
  assert.ok(shirkScholarly);
  assert.equal(shirkScholarly.locator, "Belief in Allah Almighty — His divinity");
});

test("the migrated Iman overview sources are collection-level references", () => {
  const iman = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "iman");
  const quranLocators = iman.references
    .filter((reference) => reference.type === "quran")
    .map((reference) => reference.locator);
  const hadith = iman.references.find((reference) => reference.type === "hadith");
  const scholarly = iman.references.find(
    (reference) => reference.type === "scholarly",
  );

  assert.deepEqual(quranLocators, ["2:177", "4:136", "54:49"]);
  assert.equal(hadith?.collection, "Sahih Muslim");
  assert.equal(hadith?.locator, "8");
  assert.equal(hadith?.sourceRecordId, "4563");
  assert.equal(scholarly?.locator, "Foundations of the Islamic Creed");
});

test("all six Articles of Iman topics in Iman collection are reference-ready with vetted sources", () => {
  const expected = new Map([
    ["iman-belief-in-allah", { recordId: "4563", locator: "8", colId: "muslim", refCount: 4, scholarlyLoc: "Belief in Allah Almighty" }],
    ["iman-belief-in-angels", { recordId: "4563", locator: "8", colId: "muslim", refCount: 4, scholarlyLoc: "Belief in the Angels" }],
    ["iman-belief-in-revealed-books", { recordId: "65046", locator: "4485", colId: "bukhari", refCount: 5, scholarlyLoc: "Belief in the Revealed Books" }],
    ["iman-belief-in-messengers", { recordId: "3272", locator: "153", colId: "muslim", refCount: 5, scholarlyLoc: "Belief in the Messengers" }],
    ["iman-belief-in-last-day", { recordId: "5460", locator: "2859", colId: "muslim", refCount: 5, scholarlyLoc: "Belief in the Last Day" }],
    ["iman-belief-in-qadr", { recordId: "65038", locator: "2653", colId: "muslim", refCount: 6, scholarlyLoc: "Belief in Destiny" }],
  ]);

  for (const [topicId, exp] of expected) {
    const topic = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, topicId);
    assert.equal(topic.status, "reference-ready", `${topicId} should be reference-ready`);
    assert.equal(topic.references.length, exp.refCount, `${topicId} reference count mismatch`);
    assert.ok(
      topic.references.some(
        (reference) =>
          reference.type === "hadith" &&
          reference.sourceRecordId === exp.recordId &&
          reference.collectionId === exp.colId &&
          reference.locator === exp.locator &&
          reference.action === "internal-hadith-navigation",
      ),
      `${topicId} missing expected Hadith reference`
    );
    const scholarly = topic.references.find((reference) => reference.type === "scholarly");
    assert.ok(scholarly, `${topicId} missing scholarly reference`);
    assert.equal(scholarly.locator, exp.scholarlyLoc);
    assert.equal(scholarly.sourceUrl, "https://risala.prh.gov.sa/en/content/81");
  }

  const qadr = findTopic(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
    "iman-belief-in-qadr",
  );
  assert.ok(
    qadr.references.some(
      (reference) =>
        reference.type === "hadith" && reference.sourceRecordId === "5493",
    ),
  );
});

test("Ihsan meaning uses HadeethEnc 4563 without copied source content", () => {
  const topic = findTopic(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
    "ihsan-meaning-of-ihsan",
  );

  assert.equal(topic.references.length, 1);
  assert.equal(topic.references[0].type, "hadith");
  assert.equal(topic.references[0].sourceRecordId, "4563");
  assert.equal(topic.references[0].contentPolicy, "metadata-only");
  for (const forbidden of ["body", "excerpt", "content", "explanation"]) {
    assert.equal(Object.hasOwn(topic.references[0], forbidden), false);
  }
});

test("Quran references store coordinates and use internal navigation only", () => {
  const quranReferences = allReferences(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
  ).filter((reference) => reference.type === "quran");

  assert.ok(quranReferences.length > 0);
  for (const reference of quranReferences) {
    assert.equal(reference.action, "internal-quran-navigation");
    assert.ok(reference.verseKeys.length > 0);
    assert.equal(Object.hasOwn(reference, "sourceUrl"), false);
    for (const verseKey of reference.verseKeys) {
      assert.match(
        verseKey,
        /^(?:[1-9]|[1-9]\d|1(?:0\d|1[0-4])):[1-9]\d{0,2}$/,
      );
    }
  }
});

test("unapproved Quran coordinates fail closed", () => {
  const library = cloneLibrary();
  firstReferenceOfType(library, "quran").verseKeys = ["2:999"];

  assertInvalid(library, "verseKeys is invalid");
});

test("controlled Quran whitelist poststate contains exactly 80 keys and accepts Batch 4 through Batch 8 additions while rejecting unapproved candidates", () => {
  const librarySource = readFileSync(
    new URL("../app/islamic-reference-library.ts", import.meta.url),
    "utf8"
  );
  const match = librarySource.match(
    /const APPROVED_QURAN_VERSE_KEYS = new Set\(\[\s*([\s\S]*?)\s*\]\);/,
  );
  assert.ok(match, "Could not locate APPROVED_QURAN_VERSE_KEYS in source");
  const extractedKeys = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(extractedKeys.length, 85);
  assert.equal(new Set(extractedKeys).size, 85);

  // Explicitly prove the seven Batch 4 keys are accepted
  const batch4ApprovedKeys = [
    "2:2",
    "4:59",
    "15:9",
    "16:44",
    "33:21",
    "49:6",
    "59:7",
  ];
  for (const key of batch4ApprovedKeys) {
    const validLib = cloneLibrary();
    firstReferenceOfType(validLib, "quran").verseKeys = [key];
    const validation = validateIslamicReferenceLibrary(validLib);
    assert.equal(
      validation.valid,
      true,
      `Expected approved Batch 4 key ${key} to pass validation`,
    );
    assert.ok(
      extractedKeys.includes(key),
      `Batch 4 key ${key} missing from APPROVED_QURAN_VERSE_KEYS`,
    );
  }

  // Explicitly prove the nine Batch 5 keys are accepted
  const batch5ApprovedKeys = [
    "4:36",
    "4:135",
    "5:8",
    "9:119",
    "17:23",
    "25:63",
    "31:18",
    "33:70",
    "68:4",
  ];
  for (const key of batch5ApprovedKeys) {
    const validLib = cloneLibrary();
    firstReferenceOfType(validLib, "quran").verseKeys = [key];
    const validation = validateIslamicReferenceLibrary(validLib);
    assert.equal(
      validation.valid,
      true,
      `Expected approved Batch 5 key ${key} to pass validation`,
    );
    assert.ok(
      extractedKeys.includes(key),
      `Batch 5 key ${key} missing from APPROVED_QURAN_VERSE_KEYS`,
    );
  }

  // Explicitly prove the three Batch 6 keys are accepted
  const batch6ApprovedKeys = ["4:43", "5:6", "9:108"];
  for (const key of batch6ApprovedKeys) {
    const validLib = cloneLibrary();
    firstReferenceOfType(validLib, "quran").verseKeys = [key];
    const validation = validateIslamicReferenceLibrary(validLib);
    assert.equal(
      validation.valid,
      true,
      `Expected approved Batch 6 key ${key} to pass validation`,
    );
    assert.ok(
      extractedKeys.includes(key),
      `Batch 6 key ${key} missing from APPROVED_QURAN_VERSE_KEYS`,
    );
  }

  // Explicitly prove the five Batch 7 keys are accepted
  const batch7ApprovedKeys = ["16:116", "5:3", "2:188", "2:275", "17:32"];
  for (const key of batch7ApprovedKeys) {
    const validLib = cloneLibrary();
    firstReferenceOfType(validLib, "quran").verseKeys = [key];
    const validation = validateIslamicReferenceLibrary(validLib);
    assert.equal(
      validation.valid,
      true,
      `Expected approved Batch 7 key ${key} to pass validation`,
    );
    assert.ok(
      extractedKeys.includes(key),
      `Batch 7 key ${key} missing from APPROVED_QURAN_VERSE_KEYS`,
    );
  }

  // Explicitly prove the four Batch 8 keys are accepted
  const batch8ApprovedKeys = ["40:60", "33:41", "33:42", "7:55"];
  for (const key of batch8ApprovedKeys) {
    const validLib = cloneLibrary();
    firstReferenceOfType(validLib, "quran").verseKeys = [key];
    const validation = validateIslamicReferenceLibrary(validLib);
    assert.equal(
      validation.valid,
      true,
      `Expected approved Batch 8 key ${key} to pass validation`,
    );
    assert.ok(
      extractedKeys.includes(key),
      `Batch 8 key ${key} missing from APPROVED_QURAN_VERSE_KEYS`,
    );
  }

  // Explicitly prove the rejected Batch 4 candidate keys are rejected and NOT in whitelist
  const batch4RejectedCandidateKeys = ["9:122", "53:3", "53:4"];
  for (const key of batch4RejectedCandidateKeys) {
    const invalidLib = cloneLibrary();
    firstReferenceOfType(invalidLib, "quran").verseKeys = [key];
    assertInvalid(invalidLib, "verseKeys is invalid");
    assert.equal(
      extractedKeys.includes(key),
      false,
      `Rejected Batch 4 candidate ${key} should not be in whitelist`,
    );
  }

  // Explicitly prove the rejected Batch 5 candidate keys are rejected and NOT in whitelist
  const batch5RejectedCandidateKeys = ["16:90", "7:199"];
  for (const key of batch5RejectedCandidateKeys) {
    const invalidLib = cloneLibrary();
    firstReferenceOfType(invalidLib, "quran").verseKeys = [key];
    assertInvalid(invalidLib, "verseKeys is invalid");
    assert.equal(
      extractedKeys.includes(key),
      false,
      `Rejected Batch 5 candidate ${key} should not be in whitelist`,
    );
  }

  // Explicitly prove the rejected Batch 6 candidate keys are rejected and NOT in whitelist
  const batch6RejectedCandidateKeys = ["2:222", "74:4"];
  for (const key of batch6RejectedCandidateKeys) {
    const invalidLib = cloneLibrary();
    firstReferenceOfType(invalidLib, "quran").verseKeys = [key];
    assertInvalid(invalidLib, "verseKeys is invalid");
    assert.equal(
      extractedKeys.includes(key),
      false,
      `Rejected Batch 6 candidate ${key} should not be in whitelist`,
    );
  }

  // Explicitly prove the rejected Batch 7 candidate keys are rejected and NOT in whitelist
  const batch7RejectedCandidateKeys = ["5:87", "2:172", "5:1", "24:30"];
  for (const key of batch7RejectedCandidateKeys) {
    const invalidLib = cloneLibrary();
    firstReferenceOfType(invalidLib, "quran").verseKeys = [key];
    assertInvalid(invalidLib, "verseKeys is invalid");
    assert.equal(
      extractedKeys.includes(key),
      false,
      `Rejected Batch 7 candidate ${key} should not be in whitelist`,
    );
  }

  // Explicitly prove the omitted Batch 8 secondary candidates remain unapproved
  const batch8RejectedCandidateKeys = ["2:186", "13:28", "7:205"];
  for (const key of batch8RejectedCandidateKeys) {
    const invalidLib = cloneLibrary();
    firstReferenceOfType(invalidLib, "quran").verseKeys = [key];
    assertInvalid(invalidLib, "verseKeys is invalid");
    assert.equal(
      extractedKeys.includes(key),
      false,
      `Rejected Batch 8 candidate ${key} should not be in whitelist`,
    );
  }
});

test("all four Taharah topics are reference-ready with vetted sources", () => {
  const collection = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "taharah");
  assert.ok(collection);
  assert.equal(collection.topics.length, 4);

  // 1. Purification: 9:108, Muslim 223 / 65004, Alharamain 251
  const purification = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "taharah-purification");
  assert.ok(purification);
  assert.equal(purification.status, "reference-ready");
  assert.equal(purification.references.length, 3);
  assert.deepEqual(
    purification.references.map((r) => r.type),
    ["quran", "hadith", "scholarly"],
  );
  assert.deepEqual(
    purification.references.find((r) => r.type === "quran")?.verseKeys,
    ["9:108"],
  );
  const purHadith = purification.references.find((r) => r.type === "hadith");
  assert.ok(purHadith);
  assert.equal(purHadith.collectionId, "muslim");
  assert.equal(purHadith.locator, "223");
  assert.equal(purHadith.sourceRecordId, "65004");
  const purScholarly = purification.references.find((r) => r.type === "scholarly");
  assert.ok(purScholarly);
  assert.equal(purScholarly.id, "scholarly:taharah-purification:alharamain-251");
  assert.equal(purScholarly.title, "What A Muslim Must Know");
  assert.equal(
    purScholarly.author,
    "The Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque",
  );
  assert.equal(purScholarly.sourceName, "Alharamain's Message");
  assert.equal(
    purScholarly.responsibleOrganization,
    "Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque",
  );
  assert.equal(purScholarly.sourceUrl, "https://risala.prh.gov.sa/en/content/251");
  assert.equal(purScholarly.action, "external-link");
  assert.equal(purScholarly.contentPolicy, "metadata-only");

  // 2. Wudu: 5:6, Bukhari 164 / 3313, Alharamain 251
  const wudu = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "taharah-wudu");
  assert.ok(wudu);
  assert.equal(wudu.status, "reference-ready");
  assert.equal(wudu.references.length, 3);
  assert.deepEqual(
    wudu.references.map((r) => r.type),
    ["quran", "hadith", "scholarly"],
  );
  assert.deepEqual(
    wudu.references.find((r) => r.type === "quran")?.verseKeys,
    ["5:6"],
  );
  const wuduHadith = wudu.references.find((r) => r.type === "hadith");
  assert.ok(wuduHadith);
  assert.equal(wuduHadith.collectionId, "bukhari");
  assert.equal(wuduHadith.locator, "164");
  assert.equal(wuduHadith.sourceRecordId, "3313");
  const wuduScholarly = wudu.references.find((r) => r.type === "scholarly");
  assert.ok(wuduScholarly);
  assert.equal(wuduScholarly.id, "scholarly:taharah-wudu:alharamain-251");
  assert.equal(wuduScholarly.title, "What A Muslim Must Know");
  assert.equal(
    wuduScholarly.author,
    "The Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque",
  );
  assert.equal(wuduScholarly.sourceName, "Alharamain's Message");
  assert.equal(
    wuduScholarly.responsibleOrganization,
    "Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque",
  );
  assert.equal(wuduScholarly.sourceUrl, "https://risala.prh.gov.sa/en/content/251");
  assert.equal(wuduScholarly.action, "external-link");
  assert.equal(wuduScholarly.contentPolicy, "metadata-only");

  // 3. Ghusl: 4:43, Bukhari 272 / 3316, NO SCHOLARLY
  const ghusl = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "taharah-ghusl");
  assert.ok(ghusl);
  assert.equal(ghusl.status, "reference-ready");
  assert.equal(ghusl.references.length, 2);
  assert.deepEqual(
    ghusl.references.map((r) => r.type),
    ["quran", "hadith"],
  );
  assert.deepEqual(
    ghusl.references.find((r) => r.type === "quran")?.verseKeys,
    ["4:43"],
  );
  const ghuslHadith = ghusl.references.find((r) => r.type === "hadith");
  assert.ok(ghuslHadith);
  assert.equal(ghuslHadith.collectionId, "bukhari");
  assert.equal(ghuslHadith.locator, "272");
  assert.equal(ghuslHadith.sourceRecordId, "3316");
  assert.equal(ghusl.references.some((r) => r.type === "scholarly"), false);

  // 4. Cleanliness and Prayer: 5:6, Bukhari 6954 / 3534, Alharamain 251
  const cleanliness = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "taharah-cleanliness-and-prayer");
  assert.ok(cleanliness);
  assert.equal(cleanliness.status, "reference-ready");
  assert.equal(cleanliness.references.length, 3);
  assert.deepEqual(
    cleanliness.references.map((r) => r.type),
    ["quran", "hadith", "scholarly"],
  );
  assert.deepEqual(
    cleanliness.references.find((r) => r.type === "quran")?.verseKeys,
    ["5:6"],
  );
  const cleanlinessHadith = cleanliness.references.find((r) => r.type === "hadith");
  assert.ok(cleanlinessHadith);
  assert.equal(cleanlinessHadith.collectionId, "bukhari");
  assert.equal(cleanlinessHadith.locator, "6954");
  assert.equal(cleanlinessHadith.sourceRecordId, "3534");
  const cleanlinessScholarly = cleanliness.references.find((r) => r.type === "scholarly");
  assert.ok(cleanlinessScholarly);
  assert.equal(cleanlinessScholarly.id, "scholarly:taharah-cleanliness-and-prayer:alharamain-251");
  assert.equal(cleanlinessScholarly.title, "What A Muslim Must Know");
  assert.equal(
    cleanlinessScholarly.author,
    "The Scientific Committee under the Presidency of Religious Affairs at the Sacred Mosque and the Prophet's Mosque",
  );
  assert.equal(cleanlinessScholarly.sourceName, "Alharamain's Message");
  assert.equal(
    cleanlinessScholarly.responsibleOrganization,
    "Presidency of Religious Affairs at the Grand Mosque and the Prophet's Mosque",
  );
  assert.equal(cleanlinessScholarly.sourceUrl, "https://risala.prh.gov.sa/en/content/251");
  assert.equal(cleanlinessScholarly.action, "external-link");
  assert.equal(cleanlinessScholarly.contentPolicy, "metadata-only");
});

test("all five Halal and Haram topics are reference-ready with vetted sources", () => {
  const collection = findCollection(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram");
  assert.ok(collection);
  assert.equal(collection.topics.length, 5);

  // 1. Lawful and Unlawful: 16:116, Muslim 1599 / 4314, NO SCHOLARLY
  const lawful = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram-lawful-and-unlawful");
  assert.ok(lawful);
  assert.equal(lawful.status, "reference-ready");
  assert.equal(lawful.references.length, 2);
  assert.deepEqual(
    lawful.references.map((r) => r.type),
    ["quran", "hadith"],
  );
  assert.deepEqual(
    lawful.references.find((r) => r.type === "quran")?.verseKeys,
    ["16:116"],
  );
  const lawfulHadith = lawful.references.find((r) => r.type === "hadith");
  assert.ok(lawfulHadith);
  assert.equal(lawfulHadith.collectionId, "muslim");
  assert.equal(lawfulHadith.locator, "1599");
  assert.equal(lawfulHadith.sourceRecordId, "4314");
  assert.equal(lawful.references.some((r) => r.type === "scholarly"), false);

  // 2. Food: 5:3, Muslim 1934 / 64643, NO SCHOLARLY
  const food = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram-food");
  assert.ok(food);
  assert.equal(food.status, "reference-ready");
  assert.equal(food.references.length, 2);
  assert.deepEqual(
    food.references.map((r) => r.type),
    ["quran", "hadith"],
  );
  assert.deepEqual(
    food.references.find((r) => r.type === "quran")?.verseKeys,
    ["5:3"],
  );
  const foodHadith = food.references.find((r) => r.type === "hadith");
  assert.ok(foodHadith);
  assert.equal(foodHadith.collectionId, "muslim");
  assert.equal(foodHadith.locator, "1934");
  assert.equal(foodHadith.sourceRecordId, "64643");
  assert.equal(food.references.some((r) => r.type === "scholarly"), false);

  // 3. Income: 2:188, Bukhari 1471 / 3785, Alharamain 251
  const income = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram-income");
  assert.ok(income);
  assert.equal(income.status, "reference-ready");
  assert.equal(income.references.length, 3);
  assert.deepEqual(
    income.references.map((r) => r.type),
    ["quran", "hadith", "scholarly"],
  );
  assert.deepEqual(
    income.references.find((r) => r.type === "quran")?.verseKeys,
    ["2:188"],
  );
  const incomeHadith = income.references.find((r) => r.type === "hadith");
  assert.ok(incomeHadith);
  assert.equal(incomeHadith.collectionId, "bukhari");
  assert.equal(incomeHadith.locator, "1471");
  assert.equal(incomeHadith.sourceRecordId, "3785");
  const incomeScholarly = income.references.find((r) => r.type === "scholarly");
  assert.ok(incomeScholarly);
  assert.equal(incomeScholarly.id, "scholarly:halal-and-haram-income:alharamain-251");
  assert.equal(incomeScholarly.title, "What A Muslim Must Know");
  assert.equal(
    incomeScholarly.locator,
    "Chapter Three: Transactions — rules related to financial transactions, items 4 and 6",
  );

  // 4. Transactions: 2:275, Muslim 1515 / 5918, Alharamain 251
  const transactions = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram-transactions");
  assert.ok(transactions);
  assert.equal(transactions.status, "reference-ready");
  assert.equal(transactions.references.length, 3);
  assert.deepEqual(
    transactions.references.map((r) => r.type),
    ["quran", "hadith", "scholarly"],
  );
  assert.deepEqual(
    transactions.references.find((r) => r.type === "quran")?.verseKeys,
    ["2:275"],
  );
  const transHadith = transactions.references.find((r) => r.type === "hadith");
  assert.ok(transHadith);
  assert.equal(transHadith.collectionId, "muslim");
  assert.equal(transHadith.locator, "1515");
  assert.equal(transHadith.sourceRecordId, "5918");
  const transScholarly = transactions.references.find((r) => r.type === "scholarly");
  assert.ok(transScholarly);
  assert.equal(transScholarly.id, "scholarly:halal-and-haram-transactions:alharamain-251");
  assert.equal(transScholarly.title, "What A Muslim Must Know");
  assert.equal(transScholarly.locator, "Chapter Three: Transactions");

  // 5. Relationships and Conduct: 17:32, Bukhari 5232 / 5888, NO SCHOLARLY
  const rel = findTopic(ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY, "halal-and-haram-relationships-and-conduct");
  assert.ok(rel);
  assert.equal(rel.status, "reference-ready");
  assert.equal(rel.references.length, 2);
  assert.deepEqual(
    rel.references.map((r) => r.type),
    ["quran", "hadith"],
  );
  assert.deepEqual(
    rel.references.find((r) => r.type === "quran")?.verseKeys,
    ["17:32"],
  );
  const relHadith = rel.references.find((r) => r.type === "hadith");
  assert.ok(relHadith);
  assert.equal(relHadith.collectionId, "bukhari");
  assert.equal(relHadith.locator, "5232");
  assert.equal(relHadith.sourceRecordId, "5888");
  assert.equal(rel.references.some((r) => r.type === "scholarly"), false);
});

test("all four Du'a and Dhikr topics are reference-ready with the exact Batch 8 source matrix", () => {
  const collection = findCollection(
    ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
    "dua-and-dhikr",
  );
  assert.ok(collection);
  assert.equal(collection.topics.length, 4);

  const expected = [
    {
      topicId: "dua-and-dhikr-dua",
      quranId: "quran:dua-and-dhikr-dua:40-60",
      verseKey: "40:60",
      hadithId: "hadith:dua-and-dhikr-dua:hadeethenc-5502",
      collectionId: "bukhari",
      locator: "6389",
      providerId: "5502",
    },
    {
      topicId: "dua-and-dhikr-dhikr",
      quranId: "quran:dua-and-dhikr-dhikr:33-41",
      verseKey: "33:41",
      hadithId: "hadith:dua-and-dhikr-dhikr:hadeethenc-8402",
      collectionId: "muslim",
      locator: "373",
      providerId: "8402",
    },
    {
      topicId: "dua-and-dhikr-morning-and-evening-remembrance",
      quranId: "quran:dua-and-dhikr-morning-and-evening-remembrance:33-42",
      verseKey: "33:42",
      hadithId: "hadith:dua-and-dhikr-morning-and-evening-remembrance:hadeethenc-5485",
      collectionId: "abu-dawud",
      locator: "5074",
      providerId: "5485",
    },
    {
      topicId: "dua-and-dhikr-etiquette-of-supplication",
      quranId: "quran:dua-and-dhikr-etiquette-of-supplication:7-55",
      verseKey: "7:55",
      hadithId: "hadith:dua-and-dhikr-etiquette-of-supplication:hadeethenc-3232",
      collectionId: "muslim",
      locator: "2735",
      providerId: "3232",
    },
  ];

  for (const item of expected) {
    const topic = findTopic(
      ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY,
      item.topicId,
    );

    assert.ok(topic, `Missing Batch 8 topic ${item.topicId}`);
    assert.equal(topic.status, "reference-ready");
    assert.equal(topic.references.length, 2);
    assert.deepEqual(
      topic.references.map((reference) => reference.type),
      ["quran", "hadith"],
    );

    const quranRef = topic.references.find(
      (reference) => reference.type === "quran",
    );
    assert.ok(quranRef);
    assert.equal(quranRef.id, item.quranId);
    assert.deepEqual(quranRef.verseKeys, [item.verseKey]);

    const hadithRef = topic.references.find(
      (reference) => reference.type === "hadith",
    );
    assert.ok(hadithRef);
    assert.equal(hadithRef.id, item.hadithId);
    assert.equal(hadithRef.collectionId, item.collectionId);
    assert.equal(hadithRef.locator, item.locator);
    assert.equal(hadithRef.sourceRecordId, item.providerId);

    assert.equal(
      topic.references.some((reference) => reference.type === "scholarly"),
      false,
    );
  }
});

test("duplicate Quran coordinates inside one reference fail closed", () => {
  const library = cloneLibrary();
  firstReferenceOfType(library, "quran").verseKeys = ["2:177", "2:177"];

  assertInvalid(library, "verseKeys contains duplicates");
});

test("HadeethEnc origin, HTTPS, and record IDs are enforced", () => {
  const wrongOrigin = cloneLibrary();
  firstReferenceOfType(wrongOrigin, "hadith").sourceUrl =
    "https://example.com/hadith/4563";
  assertInvalid(wrongOrigin, "approved HadeethEnc HTTPS URL");

  const http = cloneLibrary();
  firstReferenceOfType(http, "hadith").sourceUrl =
    "http://hadeethenc.com/en/browse/hadith/4563";
  assertInvalid(http, "approved HadeethEnc HTTPS URL");

  const missingRecord = cloneLibrary();
  delete firstReferenceOfType(missingRecord, "hadith").sourceRecordId;
  assertInvalid(missingRecord, "sourceRecordId is invalid");
});

test("scholarly origin, HTTPS, author, and responsible organization are enforced", () => {
  const wrongOrigin = cloneLibrary();
  firstReferenceOfType(wrongOrigin, "scholarly").sourceUrl =
    "https://example.com/creed";
  assertInvalid(wrongOrigin, "approved Alharamain HTTPS URL");

  const missingAuthor = cloneLibrary();
  delete firstReferenceOfType(missingAuthor, "scholarly").author;
  assertInvalid(missingAuthor, "author is invalid");

  const missingOrganization = cloneLibrary();
  delete firstReferenceOfType(
    missingOrganization,
    "scholarly",
  ).responsibleOrganization;
  assertInvalid(missingOrganization, "responsibleOrganization is invalid");
});

test("explicit hadith grading remains required", () => {
  const library = cloneLibrary();
  delete firstReferenceOfType(library, "hadith").grading;

  assertInvalid(library, "grading is missing");
});

test("external references enforce metadata-only policy", () => {
  for (const type of ["hadith", "scholarly"]) {
    const library = cloneLibrary();
    firstReferenceOfType(library, type).contentPolicy = "bundled-copy";
    assertInvalid(library, "contentPolicy must be metadata-only");
  }
});

test("Quran, Hadith, and scholarly reference actions cannot be interchanged", () => {
  const quranLibrary = cloneLibrary();
  firstReferenceOfType(quranLibrary, "quran").action = "external-link";
  assertInvalid(quranLibrary, "trusted Quran navigation");

  const hadithLibrary = cloneLibrary();
  firstReferenceOfType(hadithLibrary, "hadith").action =
    "internal-quran-navigation";
  assertInvalid(hadithLibrary, "action must be internal-hadith-navigation");

  const scholarlyLibrary = cloneLibrary();
  firstReferenceOfType(scholarlyLibrary, "scholarly").action =
    "internal-hadith-navigation";
  assertInvalid(scholarlyLibrary, "action must be external-link");
});

test("Hadith references require valid collectionId", () => {
  const missingCol = cloneLibrary();
  delete firstReferenceOfType(missingCol, "hadith").collectionId;
  assertInvalid(missingCol, "collectionId is invalid");

  const invalidCol = cloneLibrary();
  firstReferenceOfType(invalidCol, "hadith").collectionId = "INVALID ID!";
  assertInvalid(invalidCol, "collectionId is invalid");
});

test("unknown and copied content fields fail closed", () => {
  for (const forbiddenField of ["body", "excerpt", "content"]) {
    const library = cloneLibrary();
    firstReferenceOfType(library, "hadith")[forbiddenField] =
      "Copied external source text.";
    assertInvalid(library, `.${forbiddenField} is not allowed`);
  }
});

test("HTML-like metadata fails closed", () => {
  const library = cloneLibrary();
  firstReferenceOfType(library, "hadith").title =
    "<strong>Injected markup</strong>";

  assertInvalid(library, ".title is invalid");
});

test("unsupported reference types fail closed", () => {
  const library = cloneLibrary();
  firstReferenceOfType(library, "quran").type = "course";

  assertInvalid(library, ".type is unsupported");
});

test("root, collection, and topic unknown fields fail closed", () => {
  const rootLibrary = cloneLibrary();
  rootLibrary.course = true;
  assertInvalid(rootLibrary, "library.course is not allowed");

  const collectionLibrary = cloneLibrary();
  collectionLibrary.collections[0].module = true;
  assertInvalid(collectionLibrary, ".module is not allowed");

  const topicLibrary = cloneLibrary();
  topicLibrary.collections[0].topics[0].lesson = true;
  assertInvalid(topicLibrary, ".lesson is not allowed");
});

test("malformed roots and unsupported schema versions fail closed", () => {
  const malformed = validateIslamicReferenceLibrary(null);
  assert.equal(malformed.valid, false);
  assert.ok(malformed.issues.some((issue) => issue.includes("missing or malformed")));

  const unsupported = cloneLibrary();
  unsupported.schemaVersion = 3;
  assertInvalid(unsupported, "unsupported reference library schema");
});

test("malformed collection, topic, and reference IDs fail closed", () => {
  const collectionLibrary = cloneLibrary();
  collectionLibrary.collections[0].id = "Bad Collection";
  assertInvalid(collectionLibrary, ".id is invalid");

  const topicLibrary = cloneLibrary();
  topicLibrary.collections[0].topics[0].id = "bad topic";
  assertInvalid(topicLibrary, ".id is invalid");

  const referenceLibrary = cloneLibrary();
  firstReferenceOfType(referenceLibrary, "quran").id = "Bad Reference";
  assertInvalid(referenceLibrary, ".id is invalid");
});

test("validated production data is deeply frozen", () => {
  const library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY;
  assert.equal(Object.isFrozen(library), true);
  assert.equal(Object.isFrozen(library.collections), true);

  for (const collection of library.collections) {
    assert.equal(Object.isFrozen(collection), true);
    assert.equal(Object.isFrozen(collection.references), true);
    assert.equal(Object.isFrozen(collection.topics), true);

    for (const topic of collection.topics) {
      assert.equal(Object.isFrozen(topic), true);
      assert.equal(Object.isFrozen(topic.references), true);
    }

    for (const reference of [
      ...collection.references,
      ...collection.topics.flatMap((topic) => topic.references),
    ]) {
      assert.equal(Object.isFrozen(reference), true);
      if (reference.type === "quran") {
        assert.equal(Object.isFrozen(reference.verseKeys), true);
      }
      if (reference.type === "hadith") {
        assert.equal(Object.isFrozen(reference.grading), true);
      }
    }
  }
});

test("successful validation freezes a detached clone instead of caller data", () => {
  const callerOwned = cloneLibrary();
  const result = validateIslamicReferenceLibrary(callerOwned);

  assert.equal(result.valid, true);
  assert.ok(result.library);
  assert.notEqual(result.library, callerOwned);
  assert.equal(Object.isFrozen(result.library), true);
  assert.equal(Object.isFrozen(callerOwned), false);
});

test("M9R has no Education, Today Study, or Evidence model dependency", () => {
  const source = readFileSync(
    new URL("../app/islamic-reference-library.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:EducationCatalog|EducationCourse|EducationModule|EducationLesson|EducationProgress|KnowledgeCheck|TodayStudy|Evidence)\b/,
  );
});

test("all seven Akhirah topics are reference-ready with vetted sources", () => {
  const library = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY;
  const akhirah = findCollection(library, "akhirah");
  assert.ok(akhirah);
  assert.equal(akhirah.topics.length, 7);

  const topicIds = [
    "akhirah-death",
    "akhirah-life-of-the-grave",
    "akhirah-resurrection",
    "akhirah-day-of-judgment",
    "akhirah-accountability",
    "akhirah-paradise",
    "akhirah-hellfire",
  ];

  assert.deepEqual(akhirah.topics.map((t) => t.id), topicIds);

  for (const topicId of topicIds) {
    const topic = findTopic(library, topicId);
    assert.equal(topic.status, "reference-ready");
    assert.equal(topic.references.length, 2);
    assert.equal(topic.references[0].type, "quran");
    assert.equal(topic.references[1].type, "hadith");
    assert.equal(topic.references[0].action, "internal-quran-navigation");
    assert.equal(topic.references[1].action, "internal-hadith-navigation");
  }
});
