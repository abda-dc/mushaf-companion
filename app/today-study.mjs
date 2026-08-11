import { calendarDayDifference, isValidCalendarDateKey, normalizeHifzProgress, toLocalDateKey } from "./hifz-state.mjs";
import { dueVocabularyEntries, nextNewVocabularyIds, normalizeVocabularyProgress } from "./vocabulary-state.mjs";

export const TODAY_STUDY_SCHEMA_VERSION = 1;
export const DEFAULT_TODAY_STUDY_PROGRESS = Object.freeze({
  schemaVersion: TODAY_STUDY_SCHEMA_VERSION,
  activityDates: [],
  activeSession: null,
  completions: [],
});

const SESSION_MINUTES = new Set([5, 10, 20]);
const STEP_KINDS = new Set(["hifz-review", "vocabulary-review", "vocabulary-new", "reading"]);
const SAFE_ID = /^[a-z0-9][a-z0-9._:@/|-]{1,160}$/i;
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;
const MAX_STEPS = 20;
const MAX_TARGETS_PER_STEP = 200;
const MAX_COMPLETIONS = 5_000;
const MAX_ACTIVITY_DATES = 730;
const MAX_CURRICULUM_IDS = 1_000;

function dueHifzItems(progress, dateKey) {
  const normalized = normalizeHifzProgress(progress);
  const reviewed = normalized.reviews
    .filter((item) => calendarDayDifference(item.dueAt, dateKey) >= 0)
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || right.lapses - left.lapses)
    .map((item) => ({ verseKey: item.verseKey, page: item.page }));
  const reviewedKeys = new Set(normalized.reviews.map((item) => item.verseKey));
  const firstChecks = normalized.memorized
    .filter((item) => !reviewedKeys.has(item.verseKey))
    .sort((left, right) => left.markedAt.localeCompare(right.markedAt))
    .map((item) => ({ verseKey: item.verseKey, page: item.page }));
  return [...reviewed, ...firstChecks];
}

export function buildTodayStudyPlan({ hifzProgress, vocabularyProgress, curriculumEntryIds = [], reading, sessionMinutes = 10, date = new Date() }) {
  const requestedDateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const dateKey = isValidCalendarDateKey(requestedDateKey) ? requestedDateKey : toLocalDateKey();
  const minutes = SESSION_MINUTES.has(sessionMinutes) ? sessionMinutes : 10;
  const safeCurriculumIds = Array.isArray(curriculumEntryIds) ? curriculumEntryIds.slice(0, MAX_CURRICULUM_IDS) : [];
  let remaining = minutes;
  const steps = [];
  const addStep = (kind, title, targets, unitMinutes, units = targets.length) => {
    if (!targets.length || steps.length >= MAX_STEPS) return;
    const estimatedMinutes = units * unitMinutes;
    steps.push({ id: `${dateKey}|${kind}`, kind, title, estimatedMinutes, targets: targets.slice(0, MAX_TARGETS_PER_STEP) });
    remaining -= estimatedMinutes;
  };

  const hifzTargets = [];
  for (const target of dueHifzItems(hifzProgress, dateKey)) {
    if (remaining < 2 || hifzTargets.length >= MAX_TARGETS_PER_STEP) break;
    hifzTargets.push(target);
    remaining -= 2;
  }
  if (hifzTargets.length) {
    remaining += hifzTargets.length * 2;
    addStep("hifz-review", `Review ${hifzTargets.length} Hifz ${hifzTargets.length === 1 ? "ayah" : "ayat"}`, hifzTargets, 2);
  }

  const vocabularyDueTargets = [];
  for (const entry of safeCurriculumIds.length ? dueVocabularyEntries(vocabularyProgress, dateKey) : []) {
    if (remaining < 1 || vocabularyDueTargets.length >= MAX_TARGETS_PER_STEP) break;
    vocabularyDueTargets.push({ entryId: entry.entryId });
    remaining -= 1;
  }
  if (vocabularyDueTargets.length) {
    remaining += vocabularyDueTargets.length;
    addStep("vocabulary-review", `Review ${vocabularyDueTargets.length} vocabulary ${vocabularyDueTargets.length === 1 ? "word" : "words"}`, vocabularyDueTargets, 1);
  }

  const normalizedVocabulary = normalizeVocabularyProgress(vocabularyProgress);
  const newTargets = nextNewVocabularyIds(normalizedVocabulary, safeCurriculumIds, Math.min(normalizedVocabulary.dailyNewGoal, remaining)).map((entryId) => ({ entryId }));
  if (newTargets.length) addStep("vocabulary-new", `Learn ${newTargets.length} new ${newTargets.length === 1 ? "word" : "words"}`, newTargets, 1);

  if (reading && Number.isInteger(reading.page) && reading.page >= 1 && reading.page <= 604 && VERSE_KEY.test(reading.verseKey) && remaining >= 3) {
    const pages = Math.min(7, Math.max(1, Math.floor(remaining / 3)));
    addStep("reading", `Continue reading from page ${reading.page}`, [{ page: reading.page, verseKey: reading.verseKey, pages }], 3, pages);
  }

  return { dateKey, sessionMinutes: minutes, steps, totalEstimatedMinutes: steps.reduce((sum, step) => sum + step.estimatedMinutes, 0) };
}

