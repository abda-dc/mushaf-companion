import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  EducationProviderRegistry,
  createProductionEducationRegistry,
  serializeEducationCatalogSnapshot,
  validateEducationCatalog,
} from "../app/education-content.ts";

const CHECKSUM = "a".repeat(64);

function metadata(overrides = {}) {
  const base = {
    schemaVersion: 1,
    sourceId: "fixture:education-source",
    provider: { id: "fixture:education-provider", name: "Fixture provider", origin: "https://fixture.example", sourceUrl: "https://fixture.example/catalog", sourceTitle: "Fixture catalog", author: "Fixture Author", responsibleOrganization: "Fixture Organization" },
    scholarlyReview: { status: "approved", approvalReference: "fixture-approval-1", reviewedAt: "2026-08-12T00:00:00.000Z", reviewers: [{ name: "Fixture Reviewer", role: "Fixture review role", organization: "Fixture Review Organization" }], scopeStatement: "Synthetic architecture fixture only." },
    revision: "fixture-r1",
    language: "en",
    audience: "Synthetic test audience",
    enabled: true,
    rights: { applicationUse: "permitted", redistribution: "prohibited", bundling: "prohibited", offlineUse: "prohibited", modification: "prohibited", policyReference: "fixture-rights-1", license: "Fixture test license", attribution: "Fixture attribution" },
    capabilities: { requiresBundling: false, supportsRemoteQuery: true, storesOffline: false, requiresModification: false },
    integrity: { algorithm: "SHA-256", checksum: CHECKSUM, normalizationVersion: "education-catalog-json-v1" },
    coverage: { courseCount: 1, moduleCount: 1, lessonCount: 1, checkpointCount: 1, citationCount: 1 },
  };
  return {
    ...base,
    ...overrides,
    provider: { ...base.provider, ...(overrides.provider ?? {}) },
    scholarlyReview: { ...base.scholarlyReview, ...(overrides.scholarlyReview ?? {}) },
    rights: { ...base.rights, ...(overrides.rights ?? {}) },
    capabilities: { ...base.capabilities, ...(overrides.capabilities ?? {}) },
    integrity: { ...base.integrity, ...(overrides.integrity ?? {}) },
    coverage: { ...base.coverage, ...(overrides.coverage ?? {}) },
  };
}

function approval(meta, overrides = {}) {
  const base = {
    providerId: meta.provider.id,
    sourceId: meta.sourceId,
    revision: meta.revision,
    providerOrigin: meta.provider.origin,
    sourceUrl: meta.provider.sourceUrl,
    sourceTitle: meta.provider.sourceTitle,
    author: meta.provider.author,
    responsibleOrganization: meta.provider.responsibleOrganization,
    language: meta.language,
    audience: meta.audience,
    approvalReference: meta.scholarlyReview.approvalReference,
    reviewedAt: meta.scholarlyReview.reviewedAt,
    reviewers: structuredClone(meta.scholarlyReview.reviewers),
    reviewScopeStatement: meta.scholarlyReview.scopeStatement,
    integrityAlgorithm: "SHA-256",
    expectedChecksum: meta.integrity.checksum,
    normalizationVersion: meta.integrity.normalizationVersion,
    rights: { ...meta.rights },
    capabilities: { ...meta.capabilities },
  };
  return { ...base, ...overrides, rights: { ...base.rights, ...(overrides.rights ?? {}) }, capabilities: { ...base.capabilities, ...(overrides.capabilities ?? {}) } };
}

function catalog(meta, overrides = {}) {
  const base = {
    schemaVersion: 1,
    sourceId: meta.sourceId,
    sourceRevision: meta.revision,
    courses: [{ id: "course:fixture", title: "Fixture course", summary: "Synthetic architecture fixture.", moduleIds: ["module:fixture"] }],
    modules: [{ id: "module:fixture", courseId: "course:fixture", title: "Fixture module", summary: "Synthetic module fixture.", lessonIds: ["lesson:fixture"] }],
    lessons: [{ id: "lesson:fixture", moduleId: "module:fixture", courseId: "course:fixture", title: "Fixture lesson", summary: "Synthetic lesson fixture.", objectives: ["Exercise the structured contract."], estimatedMinutes: 5, blocks: [{ id: "block:fixture", type: "paragraph", text: "Fixture plain-text block.", citationIds: ["citation:fixture"] }], knowledgeChecks: [{ id: "check:fixture", prompt: "Fixture prompt?", answer: "Fixture answer.", citationIds: [] }] }],
    citations: [{ id: "citation:fixture", type: "quran", verseKey: "2:255", label: "Fixture Quran reference", locator: "2:255", sourceUrl: "https://fixture.example/catalog#2-255" }],
  };
  return { ...base, ...overrides };
}

