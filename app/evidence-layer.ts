export type EvidenceQueryStatus = "loading" | "ok" | "partial" | "unavailable" | "error" | "disabled";
export type EvidenceRelationshipType = "cross_reference" | "tafsir_reference" | "related_passage";
export type EvidenceRight = "permitted" | "prohibited" | "unknown";

export interface EvidenceAyahNode {
  type: "ayah";
  verseKey: string;
}

export interface EvidenceCitation {
  resourceId: string;
  locator: string;
  sourceUrl: string;
}

export interface EvidenceEdge {
  schemaVersion: 1;
  id: string;
  from: EvidenceAyahNode;
  to: EvidenceAyahNode;
  relationshipType: EvidenceRelationshipType;
  label: string;
  derivation: "explicit-source";
  providerSourceId: string;
  revision: string;
  citation: EvidenceCitation;
}

export interface EvidenceProviderCapabilities {
  requiresBundling: boolean;
  supportsRemoteQuery: boolean;
  storesOffline: boolean;
  requiresModification: boolean;
}

export interface EvidenceRights {
  applicationUse: EvidenceRight;
  redistribution: EvidenceRight;
  modification: EvidenceRight;
  offlineUse: EvidenceRight;
  bundling: EvidenceRight;
  policyReference: string;
  license: string;
  attribution: string;
}

export interface EvidenceProviderMetadata {
  schemaVersion: 1;
  sourceId: string;
  provider: {
    id: string;
    name: string;
    origin: string;
    sourceTitle: string;
    authorOrCompiler: string;
    edition: string;
    publisher: string;
    language: string;
    sourceUrl: string;
  };
  revision: string;
  enabled: boolean;
  approvalStatus: "approved" | "pending" | "rejected";
  approvalReference: string;
  rights: EvidenceRights;
  capabilities: EvidenceProviderCapabilities;
  integrity: {
    algorithm: string;
    checksum: string;
    normalizationVersion: string;
  };
  methodology: {
    kind: "explicit-source" | "inferred" | "synthetic";
    description: string;
  };
  coverage: {
    edgeCount: number;
    sourceVerseCount: number;
  };
}

export interface EvidenceProviderApproval {
  providerId: string;
  sourceId: string;
  revision: string;
  providerOrigin: string;
  approvalReference: string;
  integrityAlgorithm: string;
  expectedChecksum: string;
  normalizationVersion: string;
  rights: Pick<EvidenceRights, "applicationUse" | "redistribution" | "modification" | "offlineUse" | "bundling" | "policyReference">;
  capabilities: EvidenceProviderCapabilities;
}

export interface EvidenceAuditResult {
  valid: boolean;
  auditedAt: string;
  identity: {
    providerId: string;
    sourceId: string;
    revision: string;
    providerOrigin: string;
    approvalReference: string;
    integrity: {
      algorithm: string;
      checksum: string;
      normalizationVersion: string;
      status: "verified" | "declared-only" | "failed";
    };
  };
  contentMapping: { status: "verified" | "declared-only" | "failed"; edgeCount: number; sourceVerseCount: number };
  issues: string[];
}

export interface EvidenceIntegrityVerification {
  status: "verified";
  algorithm: string;
  checksum: string;
  normalizationVersion: string;
}

export interface ResolvedEvidenceEdge extends EvidenceEdge {
  canonicalId: string;
  providerId: string;
  sourcePage: number;
  targetPage: number;
  source: EvidenceProviderMetadata;
  sourceApproval: EvidenceProviderApproval;
  sourceAudit: EvidenceAuditResult;
}

export type EvidenceProviderQueryResult =
  | { status: "ok"; items: EvidenceEdge[]; total: number }
  | { status: "unavailable" | "error" | "disabled"; reason: string };

export interface EvidenceFailure {
  providerId: string;
  status: "unavailable" | "error" | "disabled";
  reason: string;
}

export type EvidenceQueryResult =
  | { status: "ok"; items: ResolvedEvidenceEdge[]; total: number; coverageComplete: true }
  | { status: "partial"; items: ResolvedEvidenceEdge[]; total: number; failures: EvidenceFailure[]; coverageComplete: false }
  | { status: "unavailable" | "error" | "disabled"; reason: string };

export interface EvidenceProvider {
  metadata(): unknown;
  audit(): Promise<unknown>;
  query(verseKey: string): Promise<unknown>;
}

export interface EvidenceActivationPolicy {
  approvedProviders: Record<string, EvidenceProviderApproval>;
  verifyIntegrity?: (provider: EvidenceProvider, approval: EvidenceProviderApproval) => Promise<unknown>;
  resolveVerse: (verseKey: string) => Promise<unknown>;
}

