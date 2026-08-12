export type EducationRight = "permitted" | "prohibited" | "unknown";
export type EducationReviewGrade = "again" | "hard" | "good" | "easy";
export type EducationLessonBlockType = "heading" | "paragraph" | "list-item" | "reflection";

export interface EducationScholarlyReviewer {
  name: string;
  role: string;
  organization: string | null;
}

export interface EducationProviderCapabilities {
  requiresBundling: boolean;
  supportsRemoteQuery: boolean;
  storesOffline: boolean;
  requiresModification: boolean;
}

export interface EducationRights {
  applicationUse: EducationRight;
  redistribution: EducationRight;
  bundling: EducationRight;
  offlineUse: EducationRight;
  modification: EducationRight;
  policyReference: string;
  license: string;
  attribution: string;
}

export interface EducationProviderMetadata {
  schemaVersion: 1;
  sourceId: string;
  provider: {
    id: string;
    name: string;
    origin: string;
    sourceUrl: string;
    sourceTitle: string;
    author: string;
    responsibleOrganization: string;
  };
  scholarlyReview: {
    status: "approved" | "pending" | "rejected";
    approvalReference: string;
    reviewedAt: string | null;
    reviewers: EducationScholarlyReviewer[];
    scopeStatement: string;
  };
  revision: string;
  language: string;
  audience: string;
  enabled: boolean;
  rights: EducationRights;
  capabilities: EducationProviderCapabilities;
  integrity: {
    algorithm: "SHA-256";
    checksum: string;
    normalizationVersion: string;
  };
  coverage: {
    courseCount: number;
    moduleCount: number;
    lessonCount: number;
    checkpointCount: number;
    citationCount: number;
  };
}

export interface EducationQuranCitation {
  id: string;
  type: "quran";
  verseKey: string;
  label: string;
  locator: string;
  sourceUrl: string;
}

export interface EducationSourceCitation {
  id: string;
  type: "source";
  workId: string;
  title: string;
  edition: string;
  locator: string;
  sourceUrl: string;
}

export type EducationCitation = EducationQuranCitation | EducationSourceCitation;

export interface EducationLessonBlock {
  id: string;
  type: EducationLessonBlockType;
  text: string;
  citationIds: string[];
}

export interface EducationKnowledgeCheck {
  id: string;
  prompt: string;
  answer: string;
  citationIds: string[];
}

export interface EducationLesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  summary: string;
  objectives: string[];
  estimatedMinutes: number;
  blocks: EducationLessonBlock[];
  knowledgeChecks: EducationKnowledgeCheck[];
}

export interface EducationModule {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  lessonIds: string[];
}

export interface EducationCourse {
  id: string;
  title: string;
  summary: string;
  moduleIds: string[];
}

export interface EducationCatalog {
  schemaVersion: 1;
  sourceId: string;
  sourceRevision: string;
  courses: EducationCourse[];
  modules: EducationModule[];
  lessons: EducationLesson[];
  citations: EducationCitation[];
}

export interface EducationProviderAudit {
  valid: boolean;
  auditedAt: string;
  identity: {
    providerId: string;
    sourceId: string;
    revision: string;
    providerOrigin: string;
    sourceUrl: string;
    sourceTitle: string;
    author: string;
    responsibleOrganization: string;
    language: string;
    audience: string;
    approvalReference: string;
    reviewedAt: string;
    reviewers: EducationScholarlyReviewer[];
    reviewScopeStatement: string;
    integrity: {
      algorithm: "SHA-256";
      checksum: string;
      normalizationVersion: string;
      status: "verified" | "declared-only" | "failed";
    };
  };
  content: {
    status: "verified" | "declared-only" | "failed";
    courseCount: number;
    moduleCount: number;
    lessonCount: number;
    checkpointCount: number;
    citationCount: number;
  };
  issues: string[];
}

export interface EducationProviderApproval {
  providerId: string;
  sourceId: string;
  revision: string;
  providerOrigin: string;
  sourceUrl: string;
  sourceTitle: string;
  author: string;
  responsibleOrganization: string;
  language: string;
  audience: string;
  approvalReference: string;
  reviewedAt: string;
  reviewers: EducationScholarlyReviewer[];
  reviewScopeStatement: string;
  integrityAlgorithm: "SHA-256";
  expectedChecksum: string;
  normalizationVersion: string;
  rights: EducationRights;
  capabilities: EducationProviderCapabilities;
}

export interface EducationProvider {
  metadata(): unknown;
  audit(): Promise<unknown>;
  loadCatalog(): Promise<unknown>;
}

export interface EducationCatalogIntegrityInput {
  catalog: EducationCatalog;
  serialized: string;
  normalizationVersion: string;
}

export interface EducationActivationPolicy {
  approvedProviders: Record<string, EducationProviderApproval>;
  verifyIntegrity?: (input: EducationCatalogIntegrityInput, provider: EducationProvider, approval: EducationProviderApproval) => Promise<unknown>;
  resolveVerse: (verseKey: string) => Promise<unknown>;
}

export type EducationActivationResult =
  | { status: "active"; metadata: EducationProviderMetadata; approval: EducationProviderApproval; audit: EducationProviderAudit }
  | { status: "disabled" | "unavailable" | "error"; reason: string };

