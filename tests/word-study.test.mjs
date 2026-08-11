import assert from "node:assert/strict";
import test from "node:test";

import {
  QAC_REFERENCE_METADATA,
  WORD_STUDY_PROVIDER_REGISTRY,
  WordStudyProviderRegistry,
  auditWordStudyDataset,
  coordinateForPageWord,
  coordinateKey,
  isCanonicalVerseKey,
  pageWordForCoordinate,
  validateWordCoordinate,
  validateWordStudyMetadata,
  validateWordStudyRecord,
} from "../app/word-study.ts";

const PROVENANCE = { sourceId: "fixture:word-study", datasetId: "fixture-dataset", revision: "fixture-r1" };

function fixtureMetadata(overrides = {}) {
  const base = {
    schemaVersion: 1,
    sourceId: "fixture:word-study",
    datasetId: "fixture-dataset",
    provider: "Mushaf test fixture",
    dataset: "Synthetic coordinate fixture",
    edition: "Test edition",
    version: "1.0.0",
    revision: "fixture-r1",
    sourceUrl: "https://example.test/word-study",
    license: { name: "Test fixture license", url: "https://example.test/license", attribution: "Synthetic records for automated tests only.", redistribution: "permitted", offlineStorage: "permitted", modification: "permitted" },
    integrity: { algorithm: "SHA-256", checksum: "c".repeat(64), normalizationVersion: "fixture-v1" },
    coverage: { verses: 1, words: 2, lemmas: 1, roots: 1, occurrences: 2, description: "Two synthetic words on one canonical verse coordinate." },
    enabled: true,
    approvalStatus: "approved",
    approvalReference: "test-suite-only",
    auditStatus: "passed",
    auditedAt: "2026-08-10",
    blockers: [],
  };
  return { ...base, ...overrides };
}

function fixtureDataset(metadata = fixtureMetadata()) {
  const lemma = { id: "lemma:fixture", arabic: "فعل", normalized: "فعل" };
  const root = { id: "root:fixture", arabic: "ف ع ل", letters: ["ف", "ع", "ل"] };
  const words = [1, 2].map((wordPosition) => ({
    id: `word:fixture:${wordPosition}`,
    coordinate: { verseKey: "1:1", wordPosition, page: 1, line: wordPosition, sourceWordId: 100 + wordPosition },
    surfaceText: wordPosition === 1 ? "فعل" : "فعلا",
    transliteration: wordPosition === 1 ? "fiʿl" : "fiʿlan",
    meanings: [{ language: "en", text: `Synthetic meaning ${wordPosition}` }],
    lemma,
    root,
    provenance: PROVENANCE,
  }));
  const occurrences = words.map((word) => ({ wordId: word.id, coordinate: word.coordinate, lemmaId: lemma.id, rootId: root.id, provenance: PROVENANCE }));
  return { schemaVersion: 1, metadata, words, occurrences };
}

function fixturePage() {
  const first = { id: 101, text: "فعل", tajweedHtml: "فعل", verseKey: "1:1", isEnd: false, pageNumber: 1 };
  const second = { id: 102, text: "فعلا", tajweedHtml: "فعلا", verseKey: "1:1", isEnd: false, pageNumber: 1 };
  const end = { id: 103, text: "١", tajweedHtml: "", verseKey: "1:1", isEnd: true, pageNumber: 1 };
  return {
    page: 1,
    juz: 1,
    hizb: 1,
    lines: Array.from({ length: 15 }, (_, index) => ({ number: index + 1, words: index === 0 ? [first] : index === 1 ? [second, end] : [] })),
    verses: [{ key: "1:1", number: 1, chapterId: 1, uthmani: "fixture", transliteration: "", translation: "" }],
    chapters: [{ id: 1, name: "Fixture", translatedName: "Fixture", arabicName: "اختبار", revelationPlace: "makkah" }],
    chapterStarts: [],
    provenance: { verified: true, manifestRevision: "fixture", mushafId: 1, arabicResource: "fixture", tajweedResource: "fixture", translationResource: 20, transliterationResource: 57, pageChecksum: "d".repeat(64) },
  };
}

function policy(sourceId = "fixture:word-study", revisions = ["fixture-r1"]) {
  return { sourceId, supportedRevisions: revisions, supportedChecksumAlgorithms: ["SHA-256"], requiredRights: ["redistribution", "offlineStorage", "modification"] };
}