type Registration = {
  provider: EvidenceProvider;
  registeredProviderId: string | null;
  cachedSignature: string;
  cachedActivation: EvidenceActivationResult | null;
};

export type EvidenceActivationResult =
  | { status: "active"; metadata: EvidenceProviderMetadata; approval: EvidenceProviderApproval; audit: EvidenceAuditResult }
  | { status: "unavailable" | "error" | "disabled"; reason: string };

const VERSE_KEY = /^[1-9]\d{0,2}:[1-9]\d{0,2}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:._/-]{1,159}$/;
const CHECKSUM = /^[a-f0-9]{64}$/;
const ISO_INSTANT = /^[1-9]\d{3}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;
const RELATIONSHIPS = new Set<EvidenceRelationshipType>(["cross_reference", "tafsir_reference", "related_passage"]);
const RIGHTS = new Set<EvidenceRight>(["permitted", "prohibited", "unknown"]);
const FAILURE_STATUSES = new Set(["unavailable", "error", "disabled"]);
const MAX_QUERY_EDGES = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function text(value: unknown, max = 500): value is string {
  return typeof value === "string" && value.trim().length > 0 && [...value].length <= max;
}

function safeReason(value: unknown, fallback: string) {
  return text(value, 500) ? value.trim() : fallback;
}

function safeHttpsUrl(value: unknown, sourceOrigin?: string) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return !sourceOrigin || url.origin === sourceOrigin;
  } catch {
    return false;
  }
}

function safeHttpsOrigin(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && url.pathname === "/";
  } catch {
    return false;
  }
}

function validAuditInstant(value: unknown) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function normalizeCapabilities(value: unknown, issues: string[]) {
  if (!isRecord(value)) {
    issues.push("provider capabilities are missing");
    return null;
  }
  for (const field of ["requiresBundling", "supportsRemoteQuery", "storesOffline", "requiresModification"] as const) {
    if (typeof value[field] !== "boolean") issues.push(`provider capability ${field} is invalid`);
  }
  return value as unknown as EvidenceProviderCapabilities;
}

