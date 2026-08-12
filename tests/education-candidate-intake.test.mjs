import assert from "node:assert/strict";
import { access, cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";

import { createProductionEducationRegistry, normalizeEducationProviderMetadata } from "../app/education-content.ts";
import { EDUCATION_CANDIDATE_FILES, NASIHA_LEVEL2_STRUCTURE, readEducationCandidateIntake, validateEducationCandidateDirectory, validateEducationCandidateIntake } from "../scripts/education-candidate-intake.mjs";

const root = resolve(new URL("..", import.meta.url).pathname.slice(process.platform === "win32" ? 1 : 0));
const candidateDirectory = join(root, "content", "education", "candidates", "nasiha-level2-iman");

async function documents() {
  return readEducationCandidateIntake(candidateDirectory);
}

test("the candidate intake is structural, pending, unknown-rights, and non-production", async () => {
  const intake = await documents();
  assert.deepEqual(validateEducationCandidateIntake(intake), { valid: true, issues: [] });
  assert.equal(intake["source-manifest.json"].sources.length, 1);
  assert.equal(intake["source-manifest.json"].sources[0].id, NASIHA_LEVEL2_STRUCTURE.sourceId);
  assert.equal(intake["assessment-map.json"].assessments.length, 1);
  assert.equal(intake["assessment-map.json"].assessments[0].id, NASIHA_LEVEL2_STRUCTURE.assessmentId);
  assert.equal(intake["assessment-map.json"].assessments[0].responsibleOrganization, NASIHA_LEVEL2_STRUCTURE.responsibleOrganization);
  assert.equal(intake["rights-intake.json"].responsibleOrganization, intake["source-manifest.json"].sources[0].responsibleOrganization);
  assert.equal(intake["source-manifest.json"].productionEligible, false);
  assert.equal(intake["source-manifest.json"].sourceStatus, "pending");
  assert.equal(intake["rights-intake.json"].rightsStatus, "unknown");
  assert.ok(Object.values(intake["rights-intake.json"].grants).every((grant) => grant.status === "unknown" && grant.supportingReference === null));
  assert.equal(intake["scholarly-review-intake.json"].scholarlyReviewStatus, "pending");
  assert.deepEqual(intake["scholarly-review-intake.json"].reviewers, []);
  assert.deepEqual(intake["citation-map.json"].citations, []);
  assert.deepEqual(intake["checksums.json"].finalChecksums, []);
});

test("only the approved five structural lessons exist and no substantive lesson fields exist", async () => {
  const curriculum = (await documents())["curriculum-map.json"];
  assert.deepEqual(curriculum.lessons.map((lesson) => lesson.id), NASIHA_LEVEL2_STRUCTURE.lessons.map(([id]) => id));
  for (const lesson of curriculum.lessons) assert.deepEqual(Object.keys(lesson).sort(), ["courseId", "id", "moduleId", "sequence", "title"]);
  const serialized = JSON.stringify(curriculum);
  for (const forbidden of ["summary", "objective", "estimatedMinutes", "blocks", "knowledgeChecks", "answer", "citationIds"]) assert.doesNotMatch(serialized, new RegExp(forbidden, "i"));
});

test("candidate validation pins exact source cardinality and identity", async () => {
  const mutations = [
    (value) => { value["source-manifest.json"].sources = []; },
    (value) => { value["source-manifest.json"].sources.push({ ...structuredClone(value["source-manifest.json"].sources[0]), id: "source:second" }); },
    (value) => { value["source-manifest.json"].sources[0].id = "source:changed"; },
    (value) => { value["source-manifest.json"].sources.push(structuredClone(value["source-manifest.json"].sources[0])); },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(await documents());
    mutate(value);
    assert.equal(validateEducationCandidateIntake(value).valid, false);
  }
});

test("candidate validation pins exact assessment identity and pending provenance", async () => {
  const mutations = [
    (value) => { value["assessment-map.json"].assessments = []; },
    (value) => { value["assessment-map.json"].assessments.push({ ...structuredClone(value["assessment-map.json"].assessments[0]), id: "assessment:second" }); },
    (value) => { value["assessment-map.json"].assessments.push(structuredClone(value["assessment-map.json"].assessments[0])); },
    (value) => { value["assessment-map.json"].assessments[0].id = "assessment:changed"; },
    (value) => { value["assessment-map.json"].assessments[0].title = "Changed assessment title"; },
    (value) => { value["assessment-map.json"].assessments[0].responsibleOrganization = "Changed Organization"; },
    (value) => { value["assessment-map.json"].assessments[0].revision = "invented-revision"; },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(await documents());
    mutate(value);
    assert.equal(validateEducationCandidateIntake(value).valid, false);
  }
});

test("rights organization reconciles exactly and every grant remains unknown", async () => {
  const valid = await documents();
  assert.equal(validateEducationCandidateIntake(valid).valid, true);
  for (const organization of ["Changed Organization", "", null, 42]) {
    const value = structuredClone(valid);
    value["rights-intake.json"].responsibleOrganization = organization;
    assert.equal(validateEducationCandidateIntake(value).valid, false);
  }
  const permitted = structuredClone(valid);
  permitted["rights-intake.json"].grants.applicationUse.status = "permitted";
  assert.match(validateEducationCandidateIntake(permitted).issues.join("; "), /supporting reference/i);
});

test("candidate validation rejects gate bypasses, missing or extra lessons, and duplicate hierarchy IDs", async () => {
  const mutations = [
    (value) => { value["scholarly-review-intake.json"].scholarlyReviewStatus = "approved"; },
    (value) => { value["source-manifest.json"].productionEligible = true; },
    (value) => { value["checksums.json"].finalChecksums.push({ sourceDocumentId: "missing", algorithm: "SHA-256", checksum: "a".repeat(64) }); },
    (value) => { value["curriculum-map.json"].lessons.pop(); },
    (value) => { value["curriculum-map.json"].lessons.push({ id: "lesson:nasiha:outside-scope:l2", moduleId: NASIHA_LEVEL2_STRUCTURE.moduleId, courseId: NASIHA_LEVEL2_STRUCTURE.courseId, title: "Outside scope", sequence: 6 }); },
    (value) => { value["curriculum-map.json"].courses.push(structuredClone(value["curriculum-map.json"].courses[0])); },
    (value) => { value["curriculum-map.json"].modules.push(structuredClone(value["curriculum-map.json"].modules[0])); },
    (value) => { value["curriculum-map.json"].lessons.push(structuredClone(value["curriculum-map.json"].lessons[0])); },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(await documents());
    mutate(value);
    assert.equal(validateEducationCandidateIntake(value).valid, false);
  }
});

test("every intake record is closed to unknown fields and top-level documents", async () => {
  const mutations = [
    ...["source-manifest.json", "curriculum-map.json", "citation-map.json", "assessment-map.json", "rights-intake.json", "scholarly-review-intake.json", "checksums.json"].map((file) => (value) => { value[file].unexpected = "claim"; }),
    (value) => { value["source-manifest.json"].sources[0].unexpected = "claim"; },
    (value) => { value["curriculum-map.json"].courses[0].unexpected = "claim"; },
    (value) => { value["curriculum-map.json"].modules[0].unexpected = "claim"; },
    (value) => { value["curriculum-map.json"].lessons[0].unexpected = "claim"; },
    (value) => { value["assessment-map.json"].assessments[0].unexpected = "claim"; },
    (value) => { value["rights-intake.json"].grants.unexpected = { status: "permitted" }; },
    (value) => { value["rights-intake.json"].grants.applicationUse.unexpected = "claim"; },
    (value) => { value["citation-map.json"].citations.push({ unexpected: "claim" }); },
    (value) => { value["assessment-map.json"].assessments[0].questionMappings.push({ unexpected: "claim" }); },
    (value) => { value["checksums.json"].receivedSources.push({ unexpected: "claim" }); },
    (value) => { value["extra-document.json"] = { approved: true }; },
  ];
  for (const mutate of mutations) {
    const value = structuredClone(await documents());
    mutate(value);
    assert.equal(validateEducationCandidateIntake(value).valid, false);
  }
});

test("real candidate directory has one exact deterministic closed-world inventory", async () => {
  const result = await validateEducationCandidateDirectory(candidateDirectory);
  assert.deepEqual(result, { valid: true, issues: [], files: EDUCATION_CANDIDATE_FILES });
});

test("candidate directory rejects extra, nested, hidden-looking, and missing files", async (t) => {
  const extras = ["extra-document.json", "approval.json", "notes.txt", "misc/data.json", "assets/blob.bin", ".hidden-payload"];
  for (const extra of extras) {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "mushaf-education-candidate-"));
    t.after(() => rm(temporaryRoot, { recursive: true, force: true }));
    await cp(candidateDirectory, temporaryRoot, { recursive: true });
    const path = join(temporaryRoot, extra);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, "candidate package extra", "utf8");
    assert.equal((await validateEducationCandidateDirectory(temporaryRoot)).valid, false, extra);
  }
  const missingRoot = await mkdtemp(join(tmpdir(), "mushaf-education-candidate-missing-"));
  t.after(() => rm(missingRoot, { recursive: true, force: true }));
  await cp(candidateDirectory, missingRoot, { recursive: true });
  await rm(join(missingRoot, "source-manifest.json"));
  assert.equal((await validateEducationCandidateDirectory(missingRoot)).valid, false);
  const directoryRoot = await mkdtemp(join(tmpdir(), "mushaf-education-candidate-directory-"));
  t.after(() => rm(directoryRoot, { recursive: true, force: true }));
  await cp(candidateDirectory, directoryRoot, { recursive: true });
  await mkdir(join(directoryRoot, "empty-extra-directory"));
  assert.equal((await validateEducationCandidateDirectory(directoryRoot)).valid, false);
});