function verifiedAudit(metadata, counts = metadata.coverage) {
  return {
    valid: true,
    issues: [],
    identity: { sourceId: metadata.sourceId, datasetId: metadata.datasetId, revision: metadata.revision, integrity: { algorithm: metadata.integrity.algorithm, checksum: metadata.integrity.checksum, status: "verified" } },
    counts: { words: counts.words, occurrences: counts.occurrences, lemmas: counts.lemmas, roots: counts.roots },
  };
}

class FixtureProvider {
  constructor(dataset, auditOverride) { this.dataset = dataset; this.auditOverride = auditOverride; this.auditCalls = 0; }
  metadata() { return this.dataset.metadata; }
  async getWord(coordinate) { return this.dataset.words.find((word) => coordinateKey(word.coordinate) === coordinateKey(coordinate)) ?? null; }
  async getWordsForVerse(verseKey) { return this.dataset.words.filter((word) => word.coordinate.verseKey === verseKey); }
  async getOccurrencesByLemma(lemmaId) { const items = this.dataset.occurrences.filter((item) => item.lemmaId === lemmaId); return { items, total: items.length }; }
  async getOccurrencesByRoot(rootId) { const items = this.dataset.occurrences.filter((item) => item.rootId === rootId); return { items, total: items.length }; }
  async audit() { this.auditCalls += 1; return this.auditOverride ?? verifiedAudit(this.dataset.metadata); }
}

test("word coordinates enforce the complete page, line, position, and source identity", () => {
  const page = fixturePage();
  const first = page.lines[0].words[0];
  const second = page.lines[1].words[0];
  const exact = { verseKey: "1:1", wordPosition: 2, page: 1, line: 2, sourceWordId: 102 };
  assert.deepEqual(coordinateForPageWord(page, first), { verseKey: "1:1", wordPosition: 1, page: 1, line: 1, sourceWordId: 101 });
  assert.deepEqual(coordinateForPageWord(page, second), exact);
  assert.equal(pageWordForCoordinate(page, exact).id, 102);
  assert.equal(pageWordForCoordinate(page, { ...exact, page: 2 }), null, "wrong page must fail despite matching verse and position");
  assert.equal(pageWordForCoordinate(page, { ...exact, line: 1 }), null, "wrong line must fail");
  assert.equal(pageWordForCoordinate(page, { ...exact, sourceWordId: 999 }), null, "wrong authoritative word ID must fail");
  assert.equal(pageWordForCoordinate(page, { ...exact, wordPosition: 1 }), null, "provider/Mushaf position convention mismatch must fail");
  assert.equal(coordinateForPageWord(page, page.lines[1].words[1]), null, "ayah end markers are not word coordinates");
});

test("canonical coordinate and defensive metadata validation reject impossible or incomplete values", () => {
  assert.equal(isCanonicalVerseKey("1:7"), true);
  assert.equal(isCanonicalVerseKey("2:287"), false);
  assert.match(validateWordCoordinate({ verseKey: "2:287", wordPosition: 0, page: 605, line: 16 }).join(" "), /canonical.*one-based.*604.*15/);
  assert.doesNotThrow(() => validateWordStudyMetadata({ sourceId: "fixture:word-study" }));
  assert.match(validateWordStudyMetadata({ sourceId: "fixture:word-study" }).join(" "), /license metadata.*integrity metadata.*coverage metadata/);
});

test("dataset audit validates structure but explicitly reports integrity as declared-only", () => {
  const result = auditWordStudyDataset(fixtureDataset());
  assert.equal(result.valid, true, result.issues.join("\n"));
  assert.equal(result.identity.integrity.status, "declared-only");
  assert.deepEqual(result.counts, { words: 2, occurrences: 2, lemmas: 1, roots: 1 });
});

test("runtime activation calls audit and caches only a matching independently verified result", async () => {
  const registry = new WordStudyProviderRegistry();
  const dataset = fixtureDataset();
  const provider = new FixtureProvider(dataset);
  registry.register(provider, policy());
  const first = await registry.activate(dataset.metadata.sourceId);
  const second = await registry.activate(dataset.metadata.sourceId);
  assert.equal(first.status, "active");
  assert.equal(second.status, "active");
  assert.equal(provider.auditCalls, 1, "verified activation may be cached, but audit must actually run first");
  assert.equal((await registry.getWord(dataset.metadata.sourceId, dataset.words[0].coordinate)).id, dataset.words[0].id);
  assert.equal((await registry.getWordsForVerse(dataset.metadata.sourceId, "1:1")).length, 2);
});

