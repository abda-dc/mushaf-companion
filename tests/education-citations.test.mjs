import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EDUCATION_CITATION_LABELS,
  EducationProviderRegistry,
  serializeEducationCatalogSnapshot,
  validateEducationCatalog,
} from "../app/education-content.ts";
import { describeEducationCitation } from "../app/education-citation-presentation.mjs";

function metadata(citationCount = 1, coverage = {}) {
  return {
    schemaVersion: 1,
    sourceId: "fixture:citation-provenance",
    provider: { id: "fixture:citation-provider", name: "Citation fixture", origin: "https://fixture.example", sourceUrl: "https://fixture.example/catalog", sourceTitle: "Citation fixture catalog", author: "Fixture Author", responsibleOrganization: "Fixture Organization" },
    scholarlyReview: { status: "approved", approvalReference: "fixture-approval", reviewedAt: "2026-08-12T00:00:00.000Z", reviewers: [{ name: "Fixture Reviewer", role: "Fixture role", organization: null }], scopeStatement: "Synthetic citation contract fixture." },
    revision: "fixture-r2",
    language: "en",
    audience: "Synthetic test audience",
    enabled: true,
    rights: { applicationUse: "permitted", redistribution: "prohibited", bundling: "prohibited", offlineUse: "prohibited", modification: "prohibited", policyReference: "fixture-rights", license: "Fixture license", attribution: "Fixture attribution" },
    capabilities: { requiresBundling: false, supportsRemoteQuery: true, storesOffline: false, requiresModification: false },
    integrity: { algorithm: "SHA-256", checksum: "a".repeat(64), normalizationVersion: "education-catalog-json-v2" },
    coverage: { courseCount: 0, moduleCount: 0, lessonCount: 0, checkpointCount: 0, citationCount, ...coverage },
  };
}

function catalog(citations, schemaVersion = 2) {
  return { schemaVersion, sourceId: "fixture:citation-provenance", sourceRevision: "fixture-r2", courses: [], modules: [], lessons: [], citations };
}

function catalogWithLesson(citationRecords, blockCitationIds, checkCitationIds) {
  return {
    schemaVersion: 2,
    sourceId: "fixture:citation-provenance",
    sourceRevision: "fixture-r2",
    courses: [{ id: "course:fixture", title: "Synthetic course", summary: "Synthetic test-only course.", moduleIds: ["module:fixture"] }],
    modules: [{ id: "module:fixture", courseId: "course:fixture", title: "Synthetic module", summary: "Synthetic test-only module.", lessonIds: ["lesson:fixture"] }],
    lessons: [{ id: "lesson:fixture", moduleId: "module:fixture", courseId: "course:fixture", title: "Synthetic lesson", summary: "Synthetic test-only lesson.", objectives: ["Exercise the provenance contract."], estimatedMinutes: 1, blocks: [{ id: "block:fixture", type: "paragraph", text: "Synthetic test-only block.", citationIds: blockCitationIds }], knowledgeChecks: [{ id: "check:fixture", prompt: "Synthetic prompt?", answer: "Synthetic answer.", citationIds: checkCitationIds }] }],
    citations: citationRecords,
  };
}

const citations = {
  quran: { id: "citation:quran", type: "quran", verseKey: "2:255", label: "Synthetic Quran fixture", locator: "2:255", sourceUrl: "https://fixture.example/quran/2/255" },
  hadith: { id: "citation:hadith", type: "hadith", workId: "work:hadith-fixture", workTitle: "Synthetic hadith work", edition: "Fixture edition", locator: "Fixture locator 1", sourceUrl: "https://fixture.example/hadith/1", grading: { grade: "Fixture grade", grader: "Fixture grading authority", reference: "Fixture grading reference" } },
  scholarly: { id: "citation:scholarly", type: "scholarly", author: "Fixture Scholar", workTitle: "Synthetic scholarly work", edition: "Fixture edition", locator: "Fixture page 1", sourceUrl: "https://fixture.example/scholarly/1" },
  curriculum: { id: "citation:curriculum", type: "curriculum", workId: "work:curriculum-fixture", title: "Synthetic curriculum source", author: "Fixture Author", responsibleOrganization: "Fixture Organization", revision: "fixture-r2", locator: "Fixture section 1", sourceUrl: "https://fixture.example/curriculum/1" },
  assessment: { id: "citation:assessment", type: "assessment", workId: "work:assessment-fixture", title: "Synthetic assessment source", revision: "fixture-r2", locator: "Fixture question 1", responsibleOrganization: "Fixture Organization", sourceUrl: null },
};

for (const [type, citation] of Object.entries(citations)) {
  test(`catalog schema v2 accepts a valid ${type} citation`, () => {
    const result = validateEducationCatalog(catalog([citation]), metadata());
    assert.equal(result.valid, true, result.issues.join("; "));
    assert.ok(result.catalog);
  });
}

