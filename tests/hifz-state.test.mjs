import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarDays,
  buildDailyPlan,
  buildPageMasteryMap,
  calculateStreak,
  calendarDayDifference,
  dueReviewCount,
  isValidCalendarDateKey,
  normalizeHifzProgress,
  recordHifzActivity,
  recordVerseReview,
  todaysMemorizedCount,
  toggleMemorizedVerse,
} from "../app/hifz-state.mjs";

test("calendar day math crosses leap days, months, and years", () => {
  assert.equal(calendarDayDifference("2024-02-28", "2024-02-29"), 1);
  assert.equal(calendarDayDifference("2024-02-29", "2024-03-01"), 1);
  assert.equal(calendarDayDifference("2025-12-31", "2026-01-01"), 1);
  assert.equal(addCalendarDays("2024-02-28", 2), "2024-03-01");
});

test("strict local calendar validation rejects impossible dates and accepts real leap days", () => {
  assert.equal(isValidCalendarDateKey("2026-02-31"), false);
  assert.equal(isValidCalendarDateKey("2026-04-31"), false);
  assert.equal(isValidCalendarDateKey("2026-00-10"), false);
  assert.equal(isValidCalendarDateKey("2026-01-00"), false);
  assert.equal(isValidCalendarDateKey("2024-02-29"), true);
  assert.equal(isValidCalendarDateKey("2023-02-29"), false);
  assert.equal(Number.isNaN(calendarDayDifference("2026-02-31", "2026-03-01")), true);
});

test("streak continues through today and resets only after a missed day", () => {
  const dates = ["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"];
  assert.equal(calculateStreak(dates, "2026-08-06"), 4);
  assert.equal(calculateStreak(dates.slice(0, -1), "2026-08-06"), 3, "yesterday remains an active streak");
  assert.equal(calculateStreak(dates.slice(0, -1), "2026-08-07"), 0, "one full missed day resets it");
});

test("streak uses only the latest uninterrupted run", () => {
  assert.equal(calculateStreak(["2026-07-29", "2026-08-02", "2026-08-04", "2026-08-05", "2026-08-06"], "2026-08-06"), 3);
  assert.equal(calculateStreak(["2024-02-28", "2024-02-29", "2024-03-01"], "2024-03-01"), 3);
});

test("activity is recorded once per local calendar date", () => {
  const first = recordHifzActivity(normalizeHifzProgress(null), "2026-08-06");
  const duplicate = recordHifzActivity(first, "2026-08-06");
  assert.deepEqual(duplicate.activityDates, ["2026-08-06"]);
});

test("memorized tracking is reversible and feeds today's goal", () => {
  const empty = normalizeHifzProgress(null);
  const marked = toggleMemorizedVerse(empty, { verseKey: "2:255", page: 42 }, "2026-08-06");
  assert.equal(marked.memorized.length, 1);
  assert.equal(todaysMemorizedCount(marked, "2026-08-06"), 1);
  assert.equal(calculateStreak(marked.activityDates, "2026-08-06"), 1);
  const unmarked = toggleMemorizedVerse(marked, { verseKey: "2:255", page: 42 }, "2026-08-06");
  assert.equal(unmarked.memorized.length, 0);
  assert.equal(todaysMemorizedCount(unmarked, "2026-08-06"), 0);
  assert.deepEqual(unmarked.activityDates, ["2026-08-06"], "the day's Hifz activity remains recorded");
});

test("review ratings schedule the next retrieval and record lapses", () => {
  const first = recordVerseReview(normalizeHifzProgress(null), { verseKey: "2:255", page: 42 }, "good", "2026-08-06");
  assert.equal(first.memorized.length, 1, "a completed retrieval joins the mastery map");
  assert.equal(first.reviews[0].dueAt, "2026-08-09");
  assert.equal(dueReviewCount(first, "2026-08-08"), 0);
  assert.equal(dueReviewCount(first, "2026-08-09"), 1);
  const lapse = recordVerseReview(first, { verseKey: "2:255", page: 42 }, "again", "2026-08-09");
  assert.equal(lapse.reviews[0].dueAt, "2026-08-10");
  assert.equal(lapse.reviews[0].lapses, 1);
});

test("daily plans prioritize due review before new ayat", () => {
  let progress = recordVerseReview(normalizeHifzProgress(null), { verseKey: "1:1", page: 1 }, "good", "2026-08-01");
  progress = { ...progress, sessionMinutes: 5 };
  const plan = buildDailyPlan(progress, [{ verseKey: "2:1", page: 2 }, { verseKey: "2:2", page: 2 }], 2, "2026-08-06");
  assert.equal(plan.length, 3);
  assert.deepEqual(plan.map((item) => item.verseKey), ["1:1", "2:1", "2:2"]);
  assert.equal(plan[0].kind, "review");
});

test("604-page mastery map distinguishes due, learning, and strong pages", () => {
  let progress = toggleMemorizedVerse(normalizeHifzProgress(null), { verseKey: "1:1", page: 1 }, "2026-08-01");
  progress = recordVerseReview(progress, { verseKey: "2:255", page: 42 }, "easy", "2026-08-01");
  const map = buildPageMasteryMap(progress, "2026-08-06");
  assert.equal(map.length, 604);
  assert.equal(map[0].status, "learning");
  assert.equal(map[41].status, "strong");
  assert.equal(map[603].status, "not-started");
  const dueMap = buildPageMasteryMap(progress, "2026-08-08");
  assert.equal(dueMap[41].status, "due");
});
