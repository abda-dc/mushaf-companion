import assert from "node:assert/strict";
import test from "node:test";

import {
  EvidenceProviderRegistry,
  LatestEvidenceRequestGate,
  canonicalEvidenceEdgeIdentity,
  combineEvidenceQueryResults,
  createProductionEvidenceRegistry,
} from "../app/evidence-layer.ts";

const RESOLVED = new Map([
  ["2:255", { verseKey: "2:255", page: 42 }],
  ["3:2", { verseKey: "3:2", page: 50 }],
  ["112:1", { verseKey: "112:1", page: 604 }],
]);

function metadata(providerId = "fixture:provider", revision = "r1", overrides = {}) {
  const origin = overrides.provider?.origin ?? "https://evidence.example";
  const base = {
    schemaVersion: 1,
    sourceId: `${providerId}:source`,
    provider: { id: providerId, name: "Fixture Provider", origin, sourceTitle: "Fixture Explicit References", authorOrCompiler: "Fixture Compiler", edition: "Test edition", publisher: "Fixture Publisher", language: "en", sourceUrl: `${origin}/catalog` },
    revision,
    enabled: true,
    approvalStatus: "approved",
    approvalReference: `approval:${providerId}:${revision}`,
    rights: { applicationUse: "permitted", redistribution: "unknown", modification: "unknown", offlineUse: "unknown", bundling: "unknown", policyReference: `rights:${providerId}`, license: "Test fixture only", attribution: "Synthetic fixture; never production content." },
    capabilities: { requiresBundling: false, supportsRemoteQuery: true, storesOffline: false, requiresModification: false },
    integrity: { algorithm: "SHA-256", checksum: "a".repeat(64), normalizationVersion: "evidence-edge-json-v1" },
    methodology: { kind: "explicit-source", description: "Fixture records model explicitly cited links." },
    coverage: { edgeCount: 1, sourceVerseCount: 1 },
  };
  return {
    ...base,
    ...overrides,
    provider: { ...base.provider, ...(overrides.provider ?? {}) },
    rights: { ...base.rights, ...(overrides.rights ?? {}) },
    capabilities: { ...base.capabilities, ...(overrides.capabilities ?? {}) },
    integrity: { ...base.integrity, ...(overrides.integrity ?? {}) },
    methodology: { ...base.methodology, ...(overrides.methodology ?? {}) },
    coverage: { ...base.coverage, ...(overrides.coverage ?? {}) },
  };
}

function approval(meta, overrides = {}) {
  const base = {
    providerId: meta.provider.id,
    sourceId: meta.sourceId,
    revision: meta.revision,
    providerOrigin: meta.provider.origin,
    approvalReference: meta.approvalReference,
    integrityAlgorithm: meta.integrity.algorithm,
    expectedChecksum: meta.integrity.checksum,
    normalizationVersion: meta.integrity.normalizationVersion,
    rights: {
      applicationUse: meta.rights.applicationUse,
      redistribution: meta.rights.redistribution,
      modification: meta.rights.modification,
      offlineUse: meta.rights.offlineUse,
      bundling: meta.rights.bundling,
      policyReference: meta.rights.policyReference,
    },
    capabilities: { ...meta.capabilities },
  };
  return { ...base, ...overrides, rights: { ...base.rights, ...(overrides.rights ?? {}) }, capabilities: { ...base.capabilities, ...(overrides.capabilities ?? {}) } };
}

function edge(meta, overrides = {}) {
  return {
    schemaVersion: 1,
    id: `${meta.provider.id}:edge-1`,
    from: { type: "ayah", verseKey: "2:255" },
    to: { type: "ayah", verseKey: "3:2" },
    relationshipType: "cross_reference",
    label: "The fixture source explicitly connects these passages.",
    derivation: "explicit-source",
    providerSourceId: meta.sourceId,
    revision: meta.revision,
    citation: { resourceId: "fixture-resource", locator: "Section 2:255", sourceUrl: `${meta.provider.origin}/catalog#2-255` },
    ...overrides,
  };
}

