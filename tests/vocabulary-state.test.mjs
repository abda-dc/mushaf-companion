import assert from "node:assert/strict";
import test from "node:test";

import { WordStudyProviderRegistry, coordinateKey } from "../app/word-study.ts";
import {
  FOUNDATION_125_ID,
  VOCABULARY_CURRICULUM_REGISTRY,
  VocabularyCurriculumRegistry,
  auditVocabularyCurriculum,
} from "../app/vocabulary-curriculum.ts";
import {
  dueVocabularyEntries,
  nextNewVocabularyIds,
  normalizeVocabularyProgress,
  recordVocabularyReview,
  vocabularyCurriculumProgress,
  vocabularyEntryStatus,
} from "../app/vocabulary-state.mjs";

const CURRICULUM = { id: FOUNDATION_125_ID, sourceRevision: "fixture-r1" };

test("vocabulary reviews share deterministic Again, Hard, Good, and Easy interval semantics", () => {
  const again = recordVocabularyReview(undefined, CURRICULUM, "entry:again", "again", "2026-08-10");
  const hard = recordVocabularyReview(undefined, CURRICULUM, "entry:hard", "hard", "2026-08-10");
  const good = recordVocabularyReview(undefined, CURRICULUM, "entry:good", "good", "2026-08-10");
  const easy = recordVocabularyReview(undefined, CURRICULUM, "entry:easy", "easy", "2026-08-10");
  assert.equal(again.entries[0].dueAt, "2026-08-11");
  assert.equal(hard.entries[0].dueAt, "2026-08-12");
  assert.equal(good.entries[0].dueAt, "2026-08-13");
  assert.equal(easy.entries[0].dueAt, "2026-08-17");
});

test("vocabulary states move from not started to learning, due, and strong deterministically", () => {
  assert.equal(vocabularyEntryStatus(undefined, "entry:1", "2026-08-10"), "not-started");
  let progress = recordVocabularyReview(undefined, CURRICULUM, "entry:1", "easy", "2026-08-10");
  assert.equal(vocabularyEntryStatus(progress, "entry:1", "2026-08-17"), "due");
  progress = recordVocabularyReview(progress, CURRICULUM, "entry:1", "easy", "2026-08-17");
  assert.equal(vocabularyEntryStatus(progress, "entry:1", "2026-08-18"), "strong");
});

test("curriculum progress, due ordering, and new selection are deterministic", () => {
  let progress = recordVocabularyReview(undefined, CURRICULUM, "entry:2", "good", "2026-08-01");
  progress = recordVocabularyReview(progress, CURRICULUM, "entry:1", "again", "2026-08-09");
  const ids = ["entry:1", "entry:2", "entry:3", "entry:4"];
  assert.deepEqual(dueVocabularyEntries(progress, "2026-08-10").map((entry) => entry.entryId), ["entry:2", "entry:1"]);
  assert.deepEqual(vocabularyCurriculumProgress(progress, ids, "2026-08-10"), { total: 4, studied: 2, due: 2, strong: 0, remaining: 2 });
  assert.deepEqual(nextNewVocabularyIds(progress, ids, 2), ["entry:3", "entry:4"]);
});

test("vocabulary restore rejects impossible dates and bounds entries and history before normalization", () => {
  const valid = { entryId: "entry:valid", firstStudied: "2024-02-29", lastStudied: "2026-08-10", dueAt: "2026-08-13", grade: "good", intervalDays: 3, reviewCount: 1, lapses: 0 };
  const normalized = normalizeVocabularyProgress({
    schemaVersion: 1,
    curriculumId: FOUNDATION_125_ID,
    sourceRevision: "fixture-r1",
    entries: [
      { ...valid, entryId: "entry:february", firstStudied: "2026-02-31" },
      { ...valid, entryId: "entry:april", dueAt: "2026-04-31" },
      { ...valid, entryId: "entry:invalid-leap", firstStudied: "2023-02-29" },
      valid,
    ],
    history: Array.from({ length: 25_000 }, () => ({ entryId: valid.entryId, grade: "good", reviewedAt: "2026-08-10", dueAt: "2026-08-13", intervalDays: 3 })),
    activityDates: ["2026-02-31", "2024-02-29"],
  });
  assert.deepEqual(normalized.entries.map((entry) => entry.entryId), ["entry:valid"]);
  assert.deepEqual(normalized.activityDates, ["2024-02-29"]);
  assert.equal(normalized.history.length, 20_000);
});

function activeWordMetadata() {
  return {
    schemaVersion: 1,
    sourceId: "fixture:word-study",
    datasetId: "fixture-dataset",
    provider: "Fixture provider",
    dataset: "Fixture dataset",
    edition: "Fixture edition",
    version: "1.0.0",
    revision: "fixture-r1",
    sourceUrl: "https://example.test/source",
    license: { name: "Fixture license", url: "https://example.test/license", attribution: "Fixture only.", redistribution: "permitted", offlineStorage: "permitted", modification: "permitted" },
    integrity: { algorithm: "SHA-256", checksum: "e".repeat(64), normalizationVersion: "fixture-v1" },
    coverage: { verses: 1, words: 125, lemmas: 0, roots: 0, occurrences: 0, description: "Synthetic identifiers only." },
    enabled: true,
    approvalStatus: "approved",
    approvalReference: "test-suite-only",
    auditStatus: "passed",
    auditedAt: "2026-08-10",
    blockers: [],
  };
}

