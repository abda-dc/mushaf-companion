import assert from "node:assert/strict";
import test from "node:test";

import {
  CORE_HADITH_COLLECTION_IDS,
  HADITH_COLLECTIONS,
  HADITH_COLLECTION_STATUSES,
  HADITH_CONTENT_AVAILABILITY,
  assertHadithCollectionDefinition,
  assertHadithCollectionRegistry,
  getHadithCollection,
  listHadithCollections,
  normalizeHadithCollectionDefinition,
  normalizeHadithCollectionRegistry,
  validateHadithCollectionDefinition,
  validateHadithCollectionRegistry,
} from "../app/hadith-registry.mjs";

test("1. Six required core collection definitions exist in HADITH_COLLECTIONS", () => {
  assert.equal(HADITH_COLLECTIONS.length, 6, "Expected exactly 6 core collections registered");
  const registeredIds = HADITH_COLLECTIONS.map((c) => c.id);

  assert.deepEqual(registeredIds, [
    "bukhari",
    "muslim",
    "abu-dawud",
    "tirmidhi",
    "nasai",
    "ibn-majah",
  ]);

  for (const coreId of CORE_HADITH_COLLECTION_IDS) {
    const col = getHadithCollection(coreId);
    assert.ok(col, `Expected collection ${coreId} to be found`);
    assert.equal(col.status, "metadata-ready");
    assert.equal(col.contentAvailability, "metadata-only");
    assert.ok(col.displayName.length > 0);
    assert.ok(col.shortName.length > 0);
    assert.ok(col.arabicName !== null && col.arabicName.length > 0);
  }
});

test("2. Collection IDs are strictly unique across the registry", () => {
  const ids = new Set();
  for (const collection of HADITH_COLLECTIONS) {
    assert.ok(!ids.has(collection.id), `Collection ID '${collection.id}' must be unique`);
    ids.add(collection.id);
  }
  assert.equal(ids.size, 6);
});

test("3. Future valid collections are allowed without schema redesign", () => {
  const extendedRegistry = [
    ...HADITH_COLLECTIONS,
    {
      id: "muwatta-malik",
      displayName: "Muwatta Malik",
      shortName: "Muwatta",
      arabicName: "موطأ مالك",
      status: "planned",
      contentAvailability: "metadata-only",
      description: "Early Hadith compilation by Imam Malik ibn Anas.",
    },
    {
      id: "nawawi-40",
      displayName: "An-Nawawi's Forty Hadith",
      shortName: "40 Hadith",
      arabicName: "الأربعون النووية",
      status: "planned",
      contentAvailability: "metadata-only",
      description: "Collection of forty hadiths compiled by Imam Yahya ibn Sharaf an-Nawawi.",
    },
  ];

  const validation = validateHadithCollectionRegistry(extendedRegistry);
  assert.equal(validation.valid, true, `Validation failed: ${validation.errors.join("; ")}`);

  const normalized = normalizeHadithCollectionRegistry(extendedRegistry);
  assert.equal(normalized.length, 8);
  assert.equal(normalized[6].id, "muwatta-malik");
  assert.equal(normalized[7].id, "nawawi-40");
});

test("4. Missing any required core collection causes fail-closed registry rejection", () => {
  const missingMuslim = HADITH_COLLECTIONS.filter((c) => c.id !== "muslim");
  const validation = validateHadithCollectionRegistry(missingMuslim);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /Missing required core collection: 'muslim'/);
  assert.throws(() => assertHadithCollectionRegistry(missingMuslim), /Missing required core collection/);
});

test("5. Duplicate collection IDs fail closed", () => {
  const duplicateRegistry = [
    ...HADITH_COLLECTIONS,
    {
      id: "bukhari",
      displayName: "Duplicate Bukhari",
      shortName: "Bukhari 2",
      arabicName: null,
      status: "planned",
      contentAvailability: "metadata-only",
      description: null,
    },
  ];
  const validation = validateHadithCollectionRegistry(duplicateRegistry);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /Duplicate collection ID 'bukhari'/);
});

test("6. Collection objects and registry array are deeply frozen", () => {
  assert.ok(Object.isFrozen(HADITH_COLLECTIONS), "HADITH_COLLECTIONS must be frozen");
  for (const collection of HADITH_COLLECTIONS) {
    assert.ok(Object.isFrozen(collection), `Collection '${collection.id}' must be frozen`);
    assert.throws(() => {
      // @ts-expect-error mutating frozen object
      collection.displayName = "Tampered";
    }, /Cannot assign to read only property/);
  }
});

test("7. Unsafe HTML-like metadata or control characters in collection definitions fail closed", () => {
  const scriptInName = {
    id: "test-col",
    displayName: "Collection <script>alert(1)</script>",
    shortName: "Test",
    arabicName: null,
    status: "planned",
    contentAvailability: "metadata-only",
    description: null,
  };
  assert.equal(validateHadithCollectionDefinition(scriptInName).valid, false);

  const controlCharInDesc = {
    id: "test-col-2",
    displayName: "Collection Two",
    shortName: "Test 2",
    arabicName: null,
    status: "planned",
    contentAvailability: "metadata-only",
    description: "Invalid \u0000 control char",
  };
  assert.equal(validateHadithCollectionDefinition(controlCharInDesc).valid, false);
});

test("8. Unknown schema fields are strictly rejected", () => {
  const extraField = {
    id: "test-col-3",
    displayName: "Collection Three",
    shortName: "Test 3",
    arabicName: null,
    status: "planned",
    contentAvailability: "metadata-only",
    description: null,
    unexpectedKey: "injected",
  };
  const validation = validateHadithCollectionDefinition(extraField);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /collection\.unexpectedKey is not allowed/);
});

test("9. Claiming content-ready with metadata-only availability fails closed", () => {
  const falseClaim = {
    id: "bukhari-test",
    displayName: "Sahih al-Bukhari",
    shortName: "Bukhari",
    arabicName: "صحيح البخاري",
    status: "content-ready",
    contentAvailability: "metadata-only",
    description: null,
  };
  const validation = validateHadithCollectionDefinition(falseClaim);
  assert.equal(validation.valid, false);
  assert.match(validation.errors.join(" "), /content-ready.*metadata-only/);
});

test("10. listHadithCollections returns all 6 core collections", () => {
  const list = listHadithCollections();
  assert.equal(list.length, 6);
  assert.deepEqual(list.map((c) => c.id), CORE_HADITH_COLLECTION_IDS);
});