function audit(meta, approved = approval(meta), overrides = {}) {
  const base = {
    valid: true,
    auditedAt: "2026-08-11T00:00:00.000Z",
    identity: {
      providerId: approved.providerId,
      sourceId: approved.sourceId,
      revision: approved.revision,
      providerOrigin: approved.providerOrigin,
      approvalReference: approved.approvalReference,
      integrity: { algorithm: approved.integrityAlgorithm, checksum: approved.expectedChecksum, normalizationVersion: approved.normalizationVersion, status: "verified" },
    },
    contentMapping: { status: "verified", edgeCount: meta.coverage.edgeCount, sourceVerseCount: meta.coverage.sourceVerseCount },
    issues: [],
  };
  return {
    ...base,
    ...overrides,
    identity: { ...base.identity, ...(overrides.identity ?? {}), integrity: { ...base.identity.integrity, ...(overrides.identity?.integrity ?? {}) } },
    contentMapping: { ...base.contentMapping, ...(overrides.contentMapping ?? {}) },
  };
}

function provider(meta, result = { status: "ok", items: [edge(meta)], total: 1 }, options = {}) {
  return {
    metadata: options.metadata ?? (() => meta),
    audit: options.audit ?? (async () => audit(meta, options.approved ?? approval(meta))),
    query: options.query ?? (async () => result),
  };
}

function registry(approvals, options = {}) {
  const approvedProviders = Object.fromEntries(approvals.map((item) => [item.providerId, item]));
  return new EvidenceProviderRegistry({
    approvedProviders,
    verifyIntegrity: options.verifyIntegrity ?? (async (_provider, approved) => ({ status: "verified", algorithm: approved.integrityAlgorithm, checksum: approved.expectedChecksum, normalizationVersion: approved.normalizationVersion })),
    resolveVerse: options.resolveVerse ?? (async (verseKey) => RESOLVED.get(verseKey) ?? null),
  });
}

test("exact independently pinned identity activates and reconciles both Quran pages", async () => {
  const meta = metadata();
  const approved = approval(meta);
  let audits = 0;
  const subject = registry([approved]);
  subject.register(provider(meta, undefined, { approved, audit: async () => { audits += 1; return audit(meta, approved); } }));
  const result = await subject.query(meta.provider.id, "2:255", 42);
  assert.equal(result.status, "ok");
  assert.equal(result.coverageComplete, true);
  assert.equal(result.items[0].sourcePage, 42);
  assert.equal(result.items[0].targetPage, 50);
  assert.equal(result.items[0].sourceApproval.expectedChecksum, approved.expectedChecksum);
  await subject.query(meta.provider.id, "2:255", 42);
  assert.equal(audits, 1, "only a successful independently verified activation is cached");
});

test("provider identity, origin, approval reference, metadata checksum, and audit checksum are pinned independently", async () => {
  const trusted = metadata();
  const approved = approval(trusted);
  for (const [mutated, expected] of [
    [metadata(undefined, undefined, { integrity: { checksum: "b".repeat(64) } }), /pinned checksum/i],
    [metadata(undefined, undefined, { provider: { origin: "https://other.example", sourceUrl: "https://other.example/catalog" } }), /origin mismatch/i],
    [metadata(undefined, undefined, { approvalReference: "provider-changed-approval" }), /approval reference/i],
  ]) {
    const subject = registry([approved]);
    subject.register(provider(mutated, { status: "ok", items: [], total: 0 }, { approved }));
    assert.match((await subject.activate(mutated.provider.id)).reason, expected);
  }
  const auditMismatch = registry([approved]);
  auditMismatch.register(provider(trusted, undefined, { approved, audit: async () => audit(trusted, approved, { identity: { integrity: { checksum: "c".repeat(64) } } }) }));
  assert.match((await auditMismatch.activate(trusted.provider.id)).reason, /audit checksum.*pinned/i);
});

test("audit validity must be the boolean true", async () => {
  for (const value of ["true", 1, {}]) {
    const meta = metadata();
    const approved = approval(meta);
    const subject = registry([approved]);
    subject.register(provider(meta, undefined, { approved, audit: async () => audit(meta, approved, { valid: value }) }));
    const activation = await subject.activate(meta.provider.id);
    assert.equal(activation.status, "unavailable");
    assert.match(activation.reason, /boolean true/i);
  }
});

