import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateStreak,
  calendarDayDifference,
  normalizeHifzProgress,
  recordHifzActivity,
  todaysMemorizedCount,
  toggleMemorizedVerse,
} from "../app/hifz-state.mjs";

test("calendar day math crosses leap days, months, and years", () => {
  assert.equal(calendarDayDifference("2024-02-28", "2024-02-29"), 1);
  assert.equal(calendarDayDifference("2024-02-29", "2024-03-01"), 1);
  assert.equal(calendarDayDifference("2025-12-31", "2026-01-01"), 1);
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
