import { isReviewGrade, nextReviewIntervalDays } from "./review-schedule.mjs";

export const DEFAULT_HIFZ_PROGRESS = Object.freeze({
  activityDates: [],
  memorized: [],
  reviews: [],
  dailyGoal: 5,
  sessionMinutes: 10,
});

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;
const SESSION_MINUTES = new Set([5, 10, 20]);
const MAX_ACTIVITY_DATES = 730;
const MAX_MEMORIZED = 10_000;
const MAX_REVIEWS = 10_000;

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

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidCalendarDateKey(value) {
  if (typeof value !== "string" || !DATE_KEY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(0);
  candidate.setHours(12, 0, 0, 0);
  candidate.setFullYear(year, month - 1, day);
  return candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day;
}

export function calendarDayDifference(fromKey, toKey) {
  if (!isValidCalendarDateKey(fromKey) || !isValidCalendarDateKey(toKey)) return Number.NaN;
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000);
}

export function addCalendarDays(dateKey, days) {
  if (!isValidCalendarDateKey(dateKey) || !Number.isInteger(days)) return dateKey;
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function calculateStreak(activityDates, todayKey = toLocalDateKey()) {
  if (!Array.isArray(activityDates) || !isValidCalendarDateKey(todayKey)) return 0;
  const dates = [...new Set(activityDates.slice(-MAX_ACTIVITY_DATES * 2).filter((date) => isValidCalendarDateKey(date) && calendarDayDifference(date, todayKey) >= 0))].sort();
  const latest = dates.at(-1);
  if (!latest) return 0;
  const latestAge = calendarDayDifference(latest, todayKey);
  if (latestAge > 1) return 0;

  let streak = 1;
  for (let index = dates.length - 2; index >= 0; index -= 1) {
    if (calendarDayDifference(dates[index], dates[index + 1]) !== 1) break;
    streak += 1;
  }
  return streak;
}

export function normalizeHifzProgress(value) {
  const source = value && typeof value === "object" ? value : {};
  const activityDates = Array.isArray(source.activityDates)
    ? [...new Set(source.activityDates.slice(-MAX_ACTIVITY_DATES * 2).filter(isValidCalendarDateKey))].sort().slice(-MAX_ACTIVITY_DATES)
    : [];
  const memorized = Array.isArray(source.memorized)
    ? takeUnique(source.memorized.slice(0, MAX_MEMORIZED * 2).filter((item) => item && typeof item === "object" && VERSE_KEY.test(item.verseKey) && Number.isInteger(item.page) && item.page >= 1 && item.page <= 604 && isValidCalendarDateKey(item.markedAt)), (item) => item.verseKey, MAX_MEMORIZED)
      .map((item) => ({ verseKey: item.verseKey, page: item.page, markedAt: item.markedAt }))
    : [];
  const memorizedKeys = new Set(memorized.map((item) => item.verseKey));
  const reviews = Array.isArray(source.reviews)
    ? takeUnique(source.reviews.slice(0, MAX_REVIEWS * 2).filter((item) => item && typeof item === "object" && memorizedKeys.has(item.verseKey) && Number.isInteger(item.page) && item.page >= 1 && item.page <= 604 && isValidCalendarDateKey(item.lastReviewed) && isValidCalendarDateKey(item.dueAt) && isReviewGrade(item.grade)), (item) => item.verseKey, MAX_REVIEWS)
      .map((item) => ({
        verseKey: item.verseKey,
        page: item.page,
        lastReviewed: item.lastReviewed,
        dueAt: item.dueAt,
        grade: item.grade,
        intervalDays: Number.isInteger(item.intervalDays) && item.intervalDays >= 1 ? Math.min(item.intervalDays, 365) : 1,
        reviewCount: Number.isInteger(item.reviewCount) && item.reviewCount >= 1 ? item.reviewCount : 1,
        lapses: Number.isInteger(item.lapses) && item.lapses >= 0 ? item.lapses : 0,
      }))
    : [];
  const dailyGoal = Number.isInteger(source.dailyGoal) && source.dailyGoal >= 1 && source.dailyGoal <= 50 ? source.dailyGoal : DEFAULT_HIFZ_PROGRESS.dailyGoal;
  const sessionMinutes = SESSION_MINUTES.has(source.sessionMinutes) ? source.sessionMinutes : DEFAULT_HIFZ_PROGRESS.sessionMinutes;
  return { activityDates, memorized, reviews, dailyGoal, sessionMinutes };
}

export function recordHifzActivity(progress, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey) || normalized.activityDates.includes(dateKey)) return normalized;
  return normalizeHifzProgress({ ...normalized, activityDates: [...normalized.activityDates, dateKey] });
}