function foundationFixture() {
  return {
    schemaVersion: 1,
    id: FOUNDATION_125_ID,
    level: "foundation-125",
    title: "Foundation 125 fixture",
    sourceId: "fixture:word-study",
    sourceRevision: "fixture-r1",
    approvalStatus: "approved",
    approvalReference: "test-suite-only",
    expectedEntryCount: 125,
    enabled: true,
    entries: Array.from({ length: 125 }, (_, index) => ({ entryId: `entry:${index + 1}`, wordId: `word:${index + 1}`, rank: index + 1, coordinate: { verseKey: "1:1", wordPosition: index + 1, page: 1, line: index % 15 + 1, sourceWordId: 1000 + index } })),
  };
}

function descriptorFor(curriculum) {
  const descriptor = structuredClone(curriculum);
  delete descriptor.entries;
  return descriptor;
}

function wordRegistry({ missingIndex = -1, mismatchedIndex = -1 } = {}) {
  const registry = new WordStudyProviderRegistry();
  const source = activeWordMetadata();
  const curriculum = foundationFixture();
  const records = curriculum.entries.map((entry, index) => ({
    id: entry.wordId,
    coordinate: index === mismatchedIndex ? { ...entry.coordinate, line: entry.coordinate.line === 15 ? 14 : entry.coordinate.line + 1 } : entry.coordinate,
    provenance: { sourceId: source.sourceId, datasetId: source.datasetId, revision: source.revision },
  }));
  registry.register({
    metadata: () => source,
    async getWord(coordinate) { const record = records.find((item) => coordinateKey(item.coordinate) === coordinateKey(coordinate)); return record && records.indexOf(record) !== missingIndex ? record : null; },
    async getWordsForVerse() { return records; },
    async getOccurrencesByLemma() { return { items: [], total: 0 }; },
    async getOccurrencesByRoot() { return { items: [], total: 0 }; },
    async audit() { return { valid: true, issues: [], identity: { sourceId: source.sourceId, datasetId: source.datasetId, revision: source.revision, integrity: { algorithm: "SHA-256", checksum: source.integrity.checksum, status: "verified" } }, counts: { words: 125, occurrences: 0, lemmas: 0, roots: 0 } }; },
  }, { sourceId: source.sourceId, supportedRevisions: [source.revision], supportedChecksumAlgorithms: ["SHA-256"], requiredRights: ["redistribution", "offlineStorage", "modification"] });
  return registry;
}

async function loadFixture(curriculum, registry = wordRegistry()) {
  const curricula = new VocabularyCurriculumRegistry();
  const descriptor = descriptorFor(foundationFixture());
  curricula.register({ descriptor: () => descriptor, async load() { return curriculum; } });
  return curricula.load(FOUNDATION_125_ID, registry);
}

test("Foundation 125 remains unavailable in production until both source and curriculum approval", async () => {
  const result = await VOCABULARY_CURRICULUM_REGISTRY.load(FOUNDATION_125_ID);
  assert.equal(result.status, "unavailable");
  assert.match(result.issues.join(" "), /disabled pending source and editorial approval/);
});

test("loaded descriptor identity, level, source, revision, expected count, and approval must match", async () => {
  const fields = [
    ["id", "foundation-other"],
    ["level", "core-250"],
    ["sourceId", "fixture:other-source"],
    ["sourceRevision", "fixture-r2"],
    ["expectedEntryCount", 124],
    ["approvalReference", "different-approval"],
  ];
  for (const [field, value] of fields) {
    const curriculum = foundationFixture();
    curriculum[field] = value;
    const result = await loadFixture(curriculum);
    assert.equal(result.status, "invalid", `${field} mismatch must fail closed`);
    assert.match(result.issues.join(" "), /identity does not match/);
  }
  const blocked = foundationFixture();
  blocked.enabled = false;
  blocked.approvalStatus = "blocked";
  blocked.approvalReference = null;
  const registry = new VocabularyCurriculumRegistry();
  registry.register({ descriptor: () => descriptorFor(blocked), async load() { return blocked; } });
  assert.equal((await registry.load(FOUNDATION_125_ID, wordRegistry())).status, "unavailable");
});

test("every Foundation 125 entry requires an exact provider-backed word and coordinate", async () => {
  const curriculum = foundationFixture();
  assert.equal((await loadFixture(curriculum, wordRegistry({ missingIndex: 42 }))).status, "invalid");
  assert.equal((await loadFixture(curriculum, wordRegistry({ mismatchedIndex: 42 }))).status, "invalid");
});

test("an exact approved 125-entry provider-backed fixture succeeds", async () => {
  const curriculum = foundationFixture();
  const ready = await loadFixture(curriculum);
  assert.equal(ready.status, "ready", ready.issues.join("\n"));
  assert.equal(ready.curriculum.entries.length, 125);
  assert.equal(auditVocabularyCurriculum(curriculum, "fixture-r1").valid, true);
});
