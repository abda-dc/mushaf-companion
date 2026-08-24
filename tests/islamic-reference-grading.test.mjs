import test from "node:test";
import assert from "node:assert/strict";

import { ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY } from "../app/islamic-reference-library.ts";

test("Tirmidhi 1987 uses the approved Hasan grading", () => {
  const ihsan = ISLAMIC_FOUNDATIONS_REFERENCE_LIBRARY.collections.find(
    (collection) => collection.id === "ihsan",
  );
  assert.ok(ihsan, "Missing Ihsan collection");

  const taqwa = ihsan.topics.find((topic) => topic.id === "ihsan-taqwa");
  assert.ok(taqwa, "Missing Taqwa topic");

  const hadith = taqwa.references.find(
    (reference) =>
      reference.type === "hadith"
      && reference.collectionId === "tirmidhi"
      && reference.locator === "1987"
      && reference.sourceRecordId === "4302",
  );
  assert.ok(hadith, "Missing Jami' at-Tirmidhi 1987 reference");

  assert.equal(hadith.grading.label, "At-Tirmidhi said: Hasan");
  assert.notEqual(hadith.grading.label, "Authentic");
  assert.equal(hadith.grading.authority, "HadeethEnc");
  assert.equal(hadith.grading.reference, "Jami' at-Tirmidhi 1987");
});