function normalizeMetadata(value: unknown): { metadata: EvidenceProviderMetadata | null; issues: string[] } {
  const issues: string[] = [];
  if (!isRecord(value)) return { metadata: null, issues: ["metadata is missing or malformed"] };
  const provider = isRecord(value.provider) ? value.provider : null;
  const rights = isRecord(value.rights) ? value.rights : null;
  const integrity = isRecord(value.integrity) ? value.integrity : null;
  const methodology = isRecord(value.methodology) ? value.methodology : null;
  const coverage = isRecord(value.coverage) ? value.coverage : null;
  if (value.schemaVersion !== 1) issues.push("unsupported metadata schema");
  if (!text(value.sourceId, 120) || !SAFE_ID.test(String(value.sourceId))) issues.push("source ID is missing or invalid");
  if (!text(value.revision, 120)) issues.push("revision is missing");
  if (typeof value.enabled !== "boolean") issues.push("enabled state is missing");
  if (!["approved", "pending", "rejected"].includes(String(value.approvalStatus))) issues.push("approval state is invalid");
  if (!text(value.approvalReference, 300)) issues.push("approval reference is missing");
  if (!provider) issues.push("provider identity is missing");
  else {
    if (!text(provider.id, 120) || !SAFE_ID.test(String(provider.id))) issues.push("provider ID is missing or invalid");
    for (const field of ["name", "sourceTitle", "authorOrCompiler", "edition", "publisher", "language"] as const) {
      if (!text(provider[field], 300)) issues.push(`provider ${field} is missing`);
    }
    if (!safeHttpsOrigin(provider.origin)) issues.push("provider origin is unsafe or malformed");
    if (!safeHttpsUrl(provider.sourceUrl, typeof provider.origin === "string" ? provider.origin : undefined)) issues.push("provider source URL is unsafe");
  }
  if (!rights) issues.push("rights metadata is missing");
  else {
    for (const field of ["applicationUse", "redistribution", "modification", "offlineUse", "bundling"] as const) {
      if (!RIGHTS.has(rights[field] as EvidenceRight)) issues.push(`${field} rights are invalid`);
    }
    if (!text(rights.policyReference, 300) || !text(rights.license, 300) || !text(rights.attribution, 500)) issues.push("rights policy and attribution are incomplete");
  }
  const capabilities = normalizeCapabilities(value.capabilities, issues);
  if (!integrity) issues.push("integrity metadata is missing");
  else {
    if (!text(integrity.algorithm, 40)) issues.push("integrity algorithm is missing");
    if (typeof integrity.checksum !== "string" || !CHECKSUM.test(integrity.checksum)) issues.push("integrity checksum metadata is invalid");
    if (!text(integrity.normalizationVersion, 120)) issues.push("integrity normalization is missing");
  }
  if (!methodology || !["explicit-source", "inferred", "synthetic"].includes(String(methodology.kind)) || !text(methodology.description, 500)) issues.push("methodology is invalid");
  if (!coverage || !Number.isSafeInteger(coverage.edgeCount) || Number(coverage.edgeCount) < 0 || !Number.isSafeInteger(coverage.sourceVerseCount) || Number(coverage.sourceVerseCount) < 0) issues.push("coverage is invalid");
  if (issues.length || !provider || !rights || !capabilities || !integrity || !methodology || !coverage) return { metadata: null, issues: [...new Set(issues)] };
  return {
    metadata: {
      schemaVersion: 1,
      sourceId: String(value.sourceId),
      provider: {
        id: String(provider.id),
        name: String(provider.name),
        origin: String(provider.origin),
        sourceTitle: String(provider.sourceTitle),
        authorOrCompiler: String(provider.authorOrCompiler),
        edition: String(provider.edition),
        publisher: String(provider.publisher),
        language: String(provider.language),
        sourceUrl: String(provider.sourceUrl),
      },
      revision: String(value.revision),
      enabled: value.enabled as boolean,
      approvalStatus: value.approvalStatus as EvidenceProviderMetadata["approvalStatus"],
      approvalReference: String(value.approvalReference),
      rights: {
        applicationUse: rights.applicationUse as EvidenceRight,
        redistribution: rights.redistribution as EvidenceRight,
        modification: rights.modification as EvidenceRight,
        offlineUse: rights.offlineUse as EvidenceRight,
        bundling: rights.bundling as EvidenceRight,
        policyReference: String(rights.policyReference),
        license: String(rights.license),
        attribution: String(rights.attribution),
      },
      capabilities: { ...capabilities },
      integrity: { algorithm: String(integrity.algorithm), checksum: String(integrity.checksum), normalizationVersion: String(integrity.normalizationVersion) },
      methodology: { kind: methodology.kind as EvidenceProviderMetadata["methodology"]["kind"], description: String(methodology.description) },
      coverage: { edgeCount: Number(coverage.edgeCount), sourceVerseCount: Number(coverage.sourceVerseCount) },
    },
    issues: [],
  };
}

function metadataSignature(metadata: EvidenceProviderMetadata, approval: EvidenceProviderApproval) {
  return JSON.stringify({ metadata, approval });
}

function sameCapabilities(left: EvidenceProviderCapabilities, right: EvidenceProviderCapabilities) {
  return left.requiresBundling === right.requiresBundling
    && left.supportsRemoteQuery === right.supportsRemoteQuery
    && left.storesOffline === right.storesOffline
    && left.requiresModification === right.requiresModification;
}

function eligibility(metadata: EvidenceProviderMetadata, policy: EvidenceActivationPolicy, registeredProviderId: string | null) {
  const issues: string[] = [];
  const approval = Object.prototype.hasOwnProperty.call(policy.approvedProviders, metadata.provider.id)
    ? policy.approvedProviders[metadata.provider.id]
    : undefined;
  if (!metadata.enabled) issues.push("provider is disabled");
  if (metadata.approvalStatus !== "approved") issues.push("provider does not declare an approved state");
  if (!registeredProviderId || registeredProviderId !== metadata.provider.id) issues.push("registered provider identity changed");
  if (metadata.methodology.kind !== "explicit-source") issues.push("provider methodology is not explicit sourced evidence");
  if (!approval) return { approval: null, issues: [...issues, "no independent approval policy is pinned for this provider"] };
  if (approval.providerId !== metadata.provider.id) issues.push("approved provider ID mismatch");
  if (approval.sourceId !== metadata.sourceId) issues.push("approved source ID mismatch");
  if (approval.revision !== metadata.revision) issues.push("approved revision mismatch");
  if (approval.providerOrigin !== metadata.provider.origin) issues.push("approved provider origin mismatch");
  if (approval.approvalReference !== metadata.approvalReference) issues.push("approval reference mismatch");
  if (approval.integrityAlgorithm !== metadata.integrity.algorithm) issues.push("approved integrity algorithm mismatch");
  if (approval.expectedChecksum !== metadata.integrity.checksum) issues.push("provider checksum differs from the independently pinned checksum");
  if (approval.normalizationVersion !== metadata.integrity.normalizationVersion) issues.push("approved normalization version mismatch");
  if (!sameCapabilities(approval.capabilities, metadata.capabilities)) issues.push("approved provider capabilities mismatch");
  for (const field of ["applicationUse", "redistribution", "modification", "offlineUse", "bundling"] as const) {
    if (approval.rights[field] !== metadata.rights[field]) issues.push(`approved ${field} rights mismatch`);
  }
  if (approval.rights.policyReference !== metadata.rights.policyReference) issues.push("rights policy reference mismatch");
  const requiredRights: Array<keyof EvidenceProviderApproval["rights"]> = ["applicationUse"];
  if (approval.capabilities.requiresBundling) requiredRights.push("redistribution", "bundling");
  if (approval.capabilities.storesOffline) requiredRights.push("offlineUse");
  if (approval.capabilities.requiresModification) requiredRights.push("modification");
  for (const right of requiredRights) {
    if (right !== "policyReference" && approval.rights[right] !== "permitted") issues.push(`required ${right} rights are not permitted`);
  }
  if (!approval.capabilities.requiresBundling && !approval.capabilities.supportsRemoteQuery && !approval.capabilities.storesOffline) issues.push("approved provider has no declared delivery mode");
  if (!policy.verifyIntegrity) issues.push("independent runtime integrity verification is unavailable");
  return { approval, issues: [...new Set(issues)] };
}

