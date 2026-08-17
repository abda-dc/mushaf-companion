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
  assert.equal(planned.length, 37);
  assert.equal(ready.length, 12);
  assert.ok(planned.every((topic) => topic.references.length === 0));
  assert.ok(ready.every((topic) => topic.references.length >= 1));
});

test("planned topics containing references fail closed", () => {
  const library = cloneLibrary();
  const planned = findTopic(library, "tawhid-worship-of-allah-alone");
  planned.references.push(
    structuredClone(findCollection(library, "iman").references[0]),
  );
  planned.references[0].id = "quran:tawhid-worship:2-177";

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

test("all scholarly references for A Glimpse into the Islamic Creed use /en/content/81 and not /en/content/381", () => {
  const allRefs = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.flatMap((c) => [
    ...c.references,
    ...c.topics.flatMap((t) => t.references),
  ]);
  const scholarlyRefs = allRefs.filter((r) => r.type === "scholarly");
  assert.equal(scholarlyRefs.length, 13);
  for (const ref of scholarlyRefs) {
    assert.equal(ref.sourceUrl, "https://risala.prh.gov.sa/en/content/81");
    assert.notEqual(ref.sourceUrl, "https://risala.prh.gov.sa/en/content/381");
  }
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