test("provider delivery capabilities require only their applicable pinned rights", async () => {
  for (const [meta, expected] of [
    [metadata("fixture:bundle", "r1", { capabilities: { requiresBundling: true, supportsRemoteQuery: false }, rights: { redistribution: "permitted", bundling: "unknown" } }), /required bundling/i],
    [metadata("fixture:offline", "r1", { capabilities: { supportsRemoteQuery: false, storesOffline: true }, rights: { offlineUse: "prohibited" } }), /required offlineUse/i],
    [metadata("fixture:modify", "r1", { capabilities: { requiresModification: true }, rights: { modification: "prohibited" } }), /required modification/i],
  ]) {
    const subject = registry([approval(meta)]);
    subject.register(provider(meta));
    assert.match((await subject.activate(meta.provider.id)).reason, expected);
  }
  const remote = metadata("fixture:remote");
  const remoteRegistry = registry([approval(remote)]);
  remoteRegistry.register(provider(remote));
  assert.equal((await remoteRegistry.activate(remote.provider.id)).status, "active", "remote query does not require bundling permission");
});

test("metadata, integrity verification, audit, query, and malformed reasons fail closed", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const metadataThrow = registry([approved]);
  const invalidId = metadataThrow.register(provider(meta, undefined, { metadata: () => { throw new Error("raw metadata secret"); } }));
  assert.deepEqual(await metadataThrow.activate(invalidId), { status: "error", reason: "Evidence provider metadata could not be read." });
  const metadataGetter = registry([approved]);
  const getterId = metadataGetter.register(provider(meta, undefined, { metadata: () => ({ schemaVersion: 1, get provider() { throw new Error("getter escaped"); } }) }));
  assert.deepEqual(await metadataGetter.activate(getterId), { status: "error", reason: "Evidence provider metadata could not be normalized safely." });

  const verificationThrow = registry([approved], { verifyIntegrity: async () => { throw new Error("raw normalization secret"); } });
  verificationThrow.register(provider(meta));
  assert.deepEqual(await verificationThrow.activate(meta.provider.id), { status: "error", reason: "Independent evidence integrity verification failed." });
  const malformedVerification = registry([approved], { verifyIntegrity: async () => ({ checksum: {} }) });
  malformedVerification.register(provider(meta));
  assert.match((await malformedVerification.activate(meta.provider.id)).reason, /verification/i);

  const auditThrow = registry([approved]);
  auditThrow.register(provider(meta, undefined, { approved, audit: async () => { throw new Error("raw audit secret"); } }));
  assert.deepEqual(await auditThrow.activate(meta.provider.id), { status: "error", reason: "Evidence provider audit failed." });
  const malformedAudit = registry([approved]);
  malformedAudit.register(provider(meta, undefined, { approved, audit: async () => ({ valid: true, reason: {} }) }));
  assert.equal((await malformedAudit.activate(meta.provider.id)).status, "unavailable");
  const auditGetter = registry([approved]);
  auditGetter.register(provider(meta, undefined, { approved, audit: async () => ({ valid: true, auditedAt: "2026-08-11T00:00:00.000Z", get identity() { throw new Error("getter escaped"); } }) }));
  assert.deepEqual(await auditGetter.activate(meta.provider.id), { status: "error", reason: "Evidence provider audit could not be normalized safely." });

  const queryThrow = registry([approved]);
  queryThrow.register(provider(meta, undefined, { approved, query: async () => { throw new Error("raw query secret"); } }));
  assert.deepEqual(await queryThrow.query(meta.provider.id, "2:255", 42), { status: "error", reason: "Evidence provider query failed." });
  const malformedReason = registry([approved]);
  malformedReason.register(provider(meta, { status: "error", reason: {} }, { approved }));
  const result = await malformedReason.query(meta.provider.id, "2:255", 42);
  assert.equal(typeof result.reason, "string");
  assert.doesNotMatch(result.reason, /\[object Object\]/);
});

test("trusted source and target resolvers plus citation validation fail closed", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const sourceThrow = registry([approved], { resolveVerse: async () => { throw new Error("raw resolver secret"); } });
  sourceThrow.register(provider(meta));
  assert.match((await sourceThrow.query(meta.provider.id, "2:255", 42)).reason, /trusted page map/i);

  const targetThrow = registry([approved], { resolveVerse: async (verseKey) => { if (verseKey === "3:2") throw new Error("raw target secret"); return RESOLVED.get(verseKey); } });
  targetThrow.register(provider(meta));
  assert.match((await targetThrow.query(meta.provider.id, "2:255", 42)).reason, /target.*trusted Quran/i);

  const badCitation = registry([approved]);
  badCitation.register(provider(meta, { status: "ok", items: [edge(meta, { citation: { resourceId: "x", locator: "x", sourceUrl: "javascript:alert(1)" } })], total: 1 }));
  assert.match((await badCitation.query(meta.provider.id, "2:255", 42)).reason, /citation/i);
});