export type EducationCatalogResult =
  | { status: "ready"; metadata: EducationProviderMetadata; approval: EducationProviderApproval; audit: EducationProviderAudit; catalog: EducationCatalog }
  | { status: "disabled" | "unavailable" | "invalid" | "error"; reason: string };

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:._/-]{1,159}$/;
const VERSE_KEY = /^[1-9]\d{0,2}:[1-9]\d{0,2}$/;
const CHECKSUM = /^[a-f0-9]{64}$/;
const ISO_INSTANT = /^[1-9]\d{3}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/;
const RIGHTS = new Set<EducationRight>(["permitted", "prohibited", "unknown"]);
const BLOCK_TYPES = new Set<EducationLessonBlockType>(["heading", "paragraph", "list-item", "reflection"]);
const MAX_COURSES = 100;
const MAX_MODULES = 1_000;
const MAX_LESSONS = 10_000;
const MAX_CITATIONS = 50_000;
const MAX_CHECKPOINTS = 50_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, issues: string[]) {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedKeys.has(key)) issues.push(`${path}.${key} is not allowed`);
}

function safeId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID.test(value);
}

function safeText(value: unknown, max = 2_000): value is string {
  return typeof value === "string"
    && value.trim() === value
    && value.length > 0
    && [...value].length <= max
    && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value);
}

function safeHttpsUrl(value: unknown, origin?: string): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (!origin || url.origin === origin);
  } catch {
    return false;
  }
}

function safeHttpsOrigin(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && url.pathname === "/";
  } catch {
    return false;
  }
}

function validInstant(value: unknown) {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function normalizeCapabilities(value: unknown, issues: string[]) {
  if (!isRecord(value)) {
    issues.push("provider capabilities are missing");
    return null;
  }
  exactKeys(value, ["requiresBundling", "supportsRemoteQuery", "storesOffline", "requiresModification"], "capabilities", issues);
  for (const field of ["requiresBundling", "supportsRemoteQuery", "storesOffline", "requiresModification"] as const) {
    if (typeof value[field] !== "boolean") issues.push(`provider capability ${field} is invalid`);
  }
  return value as unknown as EducationProviderCapabilities;
}

function normalizeRights(value: unknown, issues: string[]) {
  if (!isRecord(value)) {
    issues.push("provider rights are missing");
    return null;
  }
  exactKeys(value, ["applicationUse", "redistribution", "bundling", "offlineUse", "modification", "policyReference", "license", "attribution"], "rights", issues);
  for (const field of ["applicationUse", "redistribution", "bundling", "offlineUse", "modification"] as const) {
    if (!RIGHTS.has(value[field] as EducationRight)) issues.push(`provider right ${field} is invalid`);
  }
  for (const field of ["policyReference", "license", "attribution"] as const) {
    if (!safeText(value[field], 1_000)) issues.push(`provider right ${field} is missing`);
  }
  return value as unknown as EducationRights;
}

export function normalizeEducationProviderMetadata(value: unknown): { metadata: EducationProviderMetadata | null; issues: string[] } {
  const issues: string[] = [];
  try { value = structuredClone(value); }
  catch { return { metadata: null, issues: ["provider metadata could not be detached safely"] }; }
  if (!isRecord(value)) return { metadata: null, issues: ["provider metadata is missing or malformed"] };
  exactKeys(value, ["schemaVersion", "sourceId", "provider", "scholarlyReview", "revision", "language", "audience", "enabled", "rights", "capabilities", "integrity", "coverage"], "metadata", issues);
  if (value.schemaVersion !== 1) issues.push("unsupported provider metadata schema");
  if (!safeId(value.sourceId)) issues.push("provider source ID is invalid");
  if (!safeText(value.revision, 160)) issues.push("provider revision is missing");
  if (!safeText(value.language, 80)) issues.push("provider language is missing");
  if (!safeText(value.audience, 300)) issues.push("provider audience is missing");
  if (typeof value.enabled !== "boolean") issues.push("provider enabled state is missing");

  const provider = isRecord(value.provider) ? value.provider : null;
  if (!provider) issues.push("provider identity is missing");
  else {
    exactKeys(provider, ["id", "name", "origin", "sourceUrl", "sourceTitle", "author", "responsibleOrganization"], "provider", issues);
    if (!safeId(provider.id)) issues.push("provider ID is invalid");
    if (!safeHttpsOrigin(provider.origin)) issues.push("provider origin is invalid");
    if (!safeHttpsUrl(provider.sourceUrl, typeof provider.origin === "string" ? provider.origin : undefined)) issues.push("provider source URL is invalid");
    for (const field of ["name", "sourceTitle", "author", "responsibleOrganization"] as const) {
      if (!safeText(provider[field], 500)) issues.push(`provider ${field} is missing`);
    }
  }

  const review = isRecord(value.scholarlyReview) ? value.scholarlyReview : null;
  if (!review) issues.push("scholarly review metadata is missing");
  else {
    exactKeys(review, ["status", "approvalReference", "reviewedAt", "reviewers", "scopeStatement"], "scholarlyReview", issues);
    if (!["approved", "pending", "rejected"].includes(String(review.status))) issues.push("scholarly review status is invalid");
    if (!safeText(review.approvalReference, 500)) issues.push("scholarly approval reference is missing");
    if (review.reviewedAt !== null && !validInstant(review.reviewedAt)) issues.push("scholarly review timestamp is invalid");
    if (review.status === "approved" && review.reviewedAt === null) issues.push("approved scholarly review requires a timestamp");
    if (!safeText(review.scopeStatement, 1_000)) issues.push("scholarly review scope is missing");
    if (!Array.isArray(review.reviewers) || review.reviewers.length < 1 || review.reviewers.length > 20) issues.push("named scholarly reviewers are required");
    else review.reviewers.forEach((candidate, index) => {
      if (!isRecord(candidate)) {
        issues.push(`scholarlyReview.reviewers.${index} is malformed`);
        return;
      }
      exactKeys(candidate, ["name", "role", "organization"], `scholarlyReview.reviewers.${index}`, issues);
      if (!safeText(candidate.name, 200)) issues.push(`scholarlyReview.reviewers.${index}.name is missing`);
      if (!safeText(candidate.role, 200)) issues.push(`scholarlyReview.reviewers.${index}.role is missing`);
      if (candidate.organization !== null && !safeText(candidate.organization, 300)) issues.push(`scholarlyReview.reviewers.${index}.organization is invalid`);
    });
    if (Array.isArray(review.reviewers)) {
      const names = review.reviewers.flatMap((candidate) => isRecord(candidate) && typeof candidate.name === "string" ? [candidate.name.normalize("NFKC").toLocaleLowerCase("en-US")] : []);
      if (new Set(names).size !== names.length) issues.push("named scholarly reviewers must be unique");
    }
  }

  const rights = normalizeRights(value.rights, issues);
  const capabilities = normalizeCapabilities(value.capabilities, issues);
  const integrity = isRecord(value.integrity) ? value.integrity : null;
  if (!integrity) issues.push("provider integrity metadata is missing");
  else {
    exactKeys(integrity, ["algorithm", "checksum", "normalizationVersion"], "integrity", issues);
    if (integrity.algorithm !== "SHA-256") issues.push("provider integrity algorithm must be SHA-256");
    if (typeof integrity.checksum !== "string" || !CHECKSUM.test(integrity.checksum)) issues.push("provider checksum is invalid");
    if (!safeText(integrity.normalizationVersion, 160)) issues.push("provider normalization version is missing");
  }
  const coverage = isRecord(value.coverage) ? value.coverage : null;
  if (!coverage) issues.push("provider coverage is missing");
  else {
    exactKeys(coverage, ["courseCount", "moduleCount", "lessonCount", "checkpointCount", "citationCount"], "coverage", issues);
    for (const field of ["courseCount", "moduleCount", "lessonCount", "checkpointCount", "citationCount"] as const) {
      if (!Number.isInteger(coverage[field]) || Number(coverage[field]) < 0) issues.push(`provider coverage ${field} is invalid`);
    }
  }
  if (issues.length || !provider || !review || !rights || !capabilities || !integrity || !coverage) return { metadata: null, issues };
  return { metadata: deepFreeze(value as unknown as EducationProviderMetadata), issues };
}

function validateTextArray(value: unknown, path: string, issues: string[], maxItems: number) {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => !safeText(item, 500))) issues.push(`${path} is invalid`);
}

