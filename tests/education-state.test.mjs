import assert from "node:assert/strict";
import test from "node:test";

import {
  completeEducationLesson,
  dueEducationReviews,
  educationProgressSummary,
  educationSourceMatches,
  nextEducationLesson,
  normalizeEducationProgress,
  recordEducationKnowledgeReview,
  startEducationLesson,
} from "../app/education-state.mjs";

const IDENTITY = { sourceId: "fixture:education-source", sourceRevision: "fixture-r1" };
const TARGET = { courseId: "course:fixture", moduleId: "module:fixture", lessonId: "lesson:one" };
const CATALOG = { schemaVersion: 1, ...IDENTITY, courses: [{ id: "course:fixture", moduleIds: ["module:fixture"] }], modules: [{ id: "module:fixture", courseId: "course:fixture", lessonIds: ["lesson:one", "lesson:two"] }], lessons: [{ id: "lesson:one", courseId: "course:fixture", moduleId: "module:fixture", title: "One", estimatedMinutes: 5 }, { id: "lesson:two", courseId: "course:fixture", moduleId: "module:fixture", title: "Two", estimatedMinutes: 7 }] };

test("education progress starts and completes lessons separately from other study domains", () => {
  const started = startEducationLesson(undefined, IDENTITY, { ...TARGET, sectionId: "block:one" }, "2026-08-12");
  assert.equal(started.sourceId, IDENTITY.sourceId);
  assert.equal(started.currentLesson.sectionId, "block:one");
  assert.equal(started.lessons[0].status, "in-progress");
  const completed = completeEducationLesson(started, IDENTITY, TARGET, "2026-08-13");
  assert.equal(completed.lessons[0].status, "completed");
  assert.equal(completed.lessons[0].completedAt, "2026-08-13");
  assert.equal(completed.currentLesson, null);
});

test("knowledge checks reuse Again/Hard/Good/Easy intervals and due ordering", () => {
  let progress = recordEducationKnowledgeReview(undefined, IDENTITY, { ...TARGET, checkId: "check:one" }, "good", "2026-08-01");
  assert.equal(progress.knowledgeChecks[0].dueAt, "2026-08-04");
  progress = recordEducationKnowledgeReview(progress, IDENTITY, { ...TARGET, checkId: "check:one" }, "easy", "2026-08-04");
  assert.equal(progress.knowledgeChecks[0].intervalDays, 9);
  assert.equal(progress.reviewHistory.length, 2);
  assert.equal(dueEducationReviews(progress, "2026-08-13").length, 1);
  progress = recordEducationKnowledgeReview(progress, IDENTITY, { ...TARGET, checkId: "check:one" }, "again", "2026-08-13");
  assert.equal(progress.knowledgeChecks[0].dueAt, "2026-08-14");
  assert.equal(progress.knowledgeChecks[0].lapses, 1);
});

test("backdated knowledge reviews preserve every existing check and history record", () => {
  const first = recordEducationKnowledgeReview(undefined, IDENTITY, { ...TARGET, checkId: "check:one" }, "good", "2026-08-10");
  const before = structuredClone(first);
  const backdated = recordEducationKnowledgeReview(first, IDENTITY, { ...TARGET, checkId: "check:one" }, "hard", "2026-08-09");
  assert.deepEqual(backdated, before);
  assert.equal(backdated.knowledgeChecks.length, 1);
  assert.equal(backdated.reviewHistory.length, 1);

  const sameDay = recordEducationKnowledgeReview(first, IDENTITY, { ...TARGET, checkId: "check:one" }, "hard", "2026-08-10");
  assert.equal(sameDay.knowledgeChecks[0].reviewCount, 2);
  assert.equal(sameDay.reviewHistory.length, 2);
  const forward = recordEducationKnowledgeReview(sameDay, IDENTITY, { ...TARGET, checkId: "check:one" }, "easy", "2026-08-12");
  assert.equal(forward.knowledgeChecks[0].lastStudied, "2026-08-12");
  assert.equal(forward.reviewHistory.length, 3);
});