function normalizeIntegrityVerification(value: unknown, approval: EvidenceProviderApproval) {
  if (!isRecord(value)) return { verification: null, issues: ["independent integrity verification returned malformed data"] };
  const issues: string[] = [];
  if (value.status !== "verified") issues.push("independent integrity verification did not succeed");
  if (value.algorithm !== approval.integrityAlgorithm) issues.push("independent integrity algorithm mismatch");
  if (value.checksum !== approval.expectedChecksum) issues.push("independent checksum mismatch");
  if (value.normalizationVersion !== approval.normalizationVersion) issues.push("independent normalization version mismatch");
  return {
    verification: issues.length ? null : {
      status: "verified" as const,
      algorithm: String(value.algorithm),
      checksum: String(value.checksum),
      normalizationVersion: String(value.normalizationVersion),
    },
    issues,
  };
}

function normalizeAudit(value: unknown, metadata: EvidenceProviderMetadata, approval: EvidenceProviderApproval) {
  if (!isRecord(value)) return { audit: null, issues: ["runtime audit result is malformed"] };
  const identity = isRecord(value.identity) ? value.identity : null;
  const integrity = identity && isRecord(identity.integrity) ? identity.integrity : null;
  const mapping = isRecord(value.contentMapping) ? value.contentMapping : null;
  const issues: string[] = [];
  if (value.valid !== true) {
    const declared = Array.isArray(value.issues) ? value.issues.filter((issue): issue is string => text(issue, 300)) : [];
    issues.push(...(declared.length ? declared : ["runtime audit valid flag is not the boolean true"]));
  }
  if (!validAuditInstant(value.auditedAt)) issues.push("runtime audit timestamp is invalid");
  if (!identity) issues.push("runtime audit identity is malformed");
  else {
    if (identity.providerId !== approval.providerId) issues.push("audit provider identity mismatch");
    if (identity.sourceId !== approval.sourceId) issues.push("audit source identity mismatch");
    if (identity.revision !== approval.revision) issues.push("audit revision mismatch");
    if (identity.providerOrigin !== approval.providerOrigin) issues.push("audit provider origin mismatch");
    if (identity.approvalReference !== approval.approvalReference) issues.push("audit approval reference mismatch");
  }
  if (!integrity) issues.push("runtime audit integrity identity is malformed");
  else {
    if (integrity.algorithm !== approval.integrityAlgorithm) issues.push("audit integrity algorithm mismatch");
    if (integrity.checksum !== approval.expectedChecksum) issues.push("audit checksum differs from the independently pinned checksum");
    if (integrity.normalizationVersion !== approval.normalizationVersion) issues.push("audit normalization version mismatch");
    if (integrity.status !== "verified") issues.push("runtime checksum verification is incomplete");
  }
  if (!mapping || mapping.status !== "verified") issues.push("Quran content mapping audit is incomplete");
  else if (mapping.edgeCount !== metadata.coverage.edgeCount || mapping.sourceVerseCount !== metadata.coverage.sourceVerseCount) issues.push("audit coverage mismatch");
  if (!Array.isArray(value.issues) || value.issues.some((issue) => !text(issue, 300))) issues.push("runtime audit issues list is malformed");
  if (issues.length || !identity || !integrity || !mapping) return { audit: null, issues: [...new Set(issues)] };
  return {
    audit: {
      valid: true,
      auditedAt: String(value.auditedAt),
      identity: {
        providerId: String(identity.providerId),
        sourceId: String(identity.sourceId),
        revision: String(identity.revision),
        providerOrigin: String(identity.providerOrigin),
        approvalReference: String(identity.approvalReference),
        integrity: {
          algorithm: String(integrity.algorithm),
          checksum: String(integrity.checksum),
          normalizationVersion: String(integrity.normalizationVersion),
          status: "verified" as const,
        },
      },
      contentMapping: { status: "verified" as const, edgeCount: Number(mapping.edgeCount), sourceVerseCount: Number(mapping.sourceVerseCount) },
      issues: (value.issues as string[]).map((issue) => issue.trim()),
    },
    issues: [],
  };
}