function validateIdArray(value: unknown, path: string, issues: string[], maxItems: number) {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => !safeId(item)) || new Set(value).size !== value.length) issues.push(`${path} is invalid or duplicated`);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  return Object.freeze(value);
}

function canonicalEducationCatalog(catalog: EducationCatalog): EducationCatalog {
  return {
    schemaVersion: 1,
    sourceId: catalog.sourceId,
    sourceRevision: catalog.sourceRevision,
    courses: catalog.courses.map((course) => ({ id: course.id, title: course.title, summary: course.summary, moduleIds: [...course.moduleIds] })),
    modules: catalog.modules.map((curriculumModule) => ({ id: curriculumModule.id, courseId: curriculumModule.courseId, title: curriculumModule.title, summary: curriculumModule.summary, lessonIds: [...curriculumModule.lessonIds] })),
    lessons: catalog.lessons.map((lesson) => ({
      id: lesson.id,
      moduleId: lesson.moduleId,
      courseId: lesson.courseId,
      title: lesson.title,
      summary: lesson.summary,
      objectives: [...lesson.objectives],
      estimatedMinutes: lesson.estimatedMinutes,
      blocks: lesson.blocks.map((block) => ({ id: block.id, type: block.type, text: block.text, citationIds: [...block.citationIds] })),
      knowledgeChecks: lesson.knowledgeChecks.map((check) => ({ id: check.id, prompt: check.prompt, answer: check.answer, citationIds: [...check.citationIds] })),
    })),
    citations: catalog.citations.map((citation) => citation.type === "quran"
      ? { id: citation.id, type: "quran", verseKey: citation.verseKey, label: citation.label, locator: citation.locator, sourceUrl: citation.sourceUrl }
      : { id: citation.id, type: "source", workId: citation.workId, title: citation.title, edition: citation.edition, locator: citation.locator, sourceUrl: citation.sourceUrl }),
  };
}

export function serializeEducationCatalogSnapshot(catalog: EducationCatalog) {
  return JSON.stringify(canonicalEducationCatalog(catalog));
}