test("activation fails closed for missing nested metadata and prohibited rights", async () => {
  const missing = new WordStudyProviderRegistry();
  missing.register({ metadata: () => ({ sourceId: "fixture:missing" }), async audit() { throw new Error("must not run"); } }, policy("fixture:missing"));
  const missingResult = await missing.activate("fixture:missing");
  assert.equal(missingResult.status, "unavailable");
  assert.match(missingResult.reason, /license metadata|integrity metadata/);

  const prohibitedMetadata = fixtureMetadata({ license: { ...fixtureMetadata().license, redistribution: "prohibited" } });
  const prohibited = new WordStudyProviderRegistry();
  const provider = new FixtureProvider(fixtureDataset(prohibitedMetadata));
  prohibited.register(provider, policy());
  const result = await prohibited.activate(prohibitedMetadata.sourceId);
  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /does not permit application use/);
  assert.equal(provider.auditCalls, 0, "statically prohibited content never reaches runtime audit");
});

test("self-declared passed status cannot bypass a failed runtime audit", async () => {
  const metadata = fixtureMetadata({ auditStatus: "passed" });
  const failedAudit = { ...verifiedAudit(metadata), valid: false, issues: ["fixture hash mismatch"] };
  const provider = new FixtureProvider(fixtureDataset(metadata), failedAudit);
  const registry = new WordStudyProviderRegistry();
  registry.register(provider, policy());
  const result = await registry.activate(metadata.sourceId);
  assert.equal(result.status, "unavailable");
  assert.equal(provider.auditCalls, 1);
  assert.equal(registry.getActiveProvider(metadata.sourceId), null);
});

test("unsupported checksum algorithms and revisions cannot activate", async () => {
  const algorithmMetadata = fixtureMetadata({ integrity: { ...fixtureMetadata().integrity, algorithm: "MD5" } });
  const algorithmRegistry = new WordStudyProviderRegistry();
  algorithmRegistry.register(new FixtureProvider(fixtureDataset(algorithmMetadata)), policy());
  assert.match((await algorithmRegistry.activate(algorithmMetadata.sourceId)).reason, /checksum algorithm/);

  const revisionMetadata = fixtureMetadata({ revision: "fixture-r2" });
  const revisionRegistry = new WordStudyProviderRegistry();
  revisionRegistry.register(new FixtureProvider(fixtureDataset(revisionMetadata)), policy(revisionMetadata.sourceId, ["fixture-r1"]));
  assert.match((await revisionRegistry.activate(revisionMetadata.sourceId)).reason, /revision is not supported/);
});

test("runtime word records reject coordinate, provenance, and position-convention mismatches", async () => {
  const source = fixtureMetadata();
  const valid = fixtureDataset(source).words[0];
  assert.deepEqual(validateWordStudyRecord(valid, source, valid.coordinate), []);
  assert.match(validateWordStudyRecord({ ...valid, coordinate: { ...valid.coordinate, page: 2 } }, source, valid.coordinate).join(" "), /does not match/);
  assert.match(validateWordStudyRecord({ ...valid, provenance: { ...valid.provenance, revision: "wrong" } }, source).join(" "), /revision/);

  const dataset = fixtureDataset(source);
  const provider = new FixtureProvider(dataset);
  provider.getWord = async () => ({ ...valid, coordinate: { ...valid.coordinate, wordPosition: 2, sourceWordId: 102 } });
  const registry = new WordStudyProviderRegistry();
  registry.register(provider, policy());
  assert.equal((await registry.activate(source.sourceId)).status, "active");
  assert.equal(await registry.getWord(source.sourceId, valid.coordinate), null);
});

test("reference-only QAC remains disabled, unapproved, and incapable of activation", async () => {
  assert.equal(QAC_REFERENCE_METADATA.enabled, false);
  assert.equal(QAC_REFERENCE_METADATA.approvalStatus, "blocked");
  assert.equal(WORD_STUDY_PROVIDER_REGISTRY.getActiveProvider(QAC_REFERENCE_METADATA.sourceId), null);
  const result = await WORD_STUDY_PROVIDER_REGISTRY.activate(QAC_REFERENCE_METADATA.sourceId);
  assert.equal(result.status, "unavailable");
  assert.equal(await WORD_STUDY_PROVIDER_REGISTRY.getWord(QAC_REFERENCE_METADATA.sourceId, { verseKey: "1:1", wordPosition: 1, page: 1, line: 1, sourceWordId: 1 }), null);
});