function expectedMinutes(kind, targets) {
  if (kind === "hifz-review") return targets.length * 2;
  if (kind === "vocabulary-review" || kind === "vocabulary-new") return targets.length;
  if (kind === "reading") return targets.reduce((sum, target) => sum + target.pages * 3, 0);
  return 0;
}

function normalizeStep(step, dateKey) {
  if (!step || typeof step !== "object" || !STEP_KINDS.has(step.kind) || step.id !== `${dateKey}|${step.kind}` || !SAFE_ID.test(step.id) || typeof step.title !== "string" || !step.title.trim() || !Array.isArray(step.targets) || !step.targets.length || step.targets.length > MAX_TARGETS_PER_STEP) return null;
  const targets = step.targets.slice(0, MAX_TARGETS_PER_STEP);
  if (step.kind === "hifz-review" && targets.some((target) => !target || !VERSE_KEY.test(target.verseKey) || !Number.isInteger(target.page) || target.page < 1 || target.page > 604)) return null;
  if ((step.kind === "vocabulary-review" || step.kind === "vocabulary-new") && targets.some((target) => !target || typeof target.entryId !== "string" || !SAFE_ID.test(target.entryId))) return null;
  if (step.kind === "reading" && targets.some((target) => !target || !Number.isInteger(target.page) || target.page < 1 || target.page > 604 || !VERSE_KEY.test(target.verseKey) || !Number.isInteger(target.pages) || target.pages < 1 || target.pages > 7)) return null;
  const estimate = expectedMinutes(step.kind, targets);
  if (!Number.isInteger(step.estimatedMinutes) || step.estimatedMinutes !== estimate || estimate < 1) return null;
  return { id: step.id, kind: step.kind, title: step.title.trim().slice(0, 200), estimatedMinutes: estimate, targets };
}

