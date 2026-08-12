import { addCalendarDays, calendarDayDifference, isValidCalendarDateKey, toLocalDateKey } from "./hifz-state.mjs";
import { isReviewGrade, nextReviewIntervalDays } from "./review-schedule.mjs";

export const EDUCATION_PROGRESS_SCHEMA_VERSION = 1;
export const MAX_EDUCATION_PROGRESS_CHARACTERS = 750_000;
export const DEFAULT_EDUCATION_PROGRESS = Object.freeze({
  schemaVersion: EDUCATION_PROGRESS_SCHEMA_VERSION,
  sourceId: null,
  sourceRevision: null,
  activeCourseId: null,
  currentLesson: null,
  lessons: [],
  knowledgeChecks: [],
  reviewHistory: [],
  activityDates: [],
});

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:._/-]{1,159}$/;
const MAX_LESSONS = 2_000;
const MAX_CHECKS = 4_000;
const MAX_HISTORY = 10_000;
const MAX_ACTIVITY_DATES = 730;

function safeId(value) { return typeof value === "string" && SAFE_ID.test(value); }
function safeRevision(value) { return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 160 && !/[\u0000-\u001f<>]/u.test(value); }

function normalizeActivityDates(value) {
  return Array.isArray(value) ? [...new Set(value.slice(-MAX_ACTIVITY_DATES * 2).filter(isValidCalendarDateKey))].sort().slice(-MAX_ACTIVITY_DATES) : [];
}

function normalizeLesson(value) {
  if (!value || typeof value !== "object" || !safeId(value.courseId) || !safeId(value.moduleId) || !safeId(value.lessonId) || !isValidCalendarDateKey(value.startedAt)) return null;
  if (value.status !== "in-progress" && value.status !== "completed") return null;
  if (value.status === "completed" && (!isValidCalendarDateKey(value.completedAt) || calendarDayDifference(value.startedAt, value.completedAt) < 0)) return null;
  return { courseId: value.courseId, moduleId: value.moduleId, lessonId: value.lessonId, status: value.status, startedAt: value.startedAt, completedAt: value.status === "completed" ? value.completedAt : null };
}

function normalizeCheck(value, lessonsById) {
  if (!value || typeof value !== "object" || !safeId(value.checkId) || !safeId(value.lessonId) || !lessonsById.has(value.lessonId) || !isValidCalendarDateKey(value.firstStudied) || !isValidCalendarDateKey(value.lastStudied) || !isValidCalendarDateKey(value.dueAt) || calendarDayDifference(value.firstStudied, value.lastStudied) < 0 || calendarDayDifference(value.lastStudied, value.dueAt) < 0 || !isReviewGrade(value.grade)) return null;
  const intervalDays = Number.isInteger(value.intervalDays) && value.intervalDays >= 1 ? Math.min(value.intervalDays, 365) : null;
  if (intervalDays === null || addCalendarDays(value.lastStudied, intervalDays) !== value.dueAt) return null;
  return {
    checkId: value.checkId,
    lessonId: value.lessonId,
    firstStudied: value.firstStudied,
    lastStudied: value.lastStudied,
    dueAt: value.dueAt,
    grade: value.grade,
    intervalDays,
    reviewCount: Number.isInteger(value.reviewCount) && value.reviewCount >= 1 ? Math.min(value.reviewCount, 100_000) : 1,
    lapses: Number.isInteger(value.lapses) && value.lapses >= 0 ? Math.min(value.lapses, 100_000) : 0,
  };
}

function serializedLength(value) {
  return JSON.stringify(value).length;
}

