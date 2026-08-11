import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { LatestWordStudyRequestGate, WordStudyProviderRegistry, validateOccurrenceResults } from "../app/word-study.ts";

function metadata(overrides = {}) {
  return {
    schemaVersion: 1,
    sourceId: "fixture:occurrences",
    datasetId: "fixture-occurrences",
    provider: "Occurrence fixture",
    dataset: "Synthetic occurrence coordinates",
    edition: "Test edition",
    version: "1.0.0",
    revision: "fixture-r1",
    sourceUrl: "https://example.test/occurrences",
    license: { name: "Fixture license", url: "https://example.test/license", attribution: "Synthetic test coordinates only.", redistribution: "permitted", offlineStorage: "permitted", modification: "permitted" },
    integrity: { algorithm: "SHA-256", checksum: "f".repeat(64), normalizationVersion: "fixture-v1" },
    coverage: { verses: 2, words: 2, lemmas: 1, roots: 1, occurrences: 2, description: "Two synthetic occurrence coordinates." },
    enabled: true,
    approvalStatus: "approved",
    approvalReference: "test-suite-only",
    auditStatus: "passed",
    auditedAt: "2026-08-10",
    blockers: [],
    ...overrides,
  };
}

function occurrences(count = 2, kind = "both") {
  const provenance = { sourceId: "fixture:occurrences", datasetId: "fixture-occurrences", revision: "fixture-r1" };
  return Array.from({ length: count }, (_, index) => ({
    wordId: `word:${index + 1}`,
    coordinate: { verseKey: index % 2 ? "2:1" : "1:1", wordPosition: index + 1, page: index % 2 ? 2 : 1, line: index % 15 + 1, sourceWordId: 1000 + index },
    ...(kind !== "root" ? { lemmaId: "lemma:fixture" } : {}),
    ...(kind !== "lemma" ? { rootId: "root:fixture" } : {}),
    provenance,
  }));
}

function policy() {
  return { sourceId: "fixture:occurrences", supportedRevisions: ["fixture-r1"], supportedChecksumAlgorithms: ["SHA-256"], requiredRights: ["redistribution", "offlineStorage", "modification"] };
}

function provider({ lemmaItems = occurrences(), rootItems = occurrences(), source = metadata(), queryError = false } = {}) {
  return {
    metadata: () => source,
    async getWord() { return null; },
    async getWordsForVerse() { return []; },
    async getOccurrencesByLemma() { if (queryError) throw new Error("offline"); return { items: lemmaItems, total: lemmaItems.length }; },
    async getOccurrencesByRoot() { if (queryError) throw new Error("offline"); return { items: rootItems, total: rootItems.length }; },
    async audit() {
      return {
        valid: true,
        issues: [],
        identity: { sourceId: source.sourceId, datasetId: source.datasetId, revision: source.revision, integrity: { algorithm: source.integrity.algorithm, checksum: source.integrity.checksum, status: "verified" } },
        counts: { words: source.coverage.words, occurrences: source.coverage.occurrences, lemmas: source.coverage.lemmas, roots: source.coverage.roots },
      };
    },
  };
}

async function activeRegistry(options) {
  const registry = new WordStudyProviderRegistry();
  registry.register(provider(options), policy());
  assert.equal((await registry.activate("fixture:occurrences")).status, "active");
  return registry;
}

test("approved lemma and root lookups return explicit audited results", async () => {
  const registry = await activeRegistry();
  const lemmas = await registry.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture");
  const roots = await registry.getOccurrencesByRoot("fixture:occurrences", "root:fixture");
  assert.equal(lemmas.status, "ok");
  assert.equal(roots.status, "ok");
  assert.equal(lemmas.total, 2);
  assert.equal(lemmas.items.length, 2);
});