function uniqueIds(value, validIds, excluded = new Set()) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const id of value.slice(0, MAX_STEPS * 2)) {
    if (typeof id !== "string" || !validIds.has(id) || excluded.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function normalizeTodayStudyProgress(value) {
  const source = value && typeof value === "object" && value.schemaVersion === TODAY_STUDY_SCHEMA_VERSION ? value : {};
  const activityDates = Array.isArray(source.activityDates) ? [...new Set(source.activityDates.slice(-MAX_ACTIVITY_DATES * 2).filter(isValidCalendarDateKey))].sort().slice(-MAX_ACTIVITY_DATES) : [];
  const completions = [];
  const completionIds = new Set();
  if (Array.isArray(source.completions)) {
    for (const item of source.completions.slice(-MAX_COMPLETIONS * 2)) {
      if (!item || typeof item !== "object" || !isValidCalendarDateKey(item.dateKey) || typeof item.stepId !== "string" || !SAFE_ID.test(item.stepId) || !STEP_KINDS.has(item.kind) || item.stepId !== `${item.dateKey}|${item.kind}` || !Number.isInteger(item.units) || item.units < 1) continue;
      const identity = `${item.dateKey}|${item.stepId}`;
      if (completionIds.has(identity)) continue;
      completionIds.add(identity);
      completions.push({ dateKey: item.dateKey, stepId: item.stepId, kind: item.kind, units: Math.min(item.units, 1000) });
      if (completions.length >= MAX_COMPLETIONS) break;
    }
  }

  let activeSession = null;
  const restored = source.activeSession;
  if (restored && typeof restored === "object" && isValidCalendarDateKey(restored.dateKey) && SESSION_MINUTES.has(restored.sessionMinutes) && typeof restored.startedAt === "string" && restored.startedAt.length <= 40 && Number.isFinite(Date.parse(restored.startedAt))) {
    const steps = [];
    const stepIds = new Set();
    const rawSteps = Array.isArray(restored.steps) ? restored.steps.slice(0, MAX_STEPS * 2) : [];
    for (const candidate of rawSteps) {
      const step = normalizeStep(candidate, restored.dateKey);
      if (!step || stepIds.has(step.id)) continue;
      stepIds.add(step.id);
      steps.push(step);
      if (steps.length >= MAX_STEPS) break;
    }
    const completedStepIds = uniqueIds(restored.completedStepIds, stepIds);
    const completed = new Set(completedStepIds);
    const skippedStepIds = uniqueIds(restored.skippedStepIds, stepIds, completed);
    const unavailable = new Set([...completedStepIds, ...skippedStepIds]);
    const startedStepIds = uniqueIds(restored.startedStepIds, stepIds);
    const firstPending = steps.findIndex((step) => !unavailable.has(step.id));
    if (steps.length) activeSession = {
      id: `today|${restored.dateKey}|${restored.sessionMinutes}`,
      dateKey: restored.dateKey,
      sessionMinutes: restored.sessionMinutes,
      steps,
      currentStepIndex: firstPending < 0 ? steps.length : firstPending,
      startedStepIds,
      completedStepIds,
      skippedStepIds,
      startedAt: restored.startedAt,
    };
  }
  return { schemaVersion: TODAY_STUDY_SCHEMA_VERSION, activityDates, activeSession, completions };
}

export function startOrResumeTodayStudy(progress, plan, startedAt = new Date().toISOString()) {
  const normalized = normalizeTodayStudyProgress(progress);
  if (!plan || !isValidCalendarDateKey(plan.dateKey)) return normalized;
  if (normalized.activeSession?.dateKey === plan.dateKey) return normalized;
  if (!Array.isArray(plan.steps) || !plan.steps.length) return normalized;
  return normalizeTodayStudyProgress({
    ...normalized,
    activeSession: { id: `today|${plan.dateKey}|${plan.sessionMinutes}`, dateKey: plan.dateKey, sessionMinutes: plan.sessionMinutes, steps: plan.steps, currentStepIndex: 0, startedStepIds: [], completedStepIds: [], skippedStepIds: [], startedAt },
  });
}

export function startTodayStudyStep(progress, stepId, date = new Date()) {
  const normalized = normalizeTodayStudyProgress(progress);
  const session = normalized.activeSession;
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const step = session?.steps[session.currentStepIndex];
  if (!session || !isValidCalendarDateKey(dateKey) || dateKey !== session.dateKey || !step || step.id !== stepId || session.startedStepIds.includes(stepId)) return normalized;
  return normalizeTodayStudyProgress({ ...normalized, activeSession: { ...session, startedStepIds: [...session.startedStepIds, stepId] } });
}

function advanceSession(progress, stepId, completed, date = new Date()) {
  const normalized = normalizeTodayStudyProgress(progress);
  const session = normalized.activeSession;
  const step = session?.steps.find((item) => item.id === stepId);
  if (!session || !step || session.completedStepIds.includes(stepId) || session.skippedStepIds.includes(stepId)) return normalized;
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey) || dateKey !== session.dateKey || (completed && step.kind === "reading" && !session.startedStepIds.includes(stepId))) return normalized;
  const completedStepIds = completed ? [...session.completedStepIds, stepId] : session.completedStepIds;
  const skippedStepIds = completed ? session.skippedStepIds : [...session.skippedStepIds, stepId];
  const resolved = new Set([...completedStepIds, ...skippedStepIds]);
  const nextIndex = session.steps.findIndex((item) => !resolved.has(item.id));
  const nextSession = { ...session, currentStepIndex: nextIndex < 0 ? session.steps.length : nextIndex, completedStepIds, skippedStepIds };
  return normalizeTodayStudyProgress({
    ...normalized,
    activeSession: nextSession,
    activityDates: completed && !normalized.activityDates.includes(dateKey) ? [...normalized.activityDates, dateKey] : normalized.activityDates,
    completions: completed ? [...normalized.completions, { dateKey, stepId, kind: step.kind, units: step.targets.length }] : normalized.completions,
  });
}

export function completeTodayStudyStep(progress, stepId, date = new Date()) {
  return advanceSession(progress, stepId, true, date);
}

export function skipTodayStudyStep(progress, stepId, date = new Date()) {
  return advanceSession(progress, stepId, false, date);
}

export function currentTodayStudyStep(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey)) return null;
  const session = normalizeTodayStudyProgress(progress).activeSession;
  return session?.dateKey === dateKey ? session.steps[session.currentStepIndex] ?? null : null;
}

export function todayStudyCompletion(progress, plan, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey)) return { completedSteps: 0, totalSteps: plan.steps.length, percent: 0 };
  const completed = new Set(normalizeTodayStudyProgress(progress).completions.filter((item) => item.dateKey === dateKey).map((item) => item.stepId));
  const completedSteps = plan.steps.filter((step) => completed.has(step.id)).length;
  return { completedSteps, totalSteps: plan.steps.length, percent: plan.steps.length ? Math.round(completedSteps / plan.steps.length * 100) : 0 };
}