function audit(meta, approved = approval(meta), overrides = {}) {
  const base = {
    valid: true,
    auditedAt: "2026-08-12T01:00:00.000Z",
    identity: { providerId: approved.providerId, sourceId: approved.sourceId, revision: approved.revision, providerOrigin: approved.providerOrigin, sourceUrl: approved.sourceUrl, sourceTitle: approved.sourceTitle, author: approved.author, responsibleOrganization: approved.responsibleOrganization, language: approved.language, audience: approved.audience, approvalReference: approved.approvalReference, reviewedAt: approved.reviewedAt, reviewers: structuredClone(approved.reviewers), reviewScopeStatement: approved.reviewScopeStatement, integrity: { algorithm: "SHA-256", checksum: approved.expectedChecksum, normalizationVersion: approved.normalizationVersion, status: "verified" } },
    content: { status: "verified", ...meta.coverage },
    issues: [],
  };
  return { ...base, ...overrides, identity: { ...base.identity, ...(overrides.identity ?? {}), integrity: { ...base.identity.integrity, ...(overrides.identity?.integrity ?? {}) } }, content: { ...base.content, ...(overrides.content ?? {}) } };
}

function provider(meta, approved = approval(meta), catalogValue = catalog(meta), overrides = {}) {
  return { metadata: overrides.metadata ?? (() => meta), audit: overrides.audit ?? (async () => audit(meta, approved)), loadCatalog: overrides.loadCatalog ?? (async () => catalogValue) };
}

function registry(meta, approved = approval(meta), resolveVerse = async (verseKey) => ({ verseKey, page: 42 }), overrides = {}) {
  return new EducationProviderRegistry({
    approvedProviders: { [approved.providerId]: approved },
    verifyIntegrity: overrides.verifyIntegrity ?? (async () => ({ status: "verified", algorithm: approved.integrityAlgorithm, checksum: approved.expectedChecksum, normalizationVersion: approved.normalizationVersion })),
    resolveVerse,
  });
}

test("an exact independently pinned, rights-compatible, scholarly-reviewed provider activates", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const subject = registry(meta, approved);
  subject.register(provider(meta, approved));
  const result = await subject.loadCatalog(meta.provider.id);
  assert.equal(result.status, "ready");
  assert.equal(result.catalog.lessons[0].blocks[0].text, "Fixture plain-text block.");
  assert.equal(result.audit.identity.reviewers[0].name, "Fixture Reviewer");
});

test("activation requires independent checksum verification and exact named scholarly review pins", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const noVerifier = new EducationProviderRegistry({ approvedProviders: { [approved.providerId]: approved }, resolveVerse: async (verseKey) => ({ verseKey, page: 1 }) });
  noVerifier.register(provider(meta, approved));
  assert.match((await noVerifier.activate(meta.provider.id)).reason, /independent.*required/i);

  const changedReviewer = metadata({ scholarlyReview: { reviewers: [{ name: "Different Reviewer", role: "Fixture review role", organization: null }] } });
  const reviewerRegistry = registry(changedReviewer, approved);
  reviewerRegistry.register(provider(changedReviewer, approved));
  assert.match((await reviewerRegistry.activate(changedReviewer.provider.id)).reason, /scholarly review.*pin/i);

  const changedAuthor = metadata({ provider: { author: "Different author" } });
  const authorRegistry = registry(changedAuthor, approved);
  authorRegistry.register(provider(changedAuthor, approved));
  assert.match((await authorRegistry.activate(changedAuthor.provider.id)).reason, /author.*organization.*pin/i);

  const changedLicense = metadata({ rights: { license: "Different license" } });
  const licenseRegistry = registry(changedLicense, approved);
  licenseRegistry.register(provider(changedLicense, approved));
  assert.match((await licenseRegistry.activate(changedLicense.provider.id)).reason, /license.*pin/i);
});