function edgeIssue(edge: unknown, metadata: EvidenceProviderMetadata, requestedVerseKey: string) {
  if (!isRecord(edge)) return "evidence edge is malformed";
  if (edge.schemaVersion !== 1 || typeof edge.id !== "string" || !SAFE_ID.test(edge.id)) return "evidence identity is invalid";
  const from = isRecord(edge.from) ? edge.from : null;
  const to = isRecord(edge.to) ? edge.to : null;
  if (from?.type !== "ayah" || !VERSE_KEY.test(String(from.verseKey)) || from.verseKey !== requestedVerseKey) return "evidence source ayah is invalid";
  if (to?.type !== "ayah" || !VERSE_KEY.test(String(to.verseKey)) || to.verseKey === requestedVerseKey) return "evidence target ayah is invalid";
  if (!RELATIONSHIPS.has(edge.relationshipType as EvidenceRelationshipType) || !text(edge.label, 160)) return "evidence relationship semantics are invalid";
  if (edge.derivation !== "explicit-source") return "inferred or synthetic relationships are prohibited";
  if (edge.providerSourceId !== metadata.sourceId || edge.revision !== metadata.revision) return "evidence provenance identity mismatch";
  const citation = isRecord(edge.citation) ? edge.citation : null;
  if (!citation || !text(citation.resourceId, 200) || !text(citation.locator, 300) || !safeHttpsUrl(citation.sourceUrl, metadata.provider.origin)) return "evidence citation is malformed or unsafe";
  return "";
}

function normalizeProviderQueryResult(value: unknown): EvidenceProviderQueryResult {
  if (!isRecord(value)) return { status: "error", reason: "Evidence provider returned a malformed query result." };
  if (value.status === "ok") {
    if (!Array.isArray(value.items) || !Number.isInteger(value.total) || value.total !== value.items.length || value.items.length > MAX_QUERY_EDGES) {
      return { status: "error", reason: "Evidence provider returned an incomplete or oversized result." };
    }
    return { status: "ok", items: [...value.items] as EvidenceEdge[], total: Number(value.total) };
  }
  if (FAILURE_STATUSES.has(String(value.status))) {
    return {
      status: value.status as "unavailable" | "error" | "disabled",
      reason: safeReason(value.reason, "Evidence provider reported an unavailable result without a safe reason."),
    };
  }
  return { status: "error", reason: "Evidence provider returned an unknown query status." };
}

async function resolveTrustedVerse(policy: EvidenceActivationPolicy, verseKey: string) {
  try {
    const value = await policy.resolveVerse(verseKey);
    if (!isRecord(value) || value.verseKey !== verseKey || !Number.isInteger(value.page) || Number(value.page) < 1 || Number(value.page) > 604) return null;
    return { verseKey, page: Number(value.page) };
  } catch {
    return null;
  }
}

export function canonicalEvidenceEdgeIdentity(edge: EvidenceEdge, providerId: string) {
  return JSON.stringify([
    providerId,
    edge.revision,
    edge.from.type,
    edge.from.verseKey,
    edge.to.type,
    edge.to.verseKey,
    edge.relationshipType,
    edge.citation.resourceId,
    edge.citation.locator,
    edge.citation.sourceUrl,
  ]);
}