export function validateEducationCatalog(value: unknown, metadata: EducationProviderMetadata): { valid: boolean; issues: string[]; catalog: EducationCatalog | null } {
  const issues: string[] = [];
  try { value = structuredClone(value); }
  catch { return { valid: false, issues: ["education catalog could not be detached safely"], catalog: null }; }
  if (!isRecord(value)) return { valid: false, issues: ["education catalog is missing or malformed"], catalog: null };
  exactKeys(value, ["schemaVersion", "sourceId", "sourceRevision", "courses", "modules", "lessons", "citations"], "catalog", issues);
  if (value.schemaVersion !== 1) issues.push("unsupported education catalog schema");
  if (value.sourceId !== metadata.sourceId) issues.push("catalog source ID does not match provider metadata");
  if (value.sourceRevision !== metadata.revision) issues.push("catalog revision does not match provider metadata");
  const courses = Array.isArray(value.courses) ? value.courses : [];
  const modules = Array.isArray(value.modules) ? value.modules : [];
  const lessons = Array.isArray(value.lessons) ? value.lessons : [];
  const citations = Array.isArray(value.citations) ? value.citations : [];
  if (!Array.isArray(value.courses) || courses.length > MAX_COURSES) issues.push("catalog courses are malformed or oversized");
  if (!Array.isArray(value.modules) || modules.length > MAX_MODULES) issues.push("catalog modules are malformed or oversized");
  if (!Array.isArray(value.lessons) || lessons.length > MAX_LESSONS) issues.push("catalog lessons are malformed or oversized");
  if (!Array.isArray(value.citations) || citations.length > MAX_CITATIONS) issues.push("catalog citations are malformed or oversized");

  const courseIds = new Set<string>();
  courses.forEach((candidate, index) => {
    if (!isRecord(candidate)) { issues.push(`courses.${index} is malformed`); return; }
    exactKeys(candidate, ["id", "title", "summary", "moduleIds"], `courses.${index}`, issues);
    if (!safeId(candidate.id) || courseIds.has(candidate.id)) issues.push(`courses.${index}.id is invalid or duplicated`);
    else courseIds.add(candidate.id);
    if (!safeText(candidate.title, 300) || !safeText(candidate.summary, 2_000)) issues.push(`courses.${index} text is invalid`);
    validateIdArray(candidate.moduleIds, `courses.${index}.moduleIds`, issues, MAX_MODULES);
  });

  const moduleIds = new Set<string>();
  modules.forEach((candidate, index) => {
    if (!isRecord(candidate)) { issues.push(`modules.${index} is malformed`); return; }
    exactKeys(candidate, ["id", "courseId", "title", "summary", "lessonIds"], `modules.${index}`, issues);
    if (!safeId(candidate.id) || moduleIds.has(candidate.id)) issues.push(`modules.${index}.id is invalid or duplicated`);
    else moduleIds.add(candidate.id);
    if (!safeId(candidate.courseId) || !courseIds.has(candidate.courseId)) issues.push(`modules.${index}.courseId is invalid`);
    if (!safeText(candidate.title, 300) || !safeText(candidate.summary, 2_000)) issues.push(`modules.${index} text is invalid`);
    validateIdArray(candidate.lessonIds, `modules.${index}.lessonIds`, issues, MAX_LESSONS);
  });

  const citationIds = new Set<string>();
  citations.forEach((candidate, index) => {
    if (!isRecord(candidate)) { issues.push(`citations.${index} is malformed`); return; }
    const common = ["id", "type", "verseKey", "label", "locator", "sourceUrl"] as const;
    exactKeys(candidate, candidate.type === "source" ? ["id", "type", "workId", "title", "edition", "locator", "sourceUrl"] : common, `citations.${index}`, issues);
    if (!safeId(candidate.id) || citationIds.has(candidate.id)) issues.push(`citations.${index}.id is invalid or duplicated`);
    else citationIds.add(candidate.id);
    if (!safeText(candidate.locator, 500) || !safeHttpsUrl(candidate.sourceUrl)) issues.push(`citations.${index} locator or URL is invalid`);
    if (candidate.type === "quran") {
      if (typeof candidate.verseKey !== "string" || !VERSE_KEY.test(candidate.verseKey)) issues.push(`citations.${index}.verseKey is invalid`);
      if (!safeText(candidate.label, 500)) issues.push(`citations.${index}.label is invalid`);
    } else if (candidate.type === "source") {
      if (!safeId(candidate.workId) || !safeText(candidate.title, 500) || !safeText(candidate.edition, 500)) issues.push(`citations.${index} source identity is invalid`);
    } else issues.push(`citations.${index}.type is invalid`);
  });

  const lessonIds = new Set<string>();
  const knowledgeCheckIds = new Set<string>();
  let checkpointCount = 0;
  lessons.forEach((candidate, lessonIndex) => {
    if (!isRecord(candidate)) { issues.push(`lessons.${lessonIndex} is malformed`); return; }
    exactKeys(candidate, ["id", "moduleId", "courseId", "title", "summary", "objectives", "estimatedMinutes", "blocks", "knowledgeChecks"], `lessons.${lessonIndex}`, issues);
    if (!safeId(candidate.id) || lessonIds.has(candidate.id)) issues.push(`lessons.${lessonIndex}.id is invalid or duplicated`);
    else lessonIds.add(candidate.id);
    if (!safeId(candidate.moduleId) || !moduleIds.has(candidate.moduleId)) issues.push(`lessons.${lessonIndex}.moduleId is invalid`);
    if (!safeId(candidate.courseId) || !courseIds.has(candidate.courseId)) issues.push(`lessons.${lessonIndex}.courseId is invalid`);
    if (!safeText(candidate.title, 300) || !safeText(candidate.summary, 2_000)) issues.push(`lessons.${lessonIndex} text is invalid`);
    validateTextArray(candidate.objectives, `lessons.${lessonIndex}.objectives`, issues, 20);
    if (!Number.isInteger(candidate.estimatedMinutes) || Number(candidate.estimatedMinutes) < 1 || Number(candidate.estimatedMinutes) > 120) issues.push(`lessons.${lessonIndex}.estimatedMinutes is invalid`);
    const blocks = Array.isArray(candidate.blocks) ? candidate.blocks : [];
    if (!Array.isArray(candidate.blocks) || !blocks.length || blocks.length > 200) issues.push(`lessons.${lessonIndex}.blocks are malformed`);
    const blockIds = new Set<string>();
    blocks.forEach((block, blockIndex) => {
      if (!isRecord(block)) { issues.push(`lessons.${lessonIndex}.blocks.${blockIndex} is malformed`); return; }
      exactKeys(block, ["id", "type", "text", "citationIds"], `lessons.${lessonIndex}.blocks.${blockIndex}`, issues);
      if (!safeId(block.id) || blockIds.has(block.id)) issues.push(`lessons.${lessonIndex}.blocks.${blockIndex}.id is invalid or duplicated`);
      else blockIds.add(block.id);
      if (!BLOCK_TYPES.has(block.type as EducationLessonBlockType) || !safeText(block.text, 4_000)) issues.push(`lessons.${lessonIndex}.blocks.${blockIndex} is not safe structured plain text`);
      validateIdArray(block.citationIds, `lessons.${lessonIndex}.blocks.${blockIndex}.citationIds`, issues, 50);
      if (Array.isArray(block.citationIds) && block.citationIds.some((id) => !citationIds.has(id))) issues.push(`lessons.${lessonIndex}.blocks.${blockIndex} references an unknown citation`);
    });
    const checks = Array.isArray(candidate.knowledgeChecks) ? candidate.knowledgeChecks : [];
    if (!Array.isArray(candidate.knowledgeChecks) || checks.length > 100) issues.push(`lessons.${lessonIndex}.knowledgeChecks are malformed`);
    checkpointCount += checks.length;
    checks.forEach((check, checkIndex) => {
      if (!isRecord(check)) { issues.push(`lessons.${lessonIndex}.knowledgeChecks.${checkIndex} is malformed`); return; }
      exactKeys(check, ["id", "prompt", "answer", "citationIds"], `lessons.${lessonIndex}.knowledgeChecks.${checkIndex}`, issues);
      if (!safeId(check.id) || knowledgeCheckIds.has(check.id)) issues.push(`lessons.${lessonIndex}.knowledgeChecks.${checkIndex}.id is invalid or duplicated`);
      else knowledgeCheckIds.add(check.id);
      if (!safeText(check.prompt, 2_000) || !safeText(check.answer, 4_000)) issues.push(`lessons.${lessonIndex}.knowledgeChecks.${checkIndex} text is invalid`);
      validateIdArray(check.citationIds, `lessons.${lessonIndex}.knowledgeChecks.${checkIndex}.citationIds`, issues, 50);
      if (Array.isArray(check.citationIds) && check.citationIds.some((id) => !citationIds.has(id))) issues.push(`lessons.${lessonIndex}.knowledgeChecks.${checkIndex} references an unknown citation`);
    });
  });
  if (checkpointCount > MAX_CHECKPOINTS) issues.push("catalog knowledge checks exceed the audit bound");

  courses.forEach((course, index) => {
    if (!isRecord(course) || !Array.isArray(course.moduleIds)) return;
    if (course.moduleIds.some((id) => !moduleIds.has(id) || !modules.some((item) => isRecord(item) && item.id === id && item.courseId === course.id))) issues.push(`courses.${index} module sequence is inconsistent`);
  });
  modules.forEach((module, index) => {
    if (!isRecord(module) || !Array.isArray(module.lessonIds)) return;
    if (module.lessonIds.some((id) => !lessonIds.has(id) || !lessons.some((item) => isRecord(item) && item.id === id && item.moduleId === module.id && item.courseId === module.courseId))) issues.push(`modules.${index} lesson sequence is inconsistent`);
  });
  for (const curriculumModule of modules) {
    if (!isRecord(curriculumModule) || !safeId(curriculumModule.id)) continue;
    const parentCount = courses.filter((course) => isRecord(course) && Array.isArray(course.moduleIds) && course.moduleIds.includes(curriculumModule.id)).length;
    if (parentCount !== 1) issues.push(`module ${curriculumModule.id} must appear in exactly one course sequence`);
  }
  for (const lesson of lessons) {
    if (!isRecord(lesson) || !safeId(lesson.id)) continue;
    const parentCount = modules.filter((module) => isRecord(module) && Array.isArray(module.lessonIds) && module.lessonIds.includes(lesson.id)).length;
    if (parentCount !== 1) issues.push(`lesson ${lesson.id} must appear in exactly one module sequence`);
  }

  const coverage = metadata.coverage;
  if (courses.length !== coverage.courseCount || modules.length !== coverage.moduleCount || lessons.length !== coverage.lessonCount || checkpointCount !== coverage.checkpointCount || citations.length !== coverage.citationCount) issues.push("catalog coverage does not match provider metadata");
  if (issues.length) return { valid: false, issues, catalog: null };
  return { valid: true, issues, catalog: deepFreeze(canonicalEducationCatalog(value as unknown as EducationCatalog)) };
}