test("canonical identity rejects provider IDs as semantic uniqueness but preserves provenance and revisions", async () => {
  const meta = metadata();
  const approved = approval(meta);
  const duplicate = registry([approved]);
  duplicate.register(provider(meta, { status: "ok", items: [edge(meta, { id: "fixture:edge-a" }), edge(meta, { id: "fixture:edge-b" })], total: 2 }, { approved }));
  assert.match((await duplicate.query(meta.provider.id, "2:255", 42)).reason, /same semantic edge/i);

  const first = metadata("fixture:first", "r1", { provider: { origin: "https://first.example", sourceUrl: "https://first.example/catalog" }, integrity: { checksum: "d".repeat(64) } });
  const second = metadata("fixture:second", "r1", { provider: { origin: "https://second.example", sourceUrl: "https://second.example/catalog" }, integrity: { checksum: "e".repeat(64) } });
  const subject = registry([approval(first), approval(second)]);
  subject.register(provider(first));
  subject.register(provider(second));
  const combined = await subject.queryAll("2:255", 42);
  assert.equal(combined.status, "ok");
  assert.equal(combined.total, 2);
  assert.deepEqual(new Set(combined.items.map((item) => item.providerId)), new Set([first.provider.id, second.provider.id]));

  const nextRevision = { ...edge(meta), revision: "r2" };
  assert.notEqual(canonicalEvidenceEdgeIdentity(edge(meta), meta.provider.id), canonicalEvidenceEdgeIdentity(nextRevision, meta.provider.id), "a reviewed new revision has a distinct canonical identity");
});

test("settled multi-provider execution preserves successes and marks incomplete coverage", async () => {
  const success = metadata("fixture:success");
  const unavailable = metadata("fixture:unavailable", "r1", { integrity: { checksum: "b".repeat(64) } });
  const throwing = metadata("fixture:throwing", "r1", { integrity: { checksum: "c".repeat(64) } });
  const secondSuccess = metadata("fixture:second-success", "r1", { provider: { origin: "https://success2.example", sourceUrl: "https://success2.example/catalog" }, integrity: { checksum: "d".repeat(64) } });
  const subject = registry([approval(success), approval(unavailable), approval(throwing), approval(secondSuccess)]);
  subject.register(provider(success));
  subject.register(provider(unavailable, { status: "unavailable", reason: "fixture source offline" }));
  subject.register(provider(throwing, undefined, { query: async () => { throw new Error("fixture throw"); } }));
  subject.register(provider(secondSuccess));
  const partial = await subject.queryAll("2:255", 42);
  assert.equal(partial.status, "partial");
  assert.equal(partial.items.length, 2);
  assert.equal(partial.failures.length, 2);
  assert.equal(partial.coverageComplete, false);

  const zero = { status: "ok", items: [], total: 0, coverageComplete: true };
  const zeroPartial = combineEvidenceQueryResults([zero, { status: "error", reason: "second source failed" }], ["zero", "failed"]);
  assert.equal(zeroPartial.status, "partial");
  assert.equal(zeroPartial.total, 0);
  assert.equal(zeroPartial.coverageComplete, false);
  assert.deepEqual(combineEvidenceQueryResults([zero, zero]), { status: "ok", items: [], total: 0, coverageComplete: true });
});

test("all provider failures remain failures rather than authoritative zero", () => {
  assert.equal(combineEvidenceQueryResults([{ status: "unavailable", reason: "offline" }, { status: "error", reason: "threw" }]).status, "error");
  assert.equal(combineEvidenceQueryResults([{ status: "unavailable", reason: "offline" }]).status, "unavailable");
});

test("latest-request identity prevents stale evidence context from overwriting a newer ayah", () => {
  const gate = new LatestEvidenceRequestGate();
  const first = gate.begin("2:255");
  const second = gate.begin("3:2");
  assert.equal(gate.isCurrent(first), false);
  assert.equal(gate.isCurrent(second), true);
  gate.cancel();
  assert.equal(gate.isCurrent(second), false);
});

test("production evidence registry contains only a disabled, unapproved reference provider", async () => {
  const subject = createProductionEvidenceRegistry(async (verseKey) => RESOLVED.get(verseKey) ?? null);
  assert.equal(subject.listSourceIds().length, 1);
  const result = await subject.queryAll("2:255", 42);
  assert.equal(result.status, "disabled");
  assert.match(result.reason, /disabled|independent approval/i);
});