export class LatestEvidenceRequestGate {
  #generation = 0;
  begin(identity: string) { return { identity, generation: ++this.#generation }; }
  cancel() { this.#generation += 1; }
  isCurrent(token: { identity: string; generation: number }) { return token.generation === this.#generation; }
}

export function evidencePresentation(result: EvidenceQueryResult | { status: "loading" }) {
  if (result.status === "loading") return {
    eyebrow: "EVIDENCE",
    title: "Checking approved sources…",
    description: "No authority claim is made until source activation, independent integrity verification, and runtime audit succeed.",
    stateTitle: "Checking approved sources…",
    stateDescription: "The Quran page remains available while approved source identities and target mappings are checked.",
  };
  if (result.status === "disabled") return {
    eyebrow: "EVIDENCE",
    title: "Evidence sources unavailable",
    description: "No approved evidence source is currently enabled.",
    stateTitle: "Evidence sources unavailable",
    stateDescription: "No approved evidence source is currently enabled.",
  };
  if (result.status === "unavailable" || result.status === "error") return {
    eyebrow: "EVIDENCE",
    title: "Evidence could not be checked",
    description: "A source or trusted mapping boundary did not complete safely.",
    stateTitle: result.status === "error" ? "Evidence check failed" : "Evidence source unavailable",
    stateDescription: safeReason(result.reason, "Evidence could not be checked safely."),
  };
  if (result.status === "partial") return {
    eyebrow: "SOURCE-BACKED EVIDENCE · COVERAGE INCOMPLETE",
    title: "Some approved sources were checked",
    description: "Available relationships come only from sources that passed activation and audit, but one or more other sources could not be checked.",
    stateTitle: "Evidence coverage is incomplete",
    stateDescription: result.items.length
      ? "Some source-backed evidence is available below; missing sources may contain additional relationships."
      : "No relationship is shown, but this is not an authoritative zero because one or more sources could not be checked.",
  };
  if (result.status === "ok" && result.total === 0) return {
    eyebrow: "SOURCE-VERIFIED EVIDENCE",
    title: "Provider audited",
    description: "The approved source identity, pinned integrity value, runtime audit, and Quran mapping all completed successfully.",
    stateTitle: "No relationships were found in the successfully audited source.",
    stateDescription: "This zero applies only to the approved sources that completed successfully.",
  };
  return {
    eyebrow: "SOURCE-VERIFIED EVIDENCE",
    title: "Provider audited",
    description: "Each relationship below passed the independently pinned provider identity, integrity, citation, and trusted Quran mapping checks.",
    stateTitle: "Source-verified relationships",
    stateDescription: "Approved evidence is available.",
  };
}

export function combineEvidenceQueryResults(results: EvidenceQueryResult[], providerIds: string[] = []): EvidenceQueryResult {
  const successful = results.filter((result): result is Extract<EvidenceQueryResult, { status: "ok" | "partial" }> => result.status === "ok" || result.status === "partial");
  const items = successful.flatMap((result) => result.items);
  const failures: EvidenceFailure[] = [];
  results.forEach((result, index) => {
    if (result.status === "partial") failures.push(...result.failures);
    else if (result.status !== "ok") failures.push({ providerId: providerIds[index] ?? `approved-source-${index + 1}`, status: result.status, reason: safeReason(result.reason, "Evidence source failed without a safe reason.") });
  });
  if (successful.length) {
    const identities = new Set<string>();
    for (const edge of items) {
      if (identities.has(edge.canonicalId)) {
        failures.push({ providerId: edge.providerId, status: "error", reason: "A semantic evidence duplicate was rejected for the same provider revision." });
        continue;
      }
      identities.add(edge.canonicalId);
    }
    const uniqueItems = items.filter((edge, index) => items.findIndex((candidate) => candidate.canonicalId === edge.canonicalId) === index);
    return failures.length
      ? { status: "partial", items: uniqueItems, total: uniqueItems.length, failures, coverageComplete: false }
      : { status: "ok", items: uniqueItems, total: uniqueItems.length, coverageComplete: true };
  }
  if (!failures.length) return { status: "disabled", reason: "No approved evidence provider is configured." };
  const status = failures.some((failure) => failure.status === "error") ? "error"
    : failures.some((failure) => failure.status === "unavailable") ? "unavailable"
      : "disabled";
  return { status, reason: failures.map((failure) => `${failure.providerId}: ${failure.reason}`).join("; ").slice(0, 500) };
}

export class EvidenceProviderRegistry {
  #policy: EvidenceActivationPolicy;
  #registrations = new Map<string, Registration>();

  constructor(policy: EvidenceActivationPolicy) {
    this.#policy = policy;
  }

  register(provider: EvidenceProvider) {
    let registeredProviderId: string | null = null;
    try {
      registeredProviderId = normalizeMetadata(provider.metadata()).metadata?.provider.id ?? null;
    } catch {
      registeredProviderId = null;
    }
    const registrationId = registeredProviderId ?? `invalid:${this.#registrations.size + 1}`;
    if (this.#registrations.has(registrationId)) throw new Error(`Evidence provider ${registrationId} is already registered.`);
    this.#registrations.set(registrationId, { provider, registeredProviderId, cachedSignature: "", cachedActivation: null });
    return registrationId;
  }

  listSourceIds() { return [...this.#registrations.keys()]; }

  async activate(registrationId: string): Promise<EvidenceActivationResult> {
    const registration = this.#registrations.get(registrationId);
    if (!registration) return { status: "unavailable", reason: "Evidence provider is not registered." };
    let rawMetadata: unknown;
    try {
      rawMetadata = registration.provider.metadata();
    } catch {
      return { status: "error", reason: "Evidence provider metadata could not be read." };
    }
    let normalized: ReturnType<typeof normalizeMetadata>;
    try {
      normalized = normalizeMetadata(rawMetadata);
    } catch {
      return { status: "error", reason: "Evidence provider metadata could not be normalized safely." };
    }
    if (!normalized.metadata) return { status: "unavailable", reason: normalized.issues.join("; ") };
    const metadata = normalized.metadata;
    const eligible = eligibility(metadata, this.#policy, registration.registeredProviderId);
    if (!eligible.approval || eligible.issues.length) {
      const status = !metadata.enabled || metadata.approvalStatus !== "approved" ? "disabled" : "unavailable";
      return { status, reason: eligible.issues.join("; ") };
    }
    const approval = eligible.approval;
    const signature = metadataSignature(metadata, approval);
    if (registration.cachedSignature === signature && registration.cachedActivation?.status === "active") return registration.cachedActivation;
    let rawVerification: unknown;
    try {
      rawVerification = await this.#policy.verifyIntegrity!(registration.provider, approval);
    } catch {
      return { status: "error", reason: "Independent evidence integrity verification failed." };
    }
    let verification: ReturnType<typeof normalizeIntegrityVerification>;
    try {
      verification = normalizeIntegrityVerification(rawVerification, approval);
    } catch {
      return { status: "error", reason: "Independent evidence integrity result could not be normalized safely." };
    }
    if (!verification.verification) return { status: "unavailable", reason: verification.issues.join("; ") };
    let rawAudit: unknown;
    try {
      rawAudit = await registration.provider.audit();
    } catch {
      return { status: "error", reason: "Evidence provider audit failed." };
    }
    let normalizedAudit: ReturnType<typeof normalizeAudit>;
    try {
      normalizedAudit = normalizeAudit(rawAudit, metadata, approval);
    } catch {
      return { status: "error", reason: "Evidence provider audit could not be normalized safely." };
    }
    if (!normalizedAudit.audit) return { status: "unavailable", reason: normalizedAudit.issues.join("; ") };
    const activation: EvidenceActivationResult = { status: "active", metadata, approval, audit: normalizedAudit.audit };
    registration.cachedSignature = signature;
    registration.cachedActivation = activation;
    return activation;
  }

  async query(registrationId: string, verseKey: string, expectedPage: number): Promise<EvidenceQueryResult> {
    const activation = await this.activate(registrationId);
    if (activation.status !== "active") return activation;
    if (!VERSE_KEY.test(verseKey) || !Number.isInteger(expectedPage) || expectedPage < 1 || expectedPage > 604) return { status: "error", reason: "Requested Quran anchor is invalid." };
    const sourceAnchor = await resolveTrustedVerse(this.#policy, verseKey);
    if (!sourceAnchor || sourceAnchor.page !== expectedPage) return { status: "error", reason: "Requested Quran anchor did not reconcile with the trusted page map." };
    let rawResult: unknown;
    try {
      rawResult = await this.#registrations.get(registrationId)!.provider.query(verseKey);
    } catch {
      return { status: "error", reason: "Evidence provider query failed." };
    }
    let result: EvidenceProviderQueryResult;
    try {
      result = normalizeProviderQueryResult(rawResult);
    } catch {
      return { status: "error", reason: "Evidence provider query result could not be normalized safely." };
    }
    if (result.status !== "ok") return result;
    const identities = new Set<string>();
    const items: ResolvedEvidenceEdge[] = [];
    for (const edge of result.items) {
      try {
        const issue = edgeIssue(edge, activation.metadata, verseKey);
        if (issue) return { status: "error", reason: issue };
        const rawEdge = edge as unknown as Record<string, unknown>;
        const from = rawEdge.from as Record<string, unknown>;
        const to = rawEdge.to as Record<string, unknown>;
        const citation = rawEdge.citation as Record<string, unknown>;
        const validEdge: EvidenceEdge = {
          schemaVersion: 1,
          id: String(rawEdge.id),
          from: { type: "ayah", verseKey: String(from.verseKey) },
          to: { type: "ayah", verseKey: String(to.verseKey) },
          relationshipType: rawEdge.relationshipType as EvidenceRelationshipType,
          label: String(rawEdge.label),
          derivation: "explicit-source",
          providerSourceId: String(rawEdge.providerSourceId),
          revision: String(rawEdge.revision),
          citation: { resourceId: String(citation.resourceId), locator: String(citation.locator), sourceUrl: String(citation.sourceUrl) },
        };
        const canonicalId = canonicalEvidenceEdgeIdentity(validEdge, activation.approval.providerId);
        if (identities.has(canonicalId)) return { status: "error", reason: "Evidence provider returned the same semantic edge more than once for one revision." };
        identities.add(canonicalId);
        const target = await resolveTrustedVerse(this.#policy, validEdge.to.verseKey);
        if (!target) return { status: "error", reason: "Evidence target did not reconcile with the trusted Quran page map." };
        items.push({
          ...validEdge,
          canonicalId,
          providerId: activation.approval.providerId,
          sourcePage: sourceAnchor.page,
          targetPage: target.page,
          source: activation.metadata,
          sourceApproval: activation.approval,
          sourceAudit: activation.audit,
        });
      } catch {
        return { status: "error", reason: "Evidence edge could not be normalized safely." };
      }
    }
    return { status: "ok", items, total: items.length, coverageComplete: true };
  }

  async queryAll(verseKey: string, expectedPage: number): Promise<EvidenceQueryResult> {
    const providerIds = this.listSourceIds();
    const settled = await Promise.allSettled(providerIds.map((providerId) => this.query(providerId, verseKey, expectedPage)));
    const results = settled.map((result): EvidenceQueryResult => result.status === "fulfilled"
      ? result.value
      : { status: "error", reason: "Evidence source execution failed unexpectedly." });
    return combineEvidenceQueryResults(results, providerIds);
  }
}

export const REFERENCE_ONLY_EVIDENCE_SOURCE_ID = "mushaf-evidence:reference-architecture";
export const REFERENCE_ONLY_EVIDENCE_PROVIDER_ID = "mushaf-companion:reference-provider";

export function createReferenceOnlyEvidenceProvider(): EvidenceProvider {
  const metadata: EvidenceProviderMetadata = {
    schemaVersion: 1,
    sourceId: REFERENCE_ONLY_EVIDENCE_SOURCE_ID,
    provider: {
      id: REFERENCE_ONLY_EVIDENCE_PROVIDER_ID,
      name: "Mushaf Companion",
      origin: "https://example.invalid",
      sourceTitle: "Evidence relationship architecture placeholder",
      authorOrCompiler: "No production compiler approved",
      edition: "Reference-only 0.1",
      publisher: "Mushaf Companion",
      language: "en",
      sourceUrl: "https://example.invalid/mushaf-evidence-disabled",
    },
    revision: "0.1",
    enabled: false,
    approvalStatus: "pending",
    approvalReference: "No rights-cleared evidence source approved",
    rights: {
      applicationUse: "unknown",
      redistribution: "unknown",
      modification: "unknown",
      offlineUse: "unknown",
      bundling: "unknown",
      policyReference: "No production rights policy approved",
      license: "Not supplied",
      attribution: "No production evidence records are bundled.",
    },
    capabilities: { requiresBundling: false, supportsRemoteQuery: false, storesOffline: false, requiresModification: false },
    integrity: { algorithm: "SHA-256", checksum: "0".repeat(64), normalizationVersion: "evidence-edge-json-v1" },
    methodology: { kind: "explicit-source", description: "Architecture placeholder only; it contains no relationships." },
    coverage: { edgeCount: 0, sourceVerseCount: 0 },
  };
  return {
    metadata: () => metadata,
    audit: async () => ({ valid: false, auditedAt: "2026-08-11T00:00:00.000Z", issues: ["Reference-only provider is disabled and has no production dataset."] }),
    query: async () => ({ status: "disabled", reason: "No rights-cleared evidence dataset is active." }),
  };
}

export function createProductionEvidenceRegistry(resolveVerse: EvidenceActivationPolicy["resolveVerse"]) {
  const registry = new EvidenceProviderRegistry({ approvedProviders: {}, resolveVerse });
  registry.register(createReferenceOnlyEvidenceProvider());
  return registry;
}
