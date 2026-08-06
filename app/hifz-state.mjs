export const DEFAULT_HIFZ_PROGRESS = Object.freeze({
  activityDates: [],
  memorized: [],
  dailyGoal: 5,
});

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const VERSE_KEY = /^\d{1,3}:\d{1,3}$/;

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calendarDayDifference(fromKey, toKey) {
  if (!DATE_KEY.test(fromKey) || !DATE_KEY.test(toKey)) return Number.NaN;
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000);
}

export function calculateStreak(activityDates, todayKey = toLocalDateKey()) {
  const dates = [...new Set(activityDates.filter((date) => DATE_KEY.test(date) && calendarDayDifference(date, todayKey) >= 0))].sort();
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
    ? [...new Set(source.activityDates.filter((date) => typeof date === "string" && DATE_KEY.test(date)))].sort().slice(-730)
    : [];
  const memorized = Array.isArray(source.memorized)
    ? source.memorized.filter((item) => item && typeof item === "object" && VERSE_KEY.test(item.verseKey) && Number.isInteger(item.page) && item.page >= 1 && item.page <= 604 && DATE_KEY.test(item.markedAt))
      .filter((item, index, items) => items.findIndex((candidate) => candidate.verseKey === item.verseKey) === index)
      .map((item) => ({ verseKey: item.verseKey, page: item.page, markedAt: item.markedAt }))
    : [];
  const dailyGoal = Number.isInteger(source.dailyGoal) && source.dailyGoal >= 1 && source.dailyGoal <= 50 ? source.dailyGoal : DEFAULT_HIFZ_PROGRESS.dailyGoal;
  return { activityDates, memorized, dailyGoal };
}

export function recordHifzActivity(progress, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  if (!DATE_KEY.test(dateKey) || normalized.activityDates.includes(dateKey)) return normalized;
  return normalizeHifzProgress({ ...normalized, activityDates: [...normalized.activityDates, dateKey] });
}

export function toggleMemorizedVerse(progress, verse, date = new Date()) {
  const normalized = normalizeHifzProgress(progress);
  const existing = normalized.memorized.some((item) => item.verseKey === verse.verseKey);
  if (existing) return { ...normalized, memorized: normalized.memorized.filter((item) => item.verseKey !== verse.verseKey) };
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return recordHifzActivity({
    ...normalized,
    memorized: [{ verseKey: verse.verseKey, page: verse.page, markedAt: dateKey }, ...normalized.memorized],
  }, dateKey);
}

export function todaysMemorizedCount(progress, date = new Date()) {
  const dateKey = typeof date === "string" ? date : toLocalDateKey(date);
  return normalizeHifzProgress(progress).memorized.filter((item) => item.markedAt === dateKey).length;
}