function sameCapabilities(left: EducationProviderCapabilities, right: EducationProviderCapabilities) {
  return (["requiresBundling", "supportsRemoteQuery", "storesOffline", "requiresModification"] as const).every((field) => left[field] === right[field]);
}

function reviewerIdentity(reviewer: unknown) {
  if (!isRecord(reviewer) || !safeText(reviewer.name, 200) || !safeText(reviewer.role, 200) || (reviewer.organization !== null && !safeText(reviewer.organization, 300))) return null;
  return `${reviewer.name}\u0000${reviewer.role}\u0000${reviewer.organization ?? ""}`;
}

function sameReviewers(left: unknown, right: unknown) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const leftIdentities = left.map(reviewerIdentity);
  const rightIdentities = right.map(reviewerIdentity);
  if (leftIdentities.some((value) => value === null) || rightIdentities.some((value) => value === null)) return false;
  return leftIdentities.sort().every((value, index) => value === rightIdentities.sort()[index]);
}

function activationIssues(metadata: EducationProviderMetadata, approval: EducationProviderApproval | undefined, registeredProviderId: string | null) {
  const issues: string[] = [];
  if (!metadata.enabled) issues.push("education provider is disabled");
  if (metadata.scholarlyReview.status !== "approved") issues.push("education provider lacks approved scholarly review");
  if (!approval) return [...issues, "education provider has no independent approval record"];
  if (registeredProviderId !== metadata.provider.id || approval.providerId !== metadata.provider.id) issues.push("provider ID does not match its pinned approval");
  if (approval.sourceId !== metadata.sourceId) issues.push("source ID does not match its pinned approval");
  if (approval.revision !== metadata.revision) issues.push("revision does not match its pinned approval");
  if (approval.providerOrigin !== metadata.provider.origin) issues.push("provider origin does not match its pinned approval");
  if (approval.sourceUrl !== metadata.provider.sourceUrl || approval.sourceTitle !== metadata.provider.sourceTitle) issues.push("source URL or title does not match its pinned approval");
  if (approval.author !== metadata.provider.author || approval.responsibleOrganization !== metadata.provider.responsibleOrganization) issues.push("author or responsible organization does not match its pinned approval");
  if (approval.language !== metadata.language || approval.audience !== metadata.audience) issues.push("language or audience does not match its pinned approval");
  if (approval.approvalReference !== metadata.scholarlyReview.approvalReference) issues.push("scholarly approval reference does not match its pin");
  if (approval.reviewedAt !== metadata.scholarlyReview.reviewedAt || approval.reviewScopeStatement !== metadata.scholarlyReview.scopeStatement || !sameReviewers(approval.reviewers, metadata.scholarlyReview.reviewers)) issues.push("named scholarly review metadata does not match its approval pin");
  if (approval.integrityAlgorithm !== metadata.integrity.algorithm || approval.expectedChecksum !== metadata.integrity.checksum || approval.normalizationVersion !== metadata.integrity.normalizationVersion) issues.push("provider integrity identity does not match its pin");
  if (/^0{64}$/.test(metadata.integrity.checksum)) issues.push("an enabled education provider cannot use a placeholder checksum");
  if (!sameCapabilities(approval.capabilities, metadata.capabilities)) issues.push("provider capabilities do not match their approval pin");
  for (const field of ["applicationUse", "redistribution", "bundling", "offlineUse", "modification", "policyReference", "license", "attribution"] as const) if (approval.rights[field] !== metadata.rights[field]) issues.push(`provider right ${field} does not match its approval pin`);
  if (metadata.rights.applicationUse !== "permitted") issues.push("application use is not permitted");
  if (metadata.capabilities.requiresBundling && (metadata.rights.bundling !== "permitted" || metadata.rights.redistribution !== "permitted")) issues.push("required bundling and redistribution rights are not permitted");
  if (metadata.capabilities.storesOffline && metadata.rights.offlineUse !== "permitted") issues.push("required offline use is not permitted");
  if (metadata.capabilities.requiresModification && metadata.rights.modification !== "permitted") issues.push("required modification is not permitted");
  if (!metadata.capabilities.requiresBundling && !metadata.capabilities.supportsRemoteQuery) issues.push("provider declares no supported delivery path");
  return issues;
}