function boundEducationProgress(progress) {
  let bounded = progress;
  while (bounded.reviewHistory.length && serializedLength(bounded) > MAX_EDUCATION_PROGRESS_CHARACTERS) {
    const remove = Math.max(1, Math.ceil(bounded.reviewHistory.length / 8));
    bounded = { ...bounded, reviewHistory: bounded.reviewHistory.slice(remove) };
  }
  while (bounded.knowledgeChecks.length && serializedLength(bounded) > MAX_EDUCATION_PROGRESS_CHARACTERS) {
    const keep = Math.max(0, bounded.knowledgeChecks.length - Math.max(1, Math.ceil(bounded.knowledgeChecks.length / 8)));
    const knowledgeChecks = bounded.knowledgeChecks.slice(0, keep);
    const retainedChecks = new Set(knowledgeChecks.map((item) => item.checkId));
    bounded = { ...bounded, knowledgeChecks, reviewHistory: bounded.reviewHistory.filter((item) => retainedChecks.has(item.checkId)) };
  }
  while (bounded.lessons.length > 1 && serializedLength(bounded) > MAX_EDUCATION_PROGRESS_CHARACTERS) {
    const protectedLessonId = bounded.currentLesson?.lessonId ?? null;
    const removableIndex = bounded.lessons.findLastIndex((lesson) => lesson.lessonId !== protectedLessonId);
    if (removableIndex < 0) break;
    const removedLessonId = bounded.lessons[removableIndex].lessonId;
    const lessons = bounded.lessons.filter((_, index) => index !== removableIndex);
    const knowledgeChecks = bounded.knowledgeChecks.filter((item) => item.lessonId !== removedLessonId);
    const retainedChecks = new Set(knowledgeChecks.map((item) => item.checkId));
    bounded = { ...bounded, lessons, knowledgeChecks, reviewHistory: bounded.reviewHistory.filter((item) => retainedChecks.has(item.checkId)) };
  }
  while (bounded.activityDates.length && serializedLength(bounded) > MAX_EDUCATION_PROGRESS_CHARACTERS) bounded = { ...bounded, activityDates: bounded.activityDates.slice(1) };
  return bounded;
}

export function normalizeEducationProgress(value) {
  const source = value && typeof value === "object" && value.schemaVersion === EDUCATION_PROGRESS_SCHEMA_VERSION ? value : {};
  const sourceId = source.sourceId === null || safeId(source.sourceId) ? source.sourceId ?? null : null;
  const sourceRevision = source.sourceRevision === null || safeRevision(source.sourceRevision) ? source.sourceRevision ?? null : null;
  const lessons = [];
  const lessonIds = new Set();
  if (Array.isArray(source.lessons)) for (const candidate of source.lessons.slice(0, MAX_LESSONS * 2)) {
    const lesson = normalizeLesson(candidate);
    if (!lesson || lessonIds.has(lesson.lessonId)) continue;
    lessonIds.add(lesson.lessonId);
    lessons.push(lesson);
    if (lessons.length >= MAX_LESSONS) break;
  }
  const activityDates = normalizeActivityDates(source.activityDates);
  if (!sourceId || !sourceRevision) return { ...DEFAULT_EDUCATION_PROGRESS, activityDates };
  const lessonsById = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
  const checks = [];
  const checkIds = new Set();
  if (Array.isArray(source.knowledgeChecks)) for (const candidate of source.knowledgeChecks.slice(0, MAX_CHECKS * 2)) {
    const check = normalizeCheck(candidate, lessonsById);
    if (!check || checkIds.has(check.checkId)) continue;
    checkIds.add(check.checkId);
    checks.push(check);
    if (checks.length >= MAX_CHECKS) break;
  }
  const checksById = new Map(checks.map((check) => [check.checkId, check]));
  const reviewHistory = [];
  const lastHistoryDate = new Map();
  if (Array.isArray(source.reviewHistory)) for (const item of source.reviewHistory.slice(-MAX_HISTORY * 2)) {
    if (!item || typeof item !== "object" || !checkIds.has(item.checkId) || !safeId(item.lessonId) || !isReviewGrade(item.grade) || !isValidCalendarDateKey(item.reviewedAt) || !isValidCalendarDateKey(item.dueAt) || !Number.isInteger(item.intervalDays) || item.intervalDays < 1) continue;
    const check = checksById.get(item.checkId);
    const intervalDays = Math.min(item.intervalDays, 365);
    const previousDate = lastHistoryDate.get(item.checkId);
    if (!check || check.lessonId !== item.lessonId || calendarDayDifference(check.firstStudied, item.reviewedAt) < 0 || calendarDayDifference(item.reviewedAt, check.lastStudied) < 0 || addCalendarDays(item.reviewedAt, intervalDays) !== item.dueAt || (previousDate && calendarDayDifference(previousDate, item.reviewedAt) < 0)) continue;
    reviewHistory.push({ checkId: item.checkId, lessonId: item.lessonId, grade: item.grade, reviewedAt: item.reviewedAt, dueAt: item.dueAt, intervalDays });
    lastHistoryDate.set(item.checkId, item.reviewedAt);
  }
  if (reviewHistory.length > MAX_HISTORY) reviewHistory.splice(0, reviewHistory.length - MAX_HISTORY);
  const currentCandidate = source.currentLesson && typeof source.currentLesson === "object" ? source.currentLesson : null;
  const currentLesson = currentCandidate && safeId(currentCandidate.lessonId) ? lessonsById.get(currentCandidate.lessonId) : null;
  const current = currentCandidate && currentLesson && currentCandidate.courseId === currentLesson.courseId && currentCandidate.moduleId === currentLesson.moduleId && (currentCandidate.sectionId === null || safeId(currentCandidate.sectionId)) ? { courseId: currentCandidate.courseId, moduleId: currentCandidate.moduleId, lessonId: currentCandidate.lessonId, sectionId: currentCandidate.sectionId ?? null } : null;
  const activeCourseId = safeId(source.activeCourseId) && lessons.some((lesson) => lesson.courseId === source.activeCourseId) ? source.activeCourseId : current?.courseId ?? null;
  return boundEducationProgress({ schemaVersion: EDUCATION_PROGRESS_SCHEMA_VERSION, sourceId, sourceRevision, activeCourseId, currentLesson: current, lessons, knowledgeChecks: checks, reviewHistory, activityDates });
}

