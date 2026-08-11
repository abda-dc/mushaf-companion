import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { calculateStreak, normalizeHifzProgress, recordVerseReview } from "../app/hifz-state.mjs";
import { recordVocabularyReview } from "../app/vocabulary-state.mjs";
import {
  buildTodayStudyPlan,
  completeTodayStudyStep,
  currentTodayStudyStep,
  normalizeTodayStudyProgress,
  skipTodayStudyStep,
  startOrResumeTodayStudy,
  startTodayStudyStep,
  todayStudyCompletion,
} from "../app/today-study.mjs";

const CURRICULUM = { id: "foundation-125", sourceRevision: "fixture-r1" };
const READING = { page: 42, verseKey: "2:255" };
const STARTED_AT = "2026-08-10T12:00:00.000Z";

function dueProgress() {
  const hifzProgress = recordVerseReview(normalizeHifzProgress(null), { verseKey: "1:1", page: 1 }, "good", "2026-08-01");
  const vocabularyProgress = recordVocabularyReview(undefined, CURRICULUM, "entry:1", "good", "2026-08-01");
  return { hifzProgress, vocabularyProgress };
}

test("Today's Study prioritizes due Hifz, due vocabulary, then new vocabulary", () => {
  const { hifzProgress, vocabularyProgress } = dueProgress();
  const plan = buildTodayStudyPlan({ hifzProgress, vocabularyProgress, curriculumEntryIds: ["entry:1", "entry:2", "entry:3"], reading: READING, sessionMinutes: 5, date: "2026-08-10" });
  assert.deepEqual(plan.steps.map((step) => step.kind), ["hifz-review", "vocabulary-review", "vocabulary-new"]);
  assert.deepEqual(plan.steps.map((step) => step.estimatedMinutes), [2, 1, 2]);
});

test("ordinary Hifz/reading plans are valid and vocabulary-unavailable plans add no placeholders", () => {
  const { hifzProgress, vocabularyProgress } = dueProgress();
  const plan = buildTodayStudyPlan({ hifzProgress, vocabularyProgress, curriculumEntryIds: [], reading: READING, sessionMinutes: 10, date: "2026-08-10" });
  assert.deepEqual(plan.steps.map((step) => step.kind), ["hifz-review", "reading"]);
  assert.equal(plan.steps.some((step) => step.kind.startsWith("vocabulary")), false);
  assert.ok(plan.totalEstimatedMinutes <= 10);
});

test("5, 10, and 20 minute reading plans use deterministic exact estimates", () => {
  const expected = new Map([[5, { pages: 1, minutes: 3 }], [10, { pages: 3, minutes: 9 }], [20, { pages: 6, minutes: 18 }]]);
  for (const sessionMinutes of [5, 10, 20]) {
    const plan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes, date: "2026-08-10" });
    assert.equal(plan.steps[0].targets[0].pages, expected.get(sessionMinutes).pages);
    assert.equal(plan.steps[0].estimatedMinutes, expected.get(sessionMinutes).minutes);
  }
});

test("a same-day active snapshot survives duration changes and live-queue changes", () => {
  const { hifzProgress, vocabularyProgress } = dueProgress();
  const tenMinute = buildTodayStudyPlan({ hifzProgress, vocabularyProgress, curriculumEntryIds: ["entry:1", "entry:2"], reading: READING, sessionMinutes: 10, date: "2026-08-10" });
  const started = startOrResumeTodayStudy(undefined, tenMinute, STARTED_AT);
  const twentyMinute = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: { page: 99, verseKey: "3:1" }, sessionMinutes: 20, date: "2026-08-10" });
  const resumed = startOrResumeTodayStudy(started, twentyMinute, "2026-08-10T13:00:00.000Z");
  assert.equal(resumed.activeSession.sessionMinutes, 10);
  assert.deepEqual(resumed.activeSession.steps, tenMinute.steps);
  assert.equal(resumed.activeSession.startedAt, STARTED_AT);
});

test("duplicate restored step IDs are normalized to one canonical step", () => {
  const plan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes: 5, date: "2026-08-10" });
  const step = plan.steps[0];
  const normalized = normalizeTodayStudyProgress({
    schemaVersion: 1,
    activityDates: [],
    completions: [],
    activeSession: { dateKey: plan.dateKey, sessionMinutes: 5, startedAt: STARTED_AT, steps: [step, structuredClone(step)], startedStepIds: [], completedStepIds: [], skippedStepIds: [] },
  });
  assert.equal(normalized.activeSession.steps.length, 1);
  assert.equal(new Set(normalized.activeSession.steps.map((item) => item.id)).size, 1);
});