function normalizeVerification(value: unknown, approval: EducationProviderApproval) {
  if (!isRecord(value) || value.status !== "verified" || value.algorithm !== approval.integrityAlgorithm || value.checksum !== approval.expectedChecksum || value.normalizationVersion !== approval.normalizationVersion) return null;
  return value;
}

function normalizeAudit(value: unknown, metadata: EducationProviderMetadata, approval: EducationProviderApproval): { audit: EducationProviderAudit | null; issues: string[] } {
  const issues: string[] = [];
  try { value = structuredClone(value); }
  catch { return { audit: null, issues: ["provider audit could not be detached safely"] }; }
  if (!isRecord(value)) return { audit: null, issues: ["provider audit is malformed"] };
  exactKeys(value, ["valid", "auditedAt", "identity", "content", "issues"], "audit", issues);
  if (value.valid !== true) issues.push("provider audit validity must be boolean true");
  if (!validInstant(value.auditedAt)) issues.push("provider audit timestamp is invalid");
  if (validInstant(value.auditedAt) && Date.parse(String(value.auditedAt)) < Date.parse(approval.reviewedAt)) issues.push("provider audit predates the pinned scholarly review");
  const identity = isRecord(value.identity) ? value.identity : null;
  const integrity = identity && isRecord(identity.integrity) ? identity.integrity : null;
  if (!identity || !integrity) issues.push("provider audit identity is missing");
  else {
    exactKeys(identity, ["providerId", "sourceId", "revision", "providerOrigin", "sourceUrl", "sourceTitle", "author", "responsibleOrganization", "language", "audience", "approvalReference", "reviewedAt", "reviewers", "reviewScopeStatement", "integrity"], "audit.identity", issues);
    exactKeys(integrity, ["algorithm", "checksum", "normalizationVersion", "status"], "audit.identity.integrity", issues);
    if (identity.providerId !== approval.providerId || identity.sourceId !== approval.sourceId || identity.revision !== approval.revision || identity.providerOrigin !== approval.providerOrigin || identity.sourceUrl !== approval.sourceUrl || identity.sourceTitle !== approval.sourceTitle || identity.author !== approval.author || identity.responsibleOrganization !== approval.responsibleOrganization || identity.language !== approval.language || identity.audience !== approval.audience || identity.approvalReference !== approval.approvalReference || identity.reviewedAt !== approval.reviewedAt || identity.reviewScopeStatement !== approval.reviewScopeStatement) issues.push("provider audit identity does not match its approval");
    if (!sameReviewers(identity.reviewers as EducationScholarlyReviewer[], approval.reviewers)) issues.push("provider audit reviewer identity does not match its approval");
    if (integrity.status !== "verified" || integrity.algorithm !== approval.integrityAlgorithm || integrity.checksum !== approval.expectedChecksum || integrity.normalizationVersion !== approval.normalizationVersion) issues.push("provider audit integrity does not match its approval");
  }
  const content = isRecord(value.content) ? value.content : null;
  if (!content || content.status !== "verified") issues.push("provider content audit is not verified");
  else {
    exactKeys(content, ["status", "courseCount", "moduleCount", "lessonCount", "checkpointCount", "citationCount"], "audit.content", issues);
    for (const field of ["courseCount", "moduleCount", "lessonCount", "checkpointCount", "citationCount"] as const) if (content[field] !== metadata.coverage[field]) issues.push(`provider audit ${field} does not match declared coverage`);
  }
  if (!Array.isArray(value.issues) || value.issues.length) issues.push("provider audit contains unresolved issues");
  return { audit: issues.length ? null : deepFreeze(value as unknown as EducationProviderAudit), issues };
}

