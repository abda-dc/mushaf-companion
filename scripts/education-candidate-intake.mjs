import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

export const EDUCATION_CANDIDATE_DOCUMENT_FILES = Object.freeze([
  "source-manifest.json",
  "curriculum-map.json",
  "citation-map.json",
  "assessment-map.json",
  "rights-intake.json",
  "scholarly-review-intake.json",
  "checksums.json",
]);

export const EDUCATION_CANDIDATE_FILES = Object.freeze([
  "README.md",
  ...EDUCATION_CANDIDATE_DOCUMENT_FILES,
].sort());

export const NASIHA_LEVEL2_STRUCTURE = Object.freeze({
  sourceId: "nasiha:foundations-of-iman-level-2",
  providerId: "nasiha-community-center:education",
  responsibleOrganization: "Nasiha Community Center",
  assessmentId: "assessment:nasiha:level-2-test:sessions-15-16",
  assessmentTitle: "Level 2 Test — Sessions 15 and 16",
  courseId: "course:nasiha:foundations-of-iman:l2",
  moduleId: "module:nasiha:foundations-of-faith:l2",
  lessons: Object.freeze([
    ["lesson:nasiha:six-pillars-of-iman:l2", "The Six Pillars of Iman"],
    ["lesson:nasiha:belief-in-messengers:l2", "Belief in the Messengers"],
    ["lesson:nasiha:revealed-books:l2", "Belief in Allah's Revealed Books"],
    ["lesson:nasiha:last-day:l2", "Belief in the Last Day"],
    ["lesson:nasiha:qadr:l2", "Belief in Qadr"],
  ]),
});

const FILE_KEYS = Object.freeze({
  "source-manifest.json": ["schemaVersion", "candidateId", "title", "sourceStatus", "productionEligible", "sources"],
  "curriculum-map.json": ["schemaVersion", "candidateId", "mappingStatus", "courses", "modules", "lessons"],
  "citation-map.json": ["schemaVersion", "candidateId", "citationStatus", "citations", "mappings"],
  "assessment-map.json": ["schemaVersion", "candidateId", "assessmentStatus", "assessments"],
  "rights-intake.json": ["schemaVersion", "candidateId", "rightsStatus", "owner", "author", "responsibleOrganization", "authorizedSignatory", "policyReference", "license", "attribution", "grants"],
  "scholarly-review-intake.json": ["schemaVersion", "candidateId", "scholarlyReviewStatus", "reviewedSourceRevision", "reviewedChecksum", "reviewedAt", "approvalReference", "scopeStatement", "reviewers"],
  "checksums.json": ["schemaVersion", "candidateId", "checksumStatus", "receivedSources", "finalChecksums"],
});

const RIGHTS = ["applicationUse", "redistribution", "bundling", "offlineUse", "modification"];

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, keys, path, issues) {
  if (!isRecord(value)) {
    issues.push(`${path} is malformed`);
    return false;
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) issues.push(`${path} has unexpected or missing fields`);
  return true;
}

function uniqueIds(records, path, issues) {
  const ids = records.flatMap((record) => isRecord(record) && typeof record.id === "string" ? [record.id] : []);
  if (ids.length !== records.length || new Set(ids).size !== ids.length) issues.push(`${path} IDs are missing or duplicated`);
}

export async function readEducationCandidateIntake(directory) {
  return Object.fromEntries(await Promise.all(EDUCATION_CANDIDATE_DOCUMENT_FILES.map(async (file) => [file, JSON.parse(await readFile(join(directory, file), "utf8"))])));
}

async function listCandidateFiles(directory, root = directory, files = [], issues = []) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    const path = join(directory, entry.name);
    const candidatePath = relative(root, path).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      issues.push(`candidate package directory ${candidatePath} is not allowlisted`);
      await listCandidateFiles(path, root, files, issues);
    }
    else if (entry.isFile()) files.push(candidatePath);
    else issues.push(`candidate package entry ${candidatePath} is not a regular file`);
  }
  return { files, issues };
}

export async function validateEducationCandidateDirectory(directory) {
  let inventory;
  try { inventory = await listCandidateFiles(directory); }
  catch { return { valid: false, issues: ["candidate package inventory could not be read"], files: [] }; }
  inventory.files.sort();
  const issues = [...inventory.issues];
  if (JSON.stringify(inventory.files) !== JSON.stringify(EDUCATION_CANDIDATE_FILES)) issues.push("candidate package file inventory is not exact");
  let documents = {};
  for (const file of EDUCATION_CANDIDATE_DOCUMENT_FILES) {
    try { documents[file] = JSON.parse(await readFile(join(directory, file), "utf8")); }
    catch { issues.push(`${file} is missing, unreadable, or malformed`); }
  }
  const documentResult = validateEducationCandidateIntake(documents);
  issues.push(...documentResult.issues);
  return { valid: issues.length === 0, issues, files: inventory.files };
}