export function toggleMemorizedVerse(progress, verse, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const existing = normalized.memorized.some((item) => item.verseKey === verse.verseKey);
  if (existing) {
    return normalizeHifzProgress({
      ...normalized,
      memorized: normalized.memorized.filter((item) => item.verseKey !== verse.verseKey),
      reviews: normalized.reviews.filter((item) => item.verseKey !== verse.verseKey),
    });
  }
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return recordHifzActivity({
    ...normalized,
    memorized: [{ verseKey: verse.verseKey, page: verse.page, markedAt: dateKey }, ...normalized.memorized],
  }, dateKey);
}

export function recordVerseReview(progress, verse, grade, date = new Date()) {
  if (!isReviewGrade(grade) || !VERSE_KEY.test(verse.verseKey) || !Number.isInteger(verse.page) || verse.page < 1 || verse.page > 604) {
    return normalizeHifzProgress(progress);
  }
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!isValidCalendarDateKey(dateKey)) return normalizeHifzProgress(progress);
  let normalized = normalizeHifzProgress(progress);
  if (!normalized.memorized.some((item) => item.verseKey === verse.verseKey)) {
    normalized = normalizeHifzProgress({
      ...normalized,
      memorized: [{ verseKey: verse.verseKey, page: verse.page, markedAt: dateKey }, ...normalized.memorized],
    });
  }
  const previous = normalized.reviews.find((item) => item.verseKey === verse.verseKey);
  const intervalDays = nextReviewIntervalDays(previous?.intervalDays, grade, Boolean(previous));
  const review = {
    verseKey: verse.verseKey,
    page: verse.page,
    lastReviewed: dateKey,
    dueAt: addCalendarDays(dateKey, intervalDays),
    grade,
    intervalDays,
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    lapses: (previous?.lapses ?? 0) + (grade === "again" ? 1 : 0),
  };
  return recordHifzActivity({
    ...normalized,
    reviews: [review, ...normalized.reviews.filter((item) => item.verseKey !== verse.verseKey)],
  }, dateKey);
}

export function todaysMemorizedCount(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return normalizeHifzProgress(progress).memorized.filter((item) => item.markedAt === dateKey).length;
}

export function dueReviewCount(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return normalizeHifzProgress(progress).reviews.filter((item) => calendarDayDifference(item.dueAt, dateKey) >= 0).length;
}

export function buildDailyPlan(progress, candidates = [], currentPage = 1, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const limit = normalized.sessionMinutes === 5 ? 3 : normalized.sessionMinutes === 20 ? 8 : 5;
  const plan = [];
  const included = new Set();
  const add = (item) => {
    if (!item || included.has(item.verseKey) || plan.length >= limit) return;
    included.add(item.verseKey);
    plan.push(item);
  };

  [...normalized.reviews]
    .filter((item) => calendarDayDifference(item.dueAt, dateKey) >= 0)
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || right.lapses - left.lapses)
    .forEach((item) => add({ verseKey: item.verseKey, page: item.page, kind: "review", reason: item.grade === "again" ? "Needs reinforcement" : "Due for review" }));

  candidates
    .filter((item) => item && VERSE_KEY.test(item.verseKey) && item.page === currentPage && !normalized.memorized.some((memorized) => memorized.verseKey === item.verseKey))
    .forEach((item) => add({ verseKey: item.verseKey, page: item.page, kind: "new", reason: `New from page ${item.page}` }));

  [...normalized.memorized]
    .filter((item) => !normalized.reviews.some((review) => review.verseKey === item.verseKey))
    .sort((left, right) => left.markedAt.localeCompare(right.markedAt))
    .forEach((item) => add({ verseKey: item.verseKey, page: item.page, kind: "review", reason: "First strength check" }));

  return plan;
}

export function buildPageMasteryMap(progress, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  const memorizedByPage = new Map();
  normalized.memorized.forEach((item) => {
    const entries = memorizedByPage.get(item.page) ?? [];
    entries.push(item);
    memorizedByPage.set(item.page, entries);
  });
  const reviewByVerse = new Map(normalized.reviews.map((item) => [item.verseKey, item]));
  return Array.from({ length: 604 }, (_, index) => {
    const page = index + 1;
    const entries = memorizedByPage.get(page) ?? [];
    if (!entries.length) return { page, status: "not-started", memorized: 0, due: 0 };
    const reviews = entries.map((item) => reviewByVerse.get(item.verseKey)).filter(Boolean);
    const due = reviews.filter((item) => calendarDayDifference(item.dueAt, dateKey) >= 0).length;
    const strong = reviews.length === entries.length && reviews.every((item) => (item.grade === "good" || item.grade === "easy") && calendarDayDifference(item.dueAt, dateKey) < 0);
    return { page, status: due ? "due" : strong ? "strong" : "learning", memorized: entries.length, due };
  });
}