test("reading cannot complete until its target has been opened and marked started", () => {
  const plan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes: 5, date: "2026-08-10" });
  const step = plan.steps[0];
  const started = startOrResumeTodayStudy(undefined, plan, STARTED_AT);
  const premature = completeTodayStudyStep(started, step.id, "2026-08-10");
  assert.deepEqual(premature.completions, []);
  assert.deepEqual(premature.activityDates, []);
  const opened = startTodayStudyStep(started, step.id, "2026-08-10");
  assert.deepEqual(opened.activeSession.startedStepIds, [step.id]);
  const completed = completeTodayStudyStep(opened, step.id, "2026-08-10");
  assert.equal(completed.completions.length, 1);
  assert.deepEqual(completed.activityDates, ["2026-08-10"]);
});

test("duplicate completion is idempotent and skipping remains distinct", () => {
  const { hifzProgress } = dueProgress();
  const plan = buildTodayStudyPlan({ hifzProgress, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes: 5, date: "2026-08-10" });
  let progress = startOrResumeTodayStudy(undefined, plan, STARTED_AT);
  const hifz = plan.steps[0];
  progress = completeTodayStudyStep(progress, hifz.id, "2026-08-10");
  const duplicate = completeTodayStudyStep(progress, hifz.id, "2026-08-10");
  assert.equal(duplicate.completions.length, 1);
  assert.deepEqual(duplicate.activityDates, ["2026-08-10"]);
  const reading = plan.steps[1];
  const skipped = skipTodayStudyStep(duplicate, reading.id, "2026-08-10");
  assert.deepEqual(skipped.activeSession.skippedStepIds, [reading.id]);
  assert.equal(skipped.activeSession.completedStepIds.includes(reading.id), false);
  assert.deepEqual(todayStudyCompletion(skipped, plan, "2026-08-10"), { completedSteps: 1, totalSteps: 2, percent: 50 });
});

test("local-day boundaries reject stale sessions and first post-midnight completion records the new day", () => {
  const oldPlan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes: 5, date: "2026-08-10" });
  const oldSession = startOrResumeTodayStudy(undefined, oldPlan, STARTED_AT);
  assert.equal(currentTodayStudyStep(oldSession, "2026-08-11"), null);
  assert.deepEqual(completeTodayStudyStep(oldSession, oldPlan.steps[0].id, "2026-08-11").completions, []);

  const newPlan = buildTodayStudyPlan({ hifzProgress: undefined, vocabularyProgress: undefined, curriculumEntryIds: [], reading: READING, sessionMinutes: 5, date: "2026-08-11" });
  let newSession = startOrResumeTodayStudy(oldSession, newPlan, "2026-08-11T00:01:00.000Z");
  newSession = startTodayStudyStep(newSession, newPlan.steps[0].id, "2026-08-11");
  newSession = completeTodayStudyStep(newSession, newPlan.steps[0].id, "2026-08-11");
  assert.deepEqual(newSession.activityDates, ["2026-08-11"]);
  assert.equal(calculateStreak(newSession.activityDates, "2026-08-11"), 1);
});

test("normalization rejects impossible calendar dates, bad estimates, corrupt targets, and oversized targets", () => {
  const invalidDates = normalizeTodayStudyProgress({ schemaVersion: 1, activityDates: ["2026-02-31", "2026-04-31", "2023-02-29", "2024-02-29"], completions: [], activeSession: null });
  assert.deepEqual(invalidDates.activityDates, ["2024-02-29"]);
  const target = { page: 42, verseKey: "2:255", pages: 1 };
  const invalidSession = normalizeTodayStudyProgress({
    schemaVersion: 1,
    activityDates: [],
    completions: [],
    activeSession: { dateKey: "2026-08-10", sessionMinutes: 5, startedAt: STARTED_AT, steps: [{ id: "2026-08-10|reading", kind: "reading", title: "Unsafe", estimatedMinutes: 4, targets: [target] }], startedStepIds: [], completedStepIds: [], skippedStepIds: [] },
  });
  assert.equal(invalidSession.activeSession, null, "estimated minutes must equal the deterministic target cost");
  const oversized = normalizeTodayStudyProgress({
    schemaVersion: 1,
    activityDates: [],
    completions: [],
    activeSession: { dateKey: "2026-08-10", sessionMinutes: 5, startedAt: STARTED_AT, steps: [{ id: "2026-08-10|reading", kind: "reading", title: "Oversized", estimatedMinutes: 603, targets: Array.from({ length: 201 }, () => target) }], startedStepIds: [], completedStepIds: [], skippedStepIds: [] },
  });
  assert.equal(oversized.activeSession, null);
});

test("reader UI refreshes at midnight, locks active duration, and gates reading completion", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /next\.setHours\(24, 0, 0, 0\)/);
  assert.match(page, /setTodayKey\(toLocalDateKey\(\)\)/);
  assert.match(page, /function refreshTodayKey\(\)/);
  assert.match(page, /disabled=\{studyDurationLocked\}/);
  assert.match(page, /pendingReadingStartRef\.current/);
  assert.match(page, /startTodayStudyStep\(current, pending\.stepId, freshDay\)/);
  assert.match(page, /disabled=\{!activeStudyStepStarted\}/);
});