export function educationSourceMatches(progress, identity) {
  const normalized = normalizeEducationProgress(progress);
  if (!identity || !safeId(identity.sourceId) || !safeRevision(identity.sourceRevision)) return false;
  return !normalized.sourceId || (normalized.sourceId === identity.sourceId && normalized.sourceRevision === identity.sourceRevision);
}

function requireIdentity(progress, identity) {
  const normalized = normalizeEducationProgress(progress);
  if (!educationSourceMatches(normalized, identity)) return null;
  return { normalized, sourceId: identity.sourceId, sourceRevision: identity.sourceRevision };
}

function activity(progress, dateKey) {
  return progress.activityDates.includes(dateKey) ? progress.activityDates : [...progress.activityDates, dateKey];
}

export function startEducationLesson(progress, identity, target, date = new Date()) {
  const pinned = requireIdentity(progress, identity);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!pinned || !isValidCalendarDateKey(dateKey) || !target || !safeId(target.courseId) || !safeId(target.moduleId) || !safeId(target.lessonId) || (target.sectionId !== undefined && target.sectionId !== null && !safeId(target.sectionId))) return normalizeEducationProgress(progress);
  const existing = pinned.normalized.lessons.find((item) => item.lessonId === target.lessonId);
  if (existing && (existing.courseId !== target.courseId || existing.moduleId !== target.moduleId)) return pinned.normalized;
  if (existing && calendarDayDifference(existing.startedAt, dateKey) < 0) return pinned.normalized;
  const lesson = existing ?? { courseId: target.courseId, moduleId: target.moduleId, lessonId: target.lessonId, status: "in-progress", startedAt: dateKey, completedAt: null };
  return normalizeEducationProgress({ ...pinned.normalized, sourceId: pinned.sourceId, sourceRevision: pinned.sourceRevision, activeCourseId: target.courseId, currentLesson: { courseId: target.courseId, moduleId: target.moduleId, lessonId: target.lessonId, sectionId: target.sectionId ?? null }, lessons: [lesson, ...pinned.normalized.lessons.filter((item) => item.lessonId !== target.lessonId)], activityDates: activity(pinned.normalized, dateKey) });
}

export function completeEducationLesson(progress, identity, target, date = new Date()) {
  const started = startEducationLesson(progress, identity, target, date);
  if (!educationSourceMatches(started, identity)) return normalizeEducationProgress(progress);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const existing = started.lessons.find((item) => item.lessonId === target?.lessonId);
  if (!existing || existing.courseId !== target?.courseId || existing.moduleId !== target?.moduleId || !isValidCalendarDateKey(dateKey) || calendarDayDifference(existing.startedAt, dateKey) < 0) return started;
  return normalizeEducationProgress({ ...started, lessons: [{ ...existing, status: "completed", completedAt: dateKey }, ...started.lessons.filter((item) => item.lessonId !== existing.lessonId)], currentLesson: started.currentLesson?.lessonId === existing.lessonId ? null : started.currentLesson, activityDates: activity(started, dateKey) });
}