test("hadith citations require work identity, exact locator, and complete optional grading provenance", () => {
  for (const mutation of [
    { workId: undefined },
    { locator: "" },
    { grading: { grade: "Fixture grade" } },
    { grading: { grader: "Fixture authority" } },
    { grading: { reference: "Fixture ref" } },
    { grading: { grade: "Fixture grade", grader: "Fixture authority" } },
    { grading: { grade: "Fixture grade", reference: "Fixture ref" } },
    { grading: { grader: "Fixture authority", reference: "Fixture ref" } },
    { grading: { grade: "Fixture grade", grader: "", reference: "Fixture ref" } },
  ]) {
    const candidate = { ...structuredClone(citations.hadith), ...mutation };
    assert.equal(validateEducationCatalog(catalog([candidate]), metadata()).valid, false);
  }
});

test("typed citations reject missing attribution, revision, malformed provenance, wrong fields, and unexpected keys", () => {
  const malformed = [
    { ...citations.scholarly, author: "" },
    { ...citations.curriculum, revision: "" },
    { ...citations.assessment, responsibleOrganization: "" },
    { ...citations.assessment, sourceUrl: "http://fixture.example/assessment" },
    { ...citations.hadith, title: "wrong field", workTitle: undefined },
    { ...citations.curriculum, extra: "not allowed" },
  ];
  for (const candidate of malformed) assert.equal(validateEducationCatalog(catalog([candidate]), metadata()).valid, false);
});

test("catalog versions are explicit and legacy source citations are not silently reinterpreted", () => {
  const legacyMeta = metadata();
  legacyMeta.revision = "fixture-r1";
  legacyMeta.integrity.normalizationVersion = "education-catalog-json-v1";
  const legacy = { id: "citation:legacy", type: "source", workId: "work:legacy", title: "Legacy source fixture", edition: "Fixture edition", locator: "Fixture locator", sourceUrl: "https://fixture.example/legacy" };
  assert.equal(validateEducationCatalog({ ...catalog([legacy], 1), sourceRevision: "fixture-r1" }, legacyMeta).valid, true);
  assert.match(validateEducationCatalog(catalog([legacy]), metadata()).issues.join("; "), /source.*schema 1/i);
  for (const citation of [citations.hadith, citations.scholarly, citations.curriculum, citations.assessment]) {
    assert.match(validateEducationCatalog({ ...catalog([citation], 1), sourceRevision: "fixture-r1" }, legacyMeta).issues.join("; "), /requires education catalog schema 2/i);
  }
  const v2WithV1Normalization = { ...metadata(), integrity: { ...metadata().integrity, normalizationVersion: "education-catalog-json-v1" } };
  assert.match(validateEducationCatalog(catalog([citations.quran]), v2WithV1Normalization).issues.join("; "), /requires normalization.*v2/i);
  const v1WithV2Normalization = metadata();
  assert.match(validateEducationCatalog(catalog([citations.quran], 1), v1WithV2Normalization).issues.join("; "), /requires normalization.*v1/i);
});

test("canonical serialization is deterministic and every citation type changes integrity when material provenance changes", () => {
  const first = catalog(Object.values(citations));
  const digest = (value) => createHash("sha256").update(serializeEducationCatalogSnapshot(value)).digest("hex");
  assert.equal(serializeEducationCatalogSnapshot(first), serializeEducationCatalogSnapshot(structuredClone(first)));
  const mutations = [
    (value) => { value.citations[0].verseKey = "2:256"; },
    (value) => { value.citations[1].grading.reference = "Different grading reference"; },
    (value) => { value.citations[2].author = "Different Fixture Scholar"; },
    (value) => { value.citations[3].revision = "fixture-r3"; },
    (value) => { value.citations[4].responsibleOrganization = "Different Fixture Organization"; },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(first);
    mutate(changed);
    assert.notEqual(digest(first), digest(changed));
  }
});

test("duplicate and dangling citation identities fail closed", () => {
  const coverage = { courseCount: 1, moduleCount: 1, lessonCount: 1, checkpointCount: 1 };
  const duplicate = catalogWithLesson([citations.quran, { ...citations.scholarly, id: citations.quran.id }], [citations.quran.id], []);
  assert.match(validateEducationCatalog(duplicate, metadata(2, coverage)).issues.join("; "), /duplicated/i);
  const danglingBlock = catalogWithLesson([citations.quran], ["citation:missing"], []);
  assert.match(validateEducationCatalog(danglingBlock, metadata(1, coverage)).issues.join("; "), /blocks.*unknown citation/i);
  const danglingCheck = catalogWithLesson([citations.quran], [], ["citation:missing"]);
  assert.match(validateEducationCatalog(danglingCheck, metadata(1, coverage)).issues.join("; "), /knowledgeChecks.*unknown citation/i);
});