type Registration = { provider: EducationProvider; registeredProviderId: string | null; activation: EducationActivationResult | null; catalog: EducationCatalog | null };

export class EducationProviderRegistry {
  readonly #policy: EducationActivationPolicy;
  readonly #registrations = new Map<string, Registration>();

  constructor(policy: EducationActivationPolicy) { this.#policy = policy; }

  register(provider: EducationProvider) {
    let registeredProviderId: string | null = null;
    try { registeredProviderId = normalizeEducationProviderMetadata(provider.metadata()).metadata?.provider.id ?? null; } catch { registeredProviderId = null; }
    const id = registeredProviderId ?? `invalid:${this.#registrations.size + 1}`;
    if (this.#registrations.has(id)) throw new Error(`Education provider ${id} is already registered.`);
    this.#registrations.set(id, { provider, registeredProviderId, activation: null, catalog: null });
    return id;
  }

  listProviderIds() { return [...this.#registrations.keys()]; }

  async activate(providerId: string): Promise<EducationActivationResult> {
    const registration = this.#registrations.get(providerId);
    if (!registration) return { status: "unavailable", reason: "Education provider is not registered." };
    if (registration.activation?.status === "active") return registration.activation;
    let normalized;
    try { normalized = normalizeEducationProviderMetadata(registration.provider.metadata()); }
    catch { return { status: "error", reason: "Education provider metadata could not be normalized safely." }; }
    if (!normalized.metadata) return { status: "unavailable", reason: normalized.issues.join("; ").slice(0, 1_000) };
    const metadata = normalized.metadata;
    const approval = this.#policy.approvedProviders[metadata.provider.id];
    let eligibility: string[];
    try { eligibility = activationIssues(metadata, approval, registration.registeredProviderId); }
    catch { return { status: "unavailable", reason: "Independent education approval metadata is malformed." }; }
    if (!approval || eligibility.length) return { status: !metadata.enabled || metadata.scholarlyReview.status !== "approved" ? "disabled" : "unavailable", reason: eligibility.join("; ").slice(0, 1_000) };
    if (!this.#policy.verifyIntegrity) return { status: "unavailable", reason: "Independent education integrity verification is required." };
    let rawCatalog: unknown;
    try { rawCatalog = await registration.provider.loadCatalog(); }
    catch { return { status: "error", reason: "Education catalog loading failed." }; }
    let validation;
    try { validation = validateEducationCatalog(rawCatalog, metadata); }
    catch { return { status: "error", reason: "Education catalog could not be validated safely." }; }
    if (!validation.valid || !validation.catalog) return { status: "unavailable", reason: validation.issues.join("; ").slice(0, 1_000) };
    const verifiedCatalog = validation.catalog;
    const integrityInput = deepFreeze({
      catalog: verifiedCatalog,
      serialized: serializeEducationCatalogSnapshot(verifiedCatalog),
      normalizationVersion: approval.normalizationVersion,
    });
    try {
      if (!normalizeVerification(await this.#policy.verifyIntegrity(integrityInput, registration.provider, approval), approval)) return { status: "unavailable", reason: "Independent education integrity verification did not match the canonical loaded catalog snapshot." };
    } catch { return { status: "error", reason: "Independent education integrity verification failed." }; }
    for (const citation of verifiedCatalog.citations) {
      if (citation.type !== "quran") continue;
      try {
        const resolved = await this.#policy.resolveVerse(citation.verseKey);
        if (!isRecord(resolved) || resolved.verseKey !== citation.verseKey || !Number.isInteger(resolved.page) || Number(resolved.page) < 1 || Number(resolved.page) > 604) return { status: "unavailable", reason: `Quran citation ${citation.id} did not match the trusted verse lookup boundary.` };
      } catch { return { status: "error", reason: `Quran citation ${citation.id} could not be checked through the trusted verse lookup boundary.` }; }
    }
    let rawAudit: unknown;
    try { rawAudit = await registration.provider.audit(); }
    catch { return { status: "error", reason: "Education provider audit failed." }; }
    let auditResult;
    try { auditResult = normalizeAudit(rawAudit, metadata, approval); }
    catch { return { status: "error", reason: "Education provider audit could not be normalized safely." }; }
    if (!auditResult.audit) return { status: "unavailable", reason: auditResult.issues.join("; ").slice(0, 1_000) };
    registration.catalog = verifiedCatalog;
    registration.activation = { status: "active", metadata, approval, audit: auditResult.audit };
    return registration.activation;
  }

  async loadCatalog(providerId: string): Promise<EducationCatalogResult> {
    const registration = this.#registrations.get(providerId);
    if (!registration) return { status: "unavailable", reason: "Education provider is not registered." };
    const activation = await this.activate(providerId);
    if (activation.status !== "active") return activation;
    if (!registration.catalog) return { status: "error", reason: "The verified education catalog cache is unavailable." };
    return { status: "ready", metadata: activation.metadata, approval: activation.approval, audit: activation.audit, catalog: registration.catalog };
  }

  async loadFirstApprovedCatalog(): Promise<EducationCatalogResult> {
    let failure: EducationCatalogResult = { status: "disabled", reason: "Guided courses awaiting approved curriculum." };
    for (const providerId of this.listProviderIds()) {
      const result = await this.loadCatalog(providerId);
      if (result.status === "ready") return result;
      if (result.status === "error" || result.status === "invalid" || result.status === "unavailable") failure = result;
    }
    return failure;
  }
}

export const REFERENCE_EDUCATION_PROVIDER_ID = "mushaf-companion:education-reference";
export const REFERENCE_EDUCATION_SOURCE_ID = "mushaf-education:reference-only";
export const PRODUCTION_EDUCATION_RELEASE = Object.freeze({
  status: "disabled" as const,
  bundled: false,
  providerId: null,
  sourceId: null,
  revision: null,
  courseCount: 0,
  lessonCount: 0,
  artifacts: [] as const,
  reason: "No approved guided education curriculum is configured.",
});

const REFERENCE_METADATA: EducationProviderMetadata = {
  schemaVersion: 1,
  sourceId: REFERENCE_EDUCATION_SOURCE_ID,
  provider: {
    id: REFERENCE_EDUCATION_PROVIDER_ID,
    name: "Mushaf Companion synthetic reference provider",
    origin: "https://example.invalid",
    sourceUrl: "https://example.invalid/education-reference",
    sourceTitle: "Empty education architecture reference",
    author: "Synthetic reference only",
    responsibleOrganization: "Mushaf Companion test architecture",
  },
  scholarlyReview: {
    status: "pending",
    approvalReference: "reference-only-no-production-approval",
    reviewedAt: null,
    reviewers: [{ name: "Synthetic Reviewer", role: "Test fixture identity", organization: null }],
    scopeStatement: "Empty reference metadata only; no Islamic teaching content is included.",
  },
  revision: "reference-only-unapproved",
  language: "en",
  audience: "Architecture tests only",
  enabled: false,
  rights: {
    applicationUse: "unknown",
    redistribution: "unknown",
    bundling: "unknown",
    offlineUse: "unknown",
    modification: "unknown",
    policyReference: "reference-only-no-rights-decision",
    license: "No production license",
    attribution: "Synthetic empty reference provider; not an Islamic curriculum.",
  },
  capabilities: { requiresBundling: false, supportsRemoteQuery: false, storesOffline: false, requiresModification: false },
  integrity: { algorithm: "SHA-256", checksum: "0".repeat(64), normalizationVersion: "education-catalog-json-v1" },
  coverage: { courseCount: 0, moduleCount: 0, lessonCount: 0, checkpointCount: 0, citationCount: 0 },
};

export function createReferenceEducationProvider(): EducationProvider {
  return {
    metadata: () => REFERENCE_METADATA,
    audit: async () => ({ valid: false, issues: ["Reference provider is disabled and unapproved."] }),
    loadCatalog: async () => ({ schemaVersion: 1, sourceId: REFERENCE_EDUCATION_SOURCE_ID, sourceRevision: REFERENCE_METADATA.revision, courses: [], modules: [], lessons: [], citations: [] }),
  };
}

export function createProductionEducationRegistry(resolveVerse: EducationActivationPolicy["resolveVerse"]) {
  const registry = new EducationProviderRegistry({ approvedProviders: {}, resolveVerse });
  registry.register(createReferenceEducationProvider());
  return registry;
}