export function recordEducationKnowledgeReview(progress, identity, target, grade, date = new Date()) {
  const pinned = requireIdentity(progress, identity);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!pinned || !isValidCalendarDateKey(dateKey) || !target || !safeId(target.courseId) || !safeId(target.moduleId) || !safeId(target.lessonId) || !safeId(target.checkId) || !isReviewGrade(grade)) return normalizeEducationProgress(progress);
  const existingLesson = pinned.normalized.lessons.find((item) => item.lessonId === target.lessonId);
  const previous = pinned.normalized.knowledgeChecks.find((item) => item.checkId === target.checkId);
  if ((existingLesson && calendarDayDifference(existingLesson.startedAt, dateKey) < 0) || (previous && calendarDayDifference(previous.lastStudied, dateKey) < 0)) return pinned.normalized;
  let normalized = startEducationLesson(pinned.normalized, identity, target, dateKey);
  if (previous && previous.lessonId !== target.lessonId) return pinned.normalized;
  const intervalDays = nextReviewIntervalDays(previous?.intervalDays, grade, Boolean(previous));
  const check = { checkId: target.checkId, lessonId: target.lessonId, firstStudied: previous?.firstStudied ?? dateKey, lastStudied: dateKey, dueAt: addCalendarDays(dateKey, intervalDays), grade, intervalDays, reviewCount: (previous?.reviewCount ?? 0) + 1, lapses: (previous?.lapses ?? 0) + (grade === "again" ? 1 : 0) };
  normalized = normalizeEducationProgress({ ...normalized, knowledgeChecks: [check, ...normalized.knowledgeChecks.filter((item) => item.checkId !== target.checkId)], reviewHistory: [...normalized.reviewHistory, { checkId: target.checkId, lessonId: target.lessonId, grade, reviewedAt: dateKey, dueAt: check.dueAt, intervalDays }], activityDates: activity(normalized, dateKey) });
  return normalized;
}

export function dueEducationReviews(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey)) return [];
  return normalizeEducationProgress(progress).knowledgeChecks.filter((item) => calendarDayDifference(item.dueAt, dateKey) >= 0).sort((left, right) => left.dueAt.localeCompare(right.dueAt) || right.lapses - left.lapses || left.checkId.localeCompare(right.checkId));
}

export function nextEducationLesson(progress, catalog) {
  const normalized = normalizeEducationProgress(progress);
  if (!catalog || (normalized.sourceId !== null && catalog.sourceId !== normalized.sourceId) || (normalized.sourceRevision !== null && catalog.sourceRevision !== normalized.sourceRevision) || !Array.isArray(catalog.courses) || !Array.isArray(catalog.modules) || !Array.isArray(catalog.lessons)) return null;
  const completed = new Set(normalized.lessons.filter((item) => item.status === "completed").map((item) => item.lessonId));
  const courses = normalized.activeCourseId ? [...catalog.courses.filter((item) => item.id === normalized.activeCourseId), ...catalog.courses.filter((item) => item.id !== normalized.activeCourseId)] : catalog.courses;
  for (const course of courses) for (const moduleId of course.moduleIds) {
    const curriculumModule = catalog.modules.find((item) => item.id === moduleId && item.courseId === course.id);
    if (!curriculumModule) continue;
    for (const lessonId of curriculumModule.lessonIds) {
      if (completed.has(lessonId)) continue;
      const lesson = catalog.lessons.find((item) => item.id === lessonId && item.moduleId === curriculumModule.id && item.courseId === course.id);
      if (lesson) return { courseId: course.id, moduleId: curriculumModule.id, lessonId: lesson.id, title: lesson.title, estimatedMinutes: lesson.estimatedMinutes };
    }
  }
  return null;
}

export function educationProgressSummary(progress, catalog, date = new Date()) {
  const normalized = normalizeEducationProgress(progress);
  const totalLessons = Array.isArray(catalog?.lessons) ? catalog.lessons.length : 0;
  const sourceCurrent = !normalized.sourceId || Boolean(catalog && catalog.sourceId === normalized.sourceId && catalog.sourceRevision === normalized.sourceRevision);
  const completedLessons = sourceCurrent ? normalized.lessons.filter((item) => item.status === "completed").length : 0;
  return { totalLessons, completedLessons, inProgressLessons: sourceCurrent ? normalized.lessons.filter((item) => item.status === "in-progress").length : 0, dueReviews: sourceCurrent ? dueEducationReviews(normalized, date).length : 0, percent: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0, sourceCurrent };
}
