import { addCalendarDays, calendarDayDifference, isValidCalendarDateKey, toLocalDateKey } from "./hifz-state.mjs";
import { isReviewGrade, nextReviewIntervalDays } from "./review-schedule.mjs";

export const VOCABULARY_PROGRESS_SCHEMA_VERSION = 1;
export const DEFAULT_VOCABULARY_PROGRESS = Object.freeze({
  schemaVersion: VOCABULARY_PROGRESS_SCHEMA_VERSION,
  curriculumId: "foundation-125",
  sourceRevision: null,
  entries: [],
  history: [],
  activityDates: [],
  dailyNewGoal: 3,
});

const SAFE_ID = /^[a-z0-9][a-z0-9._:@/-]{1,127}$/i;
const MAX_ENTRIES = 10_000;
const MAX_HISTORY = 20_000;
const MAX_CURRICULUM_IDS = 1_000;

function takeUnique(items, keyForItem, limit) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyForItem(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeActivityDates(value) {
  return Array.isArray(value)
    ? [...new Set(value.slice(-1460).filter(isValidCalendarDateKey))].sort().slice(-730)
    : [];
}

export function normalizeVocabularyProgress(value) {
  const source = value && typeof value === "object" && value.schemaVersion === VOCABULARY_PROGRESS_SCHEMA_VERSION ? value : {};
  const curriculumId = typeof source.curriculumId === "string" && SAFE_ID.test(source.curriculumId) ? source.curriculumId : DEFAULT_VOCABULARY_PROGRESS.curriculumId;
  const sourceRevision = source.sourceRevision === null || (typeof source.sourceRevision === "string" && source.sourceRevision.trim() && source.sourceRevision.length <= 160) ? source.sourceRevision ?? null : null;
  const entries = Array.isArray(source.entries)
    ? takeUnique(source.entries.slice(0, MAX_ENTRIES * 2).filter((entry) => entry && typeof entry === "object" && typeof entry.entryId === "string" && SAFE_ID.test(entry.entryId) && isValidCalendarDateKey(entry.firstStudied) && isValidCalendarDateKey(entry.lastStudied) && isValidCalendarDateKey(entry.dueAt) && isReviewGrade(entry.grade)), (entry) => entry.entryId, MAX_ENTRIES)
      .map((entry) => ({
        entryId: entry.entryId,
        firstStudied: entry.firstStudied,
        lastStudied: entry.lastStudied,
        dueAt: entry.dueAt,
        grade: entry.grade,
        intervalDays: Number.isInteger(entry.intervalDays) && entry.intervalDays >= 1 ? Math.min(entry.intervalDays, 365) : 1,
        reviewCount: Number.isInteger(entry.reviewCount) && entry.reviewCount >= 1 ? Math.min(entry.reviewCount, 100_000) : 1,
        lapses: Number.isInteger(entry.lapses) && entry.lapses >= 0 ? Math.min(entry.lapses, 100_000) : 0,
      }))
    : [];
  const entryIds = new Set(entries.map((entry) => entry.entryId));
  const history = Array.isArray(source.history)
    ? source.history.slice(-MAX_HISTORY * 2).filter((item) => item && typeof item === "object" && entryIds.has(item.entryId) && isValidCalendarDateKey(item.reviewedAt) && isValidCalendarDateKey(item.dueAt) && isReviewGrade(item.grade) && Number.isInteger(item.intervalDays) && item.intervalDays >= 1)
      .slice(-MAX_HISTORY)
      .map((item) => ({ entryId: item.entryId, grade: item.grade, reviewedAt: item.reviewedAt, dueAt: item.dueAt, intervalDays: Math.min(item.intervalDays, 365) }))
    : [];
  const dailyNewGoal = Number.isInteger(source.dailyNewGoal) && source.dailyNewGoal >= 0 && source.dailyNewGoal <= 25 ? source.dailyNewGoal : DEFAULT_VOCABULARY_PROGRESS.dailyNewGoal;
  return { schemaVersion: VOCABULARY_PROGRESS_SCHEMA_VERSION, curriculumId, sourceRevision, entries, history, activityDates: normalizeActivityDates(source.activityDates), dailyNewGoal };
}

export function vocabularyEntryStatus(progress, entryId, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const entry = normalizeVocabularyProgress(progress).entries.find((item) => item.entryId === entryId);
  if (!entry) return "not-started";
  if (calendarDayDifference(entry.dueAt, dateKey) >= 0) return "due";
  if ((entry.grade === "good" || entry.grade === "easy") && entry.intervalDays >= 21) return "strong";
  return "learning";
}

export function recordVocabularyReview(progress, curriculum, entryId, grade, date = new Date()) {
  const normalized = normalizeVocabularyProgress(progress);
  if (!curriculum || typeof curriculum.id !== "string" || !SAFE_ID.test(curriculum.id) || typeof curriculum.sourceRevision !== "string" || !curriculum.sourceRevision.trim() || !SAFE_ID.test(entryId) || !isReviewGrade(grade)) return normalized;
  if (normalized.sourceRevision && (normalized.curriculumId !== curriculum.id || normalized.sourceRevision !== curriculum.sourceRevision)) return normalized;
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey)) return normalized;
  const previous = normalized.entries.find((entry) => entry.entryId === entryId);
  const intervalDays = nextReviewIntervalDays(previous?.intervalDays, grade, Boolean(previous));
  const entry = {
    entryId,
    firstStudied: previous?.firstStudied ?? dateKey,
    lastStudied: dateKey,
    dueAt: addCalendarDays(dateKey, intervalDays),
    grade,
    intervalDays,
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (grade === "again" ? 1 : 0),
  };
  const historyItem = { entryId, grade, reviewedAt: dateKey, dueAt: entry.dueAt, intervalDays };
  return normalizeVocabularyProgress({
    ...normalized,
    curriculumId: curriculum.id,
    sourceRevision: curriculum.sourceRevision,
    entries: [entry, ...normalized.entries.filter((item) => item.entryId !== entryId)],
    history: [...normalized.history, historyItem],
    activityDates: normalized.activityDates.includes(dateKey) ? normalized.activityDates : [...normalized.activityDates, dateKey],
  });
}