test("candidate intake records cannot normalize as runtime provider metadata", async () => {
  for (const document of Object.values(await documents())) assert.equal(normalizeEducationProviderMetadata(document).metadata, null);
});

test("candidate intake is absent from runtime/public roots and cannot activate a production provider", async () => {
  const appFiles = (await readdir(join(root, "app"), { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile() && /\.(?:ts|tsx|mjs)$/u.test(entry.name));
  for (const entry of appFiles) {
    const source = await readFile(join(entry.parentPath, entry.name), "utf8");
    assert.doesNotMatch(source, /content[\\/]education[\\/]candidates|candidate:nasiha:foundations-of-iman-level-2/);
  }
  await assert.rejects(access(join(root, "public", "education", "candidates", "nasiha-level2-iman")));
  await assert.rejects(access(join(root, "pages-static", "education", "candidates", "nasiha-level2-iman")));
  const registry = createProductionEducationRegistry(async () => { throw new Error("disabled production registry must not resolve citations"); });
  assert.deepEqual(registry.listProviderIds(), ["mushaf-companion:education-reference"]);
  assert.equal((await registry.loadFirstApprovedCatalog()).status, "disabled");
});

test("candidate prose contains no questions, answers, citations, permissions, review, or checksum claims", async () => {
  const files = await readdir(candidateDirectory);
  const combined = (await Promise.all(files.map((file) => readFile(join(candidateDirectory, file), "utf8")))).join("\n");
  assert.doesNotMatch(combined, /"(?:prompt|answer|verseKey|hadith|grade|reviewedAt)"\s*:\s*"/i);
  assert.doesNotMatch(combined, /"status"\s*:\s*"permitted"/i);
  assert.doesNotMatch(combined, /[a-f0-9]{64}/i);
});