test("activation verifies and caches an isolated canonical snapshot of the exact loaded catalog", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const loaded = catalog(meta);
  let loadCount = 0;
  let verifiedValue;
  const subject = registry(meta, approved, undefined, {
    verifyIntegrity: async (input) => {
      verifiedValue = input;
      return { status: "verified", algorithm: approved.integrityAlgorithm, checksum: approved.expectedChecksum, normalizationVersion: approved.normalizationVersion };
    },
  });
  subject.register(provider(meta, approved, loaded, { loadCatalog: async () => { loadCount += 1; return loaded; } }));
  assert.equal((await subject.loadCatalog(meta.provider.id)).status, "ready");
  assert.equal((await subject.loadCatalog(meta.provider.id)).status, "ready");
  assert.notEqual(verifiedValue.catalog, loaded);
  assert.equal(verifiedValue.serialized, serializeEducationCatalogSnapshot(verifiedValue.catalog));
  assert.equal(Object.isFrozen(verifiedValue.catalog.lessons[0].blocks[0]), true);
  assert.equal(loadCount, 1);
});

test("provider, audit, and consumer mutations cannot alter the canonical verified catalog snapshot", async () => {
  const provisional = metadata();
  const loaded = catalog(provisional);
  const checksum = createHash("sha256").update(serializeEducationCatalogSnapshot(loaded)).digest("hex");
  const meta = metadata({ integrity: { checksum } });
  const approved = approval(meta);
  const expectedText = loaded.lessons[0].blocks[0].text;
  const expectedSerialized = serializeEducationCatalogSnapshot(loaded);
  let verifiedSerialized = "";
  const subject = registry(meta, approved, undefined, {
    verifyIntegrity: async (input) => {
      verifiedSerialized = input.serialized;
      assert.equal(createHash("sha256").update(input.serialized).digest("hex"), approved.expectedChecksum);
      loaded.lessons[0].blocks[0].text = "Provider mutation after canonical verification.";
      return { status: "verified", algorithm: "SHA-256", checksum: checksum, normalizationVersion: input.normalizationVersion };
    },
  });
  subject.register(provider(meta, approved, loaded, {
    audit: async () => {
      loaded.lessons[0].blocks[0].text = "Mutation attempted during audit.";
      return audit(meta, approved);
    },
  }));
  const first = await subject.loadCatalog(meta.provider.id);
  assert.equal(first.status, "ready");
  assert.equal(first.catalog.lessons[0].blocks[0].text, expectedText);
  assert.equal(verifiedSerialized, expectedSerialized);
  assert.throws(() => { first.catalog.lessons[0].blocks[0].text = "Consumer mutation."; }, TypeError);
  assert.throws(() => { first.catalog.citations.push({}); }, TypeError);
  const second = await subject.loadCatalog(meta.provider.id);
  assert.equal(second.status, "ready");
  assert.equal(second.catalog.lessons[0].blocks[0].text, expectedText);
  assert.equal(serializeEducationCatalogSnapshot(second.catalog), expectedSerialized);
});

test("unknown or incompatible delivery rights fail closed", async () => {
  for (const [meta, expected] of [
    [metadata({ rights: { applicationUse: "unknown" } }), /application use/i],
    [metadata({ capabilities: { requiresBundling: true, supportsRemoteQuery: false }, rights: { applicationUse: "permitted", redistribution: "permitted", bundling: "unknown" } }), /bundling/i],
    [metadata({ capabilities: { storesOffline: true }, rights: { offlineUse: "prohibited" } }), /offline/i],
  ]) {
    const approved = approval(meta);
    const subject = registry(meta, approved);
    subject.register(provider(meta, approved));
    assert.notEqual((await subject.activate(meta.provider.id)).status, "active");
    assert.match((await subject.activate(meta.provider.id)).reason, expected);
  }
});

test("catalog validation accepts structured plain text and rejects arbitrary HTML or unknown fields", () => {
  const meta = metadata();
  assert.equal(validateEducationCatalog(catalog(meta), meta).valid, true);
  const html = catalog(meta);
  html.lessons[0].blocks[0].text = "<p>Provider HTML</p>";
  assert.match(validateEducationCatalog(html, meta).issues.join("; "), /plain text|invalid/i);
  const unexpected = catalog(meta);
  unexpected.lessons[0].blocks[0].html = "<p>hidden</p>";
  assert.match(validateEducationCatalog(unexpected, meta).issues.join("; "), /not allowed/i);

  const duplicateCheckMeta = metadata({ coverage: { checkpointCount: 2 } });
  const duplicateCheck = catalog(duplicateCheckMeta);
  duplicateCheck.lessons[0].knowledgeChecks.push({ ...duplicateCheck.lessons[0].knowledgeChecks[0] });
  assert.match(validateEducationCatalog(duplicateCheck, duplicateCheckMeta).issues.join("; "), /duplicated/i);

  const orphanMeta = metadata({ coverage: { moduleCount: 2 } });
  const orphan = catalog(orphanMeta);
  orphan.modules.push({ id: "module:orphan", courseId: "course:fixture", title: "Orphan fixture", summary: "Synthetic orphan fixture.", lessonIds: [] });
  assert.match(validateEducationCatalog(orphan, orphanMeta).issues.join("; "), /exactly one course sequence/i);
});