export function validateEducationCandidateIntake(documents) {
  const issues = [];
  if (!isRecord(documents)) return { valid: false, issues: ["candidate document set is malformed"] };
  if (JSON.stringify(Object.keys(documents).sort()) !== JSON.stringify([...EDUCATION_CANDIDATE_DOCUMENT_FILES].sort())) issues.push("candidate document set contains unexpected or missing records");
  for (const file of EDUCATION_CANDIDATE_DOCUMENT_FILES) {
    const document = documents[file];
    if (!exactKeys(document, FILE_KEYS[file], file, issues)) continue;
    if (document.schemaVersion !== 1) issues.push(`${file} schemaVersion is unsupported`);
    if (document.candidateId !== "candidate:nasiha:foundations-of-iman-level-2") issues.push(`${file} candidateId is not the approved intake identity`);
  }

  const source = documents["source-manifest.json"];
  const curriculum = documents["curriculum-map.json"];
  const citations = documents["citation-map.json"];
  const assessments = documents["assessment-map.json"];
  const rights = documents["rights-intake.json"];
  const review = documents["scholarly-review-intake.json"];
  const checksums = documents["checksums.json"];
  if (![source, curriculum, citations, assessments, rights, review, checksums].every(isRecord)) return { valid: false, issues };

  if (source.title !== "Foundations of Iman — Level 2" || source.sourceStatus !== "pending") issues.push("source intake must remain pending for the approved candidate title");
  if (source.productionEligible !== false) issues.push("candidate intake must not be production eligible");
  if (!Array.isArray(source.sources) || source.sources.length !== 1) issues.push("candidate package requires exactly one source identity record");
  else {
    uniqueIds(source.sources, "source", issues);
    for (const [index, record] of source.sources.entries()) {
      if (!exactKeys(record, ["id", "providerId", "responsibleOrganization", "author", "revision", "sourceUrl", "receivedAt", "receivedDocumentReference"], `sources.${index}`, issues)) continue;
      if (record.id !== NASIHA_LEVEL2_STRUCTURE.sourceId || record.providerId !== NASIHA_LEVEL2_STRUCTURE.providerId) issues.push(`sources.${index} identity is outside the approved candidate scope`);
      if (record.responsibleOrganization !== NASIHA_LEVEL2_STRUCTURE.responsibleOrganization || record.author !== null || record.revision !== null || record.sourceUrl !== null || record.receivedAt !== null || record.receivedDocumentReference !== null) issues.push(`sources.${index} contains unreceived or invented source metadata`);
    }
  }

  if (curriculum.mappingStatus !== "structural-only" || !Array.isArray(curriculum.courses) || !Array.isArray(curriculum.modules) || !Array.isArray(curriculum.lessons)) issues.push("curriculum map is malformed");
  else {
    uniqueIds(curriculum.courses, "course", issues);
    uniqueIds(curriculum.modules, "module", issues);
    uniqueIds(curriculum.lessons, "lesson", issues);
    const expectedCourse = [{ id: NASIHA_LEVEL2_STRUCTURE.courseId, title: "Foundations of Iman — Level 2", moduleIds: [NASIHA_LEVEL2_STRUCTURE.moduleId] }];
    const expectedModule = [{ id: NASIHA_LEVEL2_STRUCTURE.moduleId, courseId: NASIHA_LEVEL2_STRUCTURE.courseId, title: "Foundations of Faith", lessonIds: NASIHA_LEVEL2_STRUCTURE.lessons.map(([id]) => id) }];
    const expectedLessons = NASIHA_LEVEL2_STRUCTURE.lessons.map(([id, title], sequence) => ({ id, moduleId: NASIHA_LEVEL2_STRUCTURE.moduleId, courseId: NASIHA_LEVEL2_STRUCTURE.courseId, title, sequence: sequence + 1 }));
    if (JSON.stringify(curriculum.courses) !== JSON.stringify(expectedCourse)) issues.push("candidate course structure is not the approved structural scope");
    if (JSON.stringify(curriculum.modules) !== JSON.stringify(expectedModule)) issues.push("candidate module structure is not the approved structural scope");
    if (JSON.stringify(curriculum.lessons) !== JSON.stringify(expectedLessons)) issues.push("candidate lessons are not exactly the approved five-lesson structure");
  }

  if (citations.citationStatus !== "pending" || !Array.isArray(citations.citations) || citations.citations.length || !Array.isArray(citations.mappings) || citations.mappings.length) issues.push("candidate citation intake must remain empty and pending");
  if (assessments.assessmentStatus !== "pending" || !Array.isArray(assessments.assessments) || assessments.assessments.length !== 1) issues.push("candidate package requires exactly one pending assessment provenance record");
  else for (const [index, assessment] of assessments.assessments.entries()) {
    if (!exactKeys(assessment, ["id", "title", "revision", "responsibleOrganization", "sourceUrl", "receivedAt", "questionsReceived", "answerKeyReceived", "questionMappings"], `assessments.${index}`, issues)) continue;
    if (assessment.id !== NASIHA_LEVEL2_STRUCTURE.assessmentId || assessment.title !== NASIHA_LEVEL2_STRUCTURE.assessmentTitle || assessment.responsibleOrganization !== NASIHA_LEVEL2_STRUCTURE.responsibleOrganization || assessment.revision !== null || assessment.sourceUrl !== null || assessment.receivedAt !== null || assessment.questionsReceived !== false || assessment.answerKeyReceived !== false || !Array.isArray(assessment.questionMappings) || assessment.questionMappings.length) issues.push(`assessments.${index} identity or pending state does not match the candidate package`);
  }

  const sourceOrganization = Array.isArray(source.sources) && source.sources.length === 1 && isRecord(source.sources[0]) ? source.sources[0].responsibleOrganization : null;
  if (rights.rightsStatus !== "unknown" || rights.responsibleOrganization !== NASIHA_LEVEL2_STRUCTURE.responsibleOrganization || rights.responsibleOrganization !== sourceOrganization || rights.owner !== null || rights.author !== null || rights.authorizedSignatory !== null || rights.policyReference !== null || rights.license !== null || rights.attribution !== null) issues.push("candidate rights claims and responsible organization must match the unknown-rights source identity");
  if (!isRecord(rights.grants)) issues.push("candidate rights grants are malformed");
  else {
    exactKeys(rights.grants, RIGHTS, "rights grants", issues);
    for (const right of RIGHTS) {
      const grant = rights.grants[right];
      if (!exactKeys(grant, ["status", "supportingReference"], `rights.${right}`, issues)) continue;
      if (grant.status === "permitted" && (typeof grant.supportingReference !== "string" || !grant.supportingReference.trim())) issues.push(`${right} cannot be permitted without a supporting reference`);
      if (grant.status !== "unknown" || grant.supportingReference !== null) issues.push(`${right} must remain unknown for this candidate`);
    }
  }

  if (review.scholarlyReviewStatus === "approved" && (!Array.isArray(review.reviewers) || !review.reviewers.length || typeof review.approvalReference !== "string" || !review.approvalReference.trim())) issues.push("scholarly approval requires named reviewers and an approval reference");
  if (review.scholarlyReviewStatus !== "pending" || review.reviewedSourceRevision !== null || review.reviewedChecksum !== null || review.reviewedAt !== null || review.approvalReference !== null || review.scopeStatement !== null || !Array.isArray(review.reviewers) || review.reviewers.length) issues.push("candidate scholarly review must remain pending without fabricated approval data");

  if (checksums.checksumStatus !== "pending" || !Array.isArray(checksums.receivedSources) || !Array.isArray(checksums.finalChecksums)) issues.push("candidate checksum intake is malformed");
  else {
    const receivedIds = new Set(checksums.receivedSources.flatMap((record) => isRecord(record) && typeof record.sourceDocumentId === "string" && typeof record.sourceIdentity === "string" ? [record.sourceDocumentId] : []));
    for (const finalChecksum of checksums.finalChecksums) if (!isRecord(finalChecksum) || !receivedIds.has(finalChecksum.sourceDocumentId)) issues.push("a final checksum requires an actual received source identity");
    if (checksums.receivedSources.length || checksums.finalChecksums.length) issues.push("no source documents or final checksums have been received for this candidate");
  }

  const pending = source.sourceStatus !== "received"
    || rights.rightsStatus !== "permitted"
    || review.scholarlyReviewStatus !== "approved"
    || checksums.checksumStatus !== "final";
  if (source.productionEligible === true && pending) issues.push("productionEligible cannot be true while required intake remains pending");
  return { valid: issues.length === 0, issues };
}