test("malformed imported chronology is discarded without deleting an otherwise valid check", () => {
  const valid = recordEducationKnowledgeReview(undefined, IDENTITY, { ...TARGET, checkId: "check:one" }, "good", "2026-08-10");
  const imported = normalizeEducationProgress({
    ...valid,
    reviewHistory: [
      ...valid.reviewHistory,
      { checkId: "check:one", lessonId: TARGET.lessonId, grade: "hard", reviewedAt: "2026-08-09", dueAt: "2026-08-11", intervalDays: 2 },
      { checkId: "check:one", lessonId: TARGET.lessonId, grade: "easy", reviewedAt: "2026-08-11", dueAt: "2026-08-12", intervalDays: 7 },
    ],
  });
  assert.equal(imported.knowledgeChecks.length, 1);
  assert.deepEqual(imported.reviewHistory, valid.reviewHistory);
});

test("a source revision change never silently remaps progress", () => {
  const started = startEducationLesson(undefined, IDENTITY, TARGET, "2026-08-12");
  const changed = { ...IDENTITY, sourceRevision: "fixture-r2" };
  const attempted = completeEducationLesson(started, changed, TARGET, "2026-08-13");
  assert.deepEqual(attempted, started);
  assert.equal(educationSourceMatches(started, changed), false);
  assert.equal(nextEducationLesson(started, { ...CATALOG, sourceRevision: "fixture-r2" }), null);
  assert.deepEqual(educationProgressSummary(started, { ...CATALOG, sourceRevision: "fixture-r2" }), { totalLessons: 2, completedLessons: 0, inProgressLessons: 0, dueReviews: 0, percent: 0, sourceCurrent: false });
  assert.deepEqual(startEducationLesson(started, IDENTITY, { courseId: "course:different", moduleId: TARGET.moduleId, lessonId: TARGET.lessonId }, "2026-08-13"), started);
});

test("next lesson and summary follow approved catalog order", () => {
  const first = nextEducationLesson(undefined, CATALOG);
  assert.equal(first.lessonId, "lesson:one");
  const completed = completeEducationLesson(undefined, IDENTITY, TARGET, "2026-08-12");
  assert.equal(nextEducationLesson(completed, CATALOG).lessonId, "lesson:two");
  assert.deepEqual(educationProgressSummary(completed, CATALOG, "2026-08-12"), { totalLessons: 2, completedLessons: 1, inProgressLessons: 0, dueReviews: 0, percent: 50, sourceCurrent: true });
});

test("normalization bounds corrupt identities, checks, history, and impossible dates", () => {
  const normalized = normalizeEducationProgress({ schemaVersion: 1, sourceId: "bad id", sourceRevision: "r1", lessons: [{ courseId: "course:fixture", moduleId: "module:fixture", lessonId: "lesson:one", status: "completed", startedAt: "2026-02-31", completedAt: "2026-08-12" }], knowledgeChecks: [{ checkId: "check:one", lessonId: "lesson:missing" }], activityDates: ["2026-02-31", "2024-02-29"] });
  assert.equal(normalized.sourceId, null);
  assert.deepEqual(normalized.lessons, []);
  assert.deepEqual(normalized.knowledgeChecks, []);
  assert.deepEqual(normalized.activityDates, ["2024-02-29"]);

  const unpinned = normalizeEducationProgress({ schemaVersion: 1, sourceId: null, sourceRevision: null, lessons: [{ ...TARGET, status: "in-progress", startedAt: "2026-08-12", completedAt: null }], activityDates: ["2026-08-12"] });
  assert.deepEqual(unpinned.lessons, [], "unversioned lesson state cannot be adopted by a future source");

  const backwards = normalizeEducationProgress({ schemaVersion: 1, ...IDENTITY, lessons: [{ ...TARGET, status: "completed", startedAt: "2026-08-13", completedAt: "2026-08-12" }] });
  assert.deepEqual(backwards.lessons, []);
});