test("Quran citations must reconcile through the trusted existing verse boundary", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const mismatch = registry(meta, approved, async () => ({ verseKey: "2:256", page: 42 }));
  mismatch.register(provider(meta, approved));
  assert.match((await mismatch.loadCatalog(meta.provider.id)).reason, /trusted verse lookup/i);
  const throwing = registry(meta, approved, async () => { throw new Error("raw resolver failure"); });
  throwing.register(provider(meta, approved));
  assert.match((await throwing.loadCatalog(meta.provider.id)).reason, /trusted verse lookup/i);
});

test("source/revision, audit, malformed metadata, and catalog parent mappings fail closed", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const revision = metadata({ revision: "fixture-r2" });
  const revisionRegistry = registry(revision, approved);
  revisionRegistry.register(provider(revision, approved));
  assert.match((await revisionRegistry.activate(revision.provider.id)).reason, /revision/i);

  const badAudit = registry(meta, approved);
  badAudit.register(provider(meta, approved, catalog(meta), { audit: async () => audit(meta, approved, { valid: "true" }) }));
  assert.match((await badAudit.activate(meta.provider.id)).reason, /boolean true/i);

  const badMapping = catalog(meta);
  badMapping.modules[0].lessonIds = ["lesson:missing"];
  assert.match(validateEducationCatalog(badMapping, meta).issues.join("; "), /sequence/i);
});

test("audit chronology, coverage, reviewers, capabilities, rights policy, duplicates, and hierarchy fail closed", async () => {
  const meta = metadata();
  const approved = approval(meta);
  for (const [auditOverride, expected] of [
    [{ auditedAt: "2026-08-11T23:59:59.000Z" }, /predates/i],
    [{ content: { lessonCount: 2 } }, /lessonCount/i],
    [{ identity: { reviewers: [{ name: "Other Reviewer", role: "Fixture review role", organization: "Fixture Review Organization" }] } }, /reviewer/i],
  ]) {
    const subject = registry(meta, approved);
    subject.register(provider(meta, approved, catalog(meta), { audit: async () => audit(meta, approved, auditOverride) }));
    assert.match((await subject.activate(meta.provider.id)).reason, expected);
  }

  const changedCapability = metadata({ capabilities: { storesOffline: true }, rights: { offlineUse: "permitted" } });
  const capabilityRegistry = registry(changedCapability, approved);
  capabilityRegistry.register(provider(changedCapability, approved));
  assert.match((await capabilityRegistry.activate(changedCapability.provider.id)).reason, /capabilities.*pin/i);

  const changedPolicy = metadata({ rights: { policyReference: "changed-policy" } });
  const policyRegistry = registry(changedPolicy, approved);
  policyRegistry.register(provider(changedPolicy, approved));
  assert.match((await policyRegistry.activate(changedPolicy.provider.id)).reason, /policyReference.*pin/i);

  const duplicateModule = catalog(meta);
  duplicateModule.courses[0].moduleIds.push("module:fixture");
  assert.match(validateEducationCatalog(duplicateModule, meta).issues.join("; "), /duplicated/i);

  const secondCourseMeta = metadata({ coverage: { courseCount: 2 } });
  const multipleParents = catalog(secondCourseMeta);
  multipleParents.courses.push({ id: "course:second", title: "Second fixture", summary: "Synthetic second fixture.", moduleIds: ["module:fixture"] });
  assert.match(validateEducationCatalog(multipleParents, secondCourseMeta).issues.join("; "), /exactly one course sequence|inconsistent/i);

  const duplicateLessonMeta = metadata({ coverage: { lessonCount: 2, checkpointCount: 2 } });
  const duplicateLesson = catalog(duplicateLessonMeta);
  duplicateLesson.lessons.push(structuredClone(duplicateLesson.lessons[0]));
  assert.match(validateEducationCatalog(duplicateLesson, duplicateLessonMeta).issues.join("; "), /duplicated/i);
});

test("production contains only a disabled empty reference provider", async () => {
  const subject = createProductionEducationRegistry(async () => { throw new Error("disabled provider must not resolve verses"); });
  assert.equal(subject.listProviderIds().length, 1);
  const result = await subject.loadFirstApprovedCatalog();
  assert.equal(result.status, "disabled");
  assert.match(result.reason, /approved curriculum/i);
});