test("a knowledge check can carry assessment provenance and separate support without granting assessment authority", () => {
  const catalogValue = catalogWithLesson([citations.assessment, citations.quran], [], [citations.assessment.id, citations.quran.id]);
  const result = validateEducationCatalog(catalogValue, metadata(2, { courseCount: 1, moduleCount: 1, lessonCount: 1, checkpointCount: 1 }));
  assert.equal(result.valid, true, result.issues.join("; "));
  assert.equal(describeEducationCitation(citations.assessment).role, "assessment-provenance-only");
  assert.equal(describeEducationCitation(citations.quran).role, "source-reference");
});

test("only Quran citations cross the trusted verse resolver", async () => {
  const allCitations = Object.values(citations);
  const meta = metadata(allCitations.length);
  const approval = {
    providerId: meta.provider.id, sourceId: meta.sourceId, revision: meta.revision, providerOrigin: meta.provider.origin, sourceUrl: meta.provider.sourceUrl,
    sourceTitle: meta.provider.sourceTitle, author: meta.provider.author, responsibleOrganization: meta.provider.responsibleOrganization, language: meta.language, audience: meta.audience,
    approvalReference: meta.scholarlyReview.approvalReference, reviewedAt: meta.scholarlyReview.reviewedAt, reviewers: meta.scholarlyReview.reviewers, reviewScopeStatement: meta.scholarlyReview.scopeStatement,
    integrityAlgorithm: "SHA-256", expectedChecksum: meta.integrity.checksum, normalizationVersion: meta.integrity.normalizationVersion, rights: meta.rights, capabilities: meta.capabilities,
  };
  const audit = { valid: true, auditedAt: "2026-08-12T01:00:00.000Z", identity: { providerId: approval.providerId, sourceId: approval.sourceId, revision: approval.revision, providerOrigin: approval.providerOrigin, sourceUrl: approval.sourceUrl, sourceTitle: approval.sourceTitle, author: approval.author, responsibleOrganization: approval.responsibleOrganization, language: approval.language, audience: approval.audience, approvalReference: approval.approvalReference, reviewedAt: approval.reviewedAt, reviewers: approval.reviewers, reviewScopeStatement: approval.reviewScopeStatement, integrity: { algorithm: "SHA-256", checksum: approval.expectedChecksum, normalizationVersion: approval.normalizationVersion, status: "verified" } }, content: { status: "verified", ...meta.coverage }, issues: [] };
  const resolved = [];
  const registry = new EducationProviderRegistry({ approvedProviders: { [meta.provider.id]: approval }, verifyIntegrity: async () => ({ status: "verified", algorithm: "SHA-256", checksum: approval.expectedChecksum, normalizationVersion: approval.normalizationVersion }), resolveVerse: async (verseKey) => { resolved.push(verseKey); return { verseKey, page: 42 }; } });
  registry.register({ metadata: () => meta, audit: async () => audit, loadCatalog: async () => catalog(allCitations) });
  assert.equal((await registry.loadCatalog(meta.provider.id)).status, "ready");
  assert.deepEqual(resolved, ["2:255"]);
});

test("Learn citation presentation executes semantic, accessible, navigation, and link-safe distinctions", async () => {
  const [learn, evidence] = await Promise.all([
    readFile(new URL("../app/learn-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/evidence-layer.ts", import.meta.url), "utf8"),
  ]);
  assert.deepEqual(EDUCATION_CITATION_LABELS, { quran: "QUR'AN", hadith: "HADITH", scholarly: "SCHOLARLY SOURCE", curriculum: "CURRICULUM SOURCE", assessment: "ASSESSMENT SOURCE", source: "LEGACY SOURCE" });
  for (const [type, citation] of Object.entries(citations)) {
    const presentation = describeEducationCitation(citation);
    assert.equal(presentation.category, EDUCATION_CITATION_LABELS[type]);
    assert.match(presentation.accessibleLabel, new RegExp(`^${presentation.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:`));
    if (type === "quran") {
      assert.equal(presentation.action, "trusted-quran-navigation");
      assert.equal(presentation.href, null);
    } else if (citation.sourceUrl) {
      assert.equal(presentation.action, "external-source");
      assert.equal(presentation.externalRel, "noopener noreferrer");
    } else assert.equal(presentation.action, "plain-source");
  }
  assert.match(learn, /describeEducationCitation/);
  assert.match(learn, /data-citation-role=\{presentation\.role\}/);
  assert.match(learn, /citation\.type === "quran"[\s\S]*onOpenQuranCitation/);
  assert.doesNotMatch(evidence, /EducationHadithCitation|EducationCurriculumCitation|ASSESSMENT SOURCE/);
});