export function dueVocabularyEntries(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return normalizeVocabularyProgress(progress).entries
    .filter((entry) => calendarDayDifference(entry.dueAt, dateKey) >= 0)
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || right.lapses - left.lapses || left.entryId.localeCompare(right.entryId));
}

export function vocabularyCurriculumProgress(progress, curriculumEntryIds, date = new Date()) {
  const normalized = normalizeVocabularyProgress(progress);
  const validIds = new Set(Array.isArray(curriculumEntryIds) ? curriculumEntryIds.slice(0, MAX_CURRICULUM_IDS).filter((entryId) => typeof entryId === "string" && SAFE_ID.test(entryId)) : []);
  const studied = normalized.entries.filter((entry) => validIds.has(entry.entryId));
  const due = studied.filter((entry) => vocabularyEntryStatus(normalized, entry.entryId, date) === "due").length;
  const strong = studied.filter((entry) => vocabularyEntryStatus(normalized, entry.entryId, date) === "strong").length;
  return { total: validIds.size, studied: studied.length, due, strong, remaining: Math.max(0, validIds.size - studied.length) };
}

export function nextNewVocabularyIds(progress, curriculumEntryIds, limit) {
  const studied = new Set(normalizeVocabularyProgress(progress).entries.map((entry) => entry.entryId));
  const count = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 25) : 0;
  return [...new Set(Array.isArray(curriculumEntryIds) ? curriculumEntryIds.slice(0, MAX_CURRICULUM_IDS) : [])].filter((entryId) => typeof entryId === "string" && SAFE_ID.test(entryId) && !studied.has(entryId)).slice(0, count);
}