test("provider failure is an error, while genuine zero remains an authoritative ok result", async () => {
  const failing = await activeRegistry({ queryError: true });
  const failure = await failing.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture");
  assert.equal(failure.status, "error");
  assert.ok(!("total" in failure), "a failure must not masquerade as a zero total");

  const zero = await activeRegistry({ lemmaItems: [] });
  assert.deepEqual(await zero.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture"), { status: "ok", items: [], total: 0 });
});

test("runtime occurrence validation rejects duplicates and query-identity mismatches", async () => {
  const source = metadata();
  const duplicate = [...occurrences(), { ...occurrences()[0] }];
  assert.equal(validateOccurrenceResults(duplicate, "lemma", "lemma:fixture", source).valid, false);
  const mismatch = occurrences().map((item) => ({ ...item, rootId: "root:wrong" }));
  assert.equal(validateOccurrenceResults(mismatch, "root", "root:fixture", source).valid, false);
  const registry = await activeRegistry({ lemmaItems: duplicate });
  assert.equal((await registry.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture")).status, "error");
});

test("more than 50 occurrences preserve the complete provider total", async () => {
  const items = occurrences(327);
  const source = metadata({ coverage: { verses: 2, words: 327, lemmas: 1, roots: 1, occurrences: 327, description: "327 synthetic audited occurrence coordinates." } });
  const registry = await activeRegistry({ lemmaItems: items, rootItems: items, source });
  const result = await registry.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture");
  assert.equal(result.status, "ok");
  assert.equal(result.total, 327);
  assert.equal(result.items.slice(0, 50).length, 50);
});

test("latest-request identity prevents stale root or lemma responses from overwriting a newer query", async () => {
  const gate = new LatestWordStudyRequestGate();
  const staleRoot = gate.begin("root:root:fixture");
  const currentLemma = gate.begin("lemma:lemma:fixture");
  await Promise.resolve();
  assert.equal(gate.isCurrent(staleRoot), false);
  assert.equal(gate.isCurrent(currentLemma), true);
  gate.cancel();
  assert.equal(gate.isCurrent(currentLemma), false, "closing or navigation invalidates the pending request");
});

test("root and lemma results stay distinct", async () => {
  const lemmaItems = occurrences(1, "lemma");
  const rootItems = occurrences(2, "root");
  const registry = await activeRegistry({ lemmaItems, rootItems });
  const lemma = await registry.getOccurrencesByLemma("fixture:occurrences", "lemma:fixture");
  const root = await registry.getOccurrencesByRoot("fixture:occurrences", "root:fixture");
  assert.equal(lemma.status, "ok");
  assert.equal(root.status, "ok");
  assert.equal(lemma.total, 1);
  assert.equal(root.total, 2);
  assert.equal("rootId" in lemma.items[0], false);
  assert.equal("lemmaId" in root.items[0], false);
});

test("occurrence UI distinguishes status, renders 50 at a time, and displays the audited total", async () => {
  const lens = await readFile(new URL("../app/ayah-context-lens.tsx", import.meta.url), "utf8");
  assert.match(lens, /See lemma occurrences/);
  assert.match(lens, /See root occurrences/);
  assert.match(lens, /status === "ok"/);
  assert.match(lens, /Showing \$\{visible\.length\} of \$\{explorer\.total\}/);
  assert.match(lens, /slice\(0, limit\)/);
  assert.match(lens, /setLimit\(\(value\) => value \+ 50\)/);
  assert.match(lens, /Audited occurrence count unavailable/);
});

test("opening an occurrence preserves the full coordinate for authoritative page remapping", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const openStart = page.indexOf("async function openWordOccurrence");
  const openEnd = page.indexOf("async function startSurahPlayback", openStart);
  const source = page.slice(openStart, openEnd);
  assert.match(source, /target\.page !== occurrence\.coordinate\.page/);
  assert.match(source, /pendingWordRef\.current = occurrence\.coordinate/);
  assert.match(page, /pageWordForCoordinate\(data, coordinate\)/);
  assert.doesNotMatch(page, /pageWordForCoordinate\(data, \{ \.\.\.coordinate, sourceWordId: undefined \}\)/);
});
