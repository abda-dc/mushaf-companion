export type ReviewGrade = "again" | "hard" | "good" | "easy";
export type MasteryStatus = "not-started" | "learning" | "due" | "strong";

export interface MemorizedVerse {
  verseKey: string;
  page: number;
  markedAt: string;
}

export interface VerseReview {
  verseKey: string;
  page: number;
  lastReviewed: string;
  dueAt: string;
  grade: ReviewGrade;
  intervalDays: number;
  reviewCount: number;
  lapses: number;
}

export interface HifzProgress {
  activityDates: string[];
  memorized: MemorizedVerse[];
  reviews: VerseReview[];
  dailyGoal: number;
  sessionMinutes: 5 | 10 | 20;
}

export interface DailyPlanItem {
  verseKey: string;
  page: number;
  kind: "new" | "review";
  reason: string;
}

export interface PageMastery {
  page: number;
  status: MasteryStatus;
  memorized: number;
  due: number;
}

export const DEFAULT_HIFZ_PROGRESS: Readonly<HifzProgress>;
export function toLocalDateKey(date?: Date): string;
export function calendarDayDifference(fromKey: string, toKey: string): number;
export function addCalendarDays(dateKey: string, days: number): string;
export function calculateStreak(activityDates: string[], todayKey?: string): number;
export function normalizeHifzProgress(value: unknown): HifzProgress;
export function recordHifzActivity(progress: HifzProgress, date?: Date | string): HifzProgress;
export function toggleMemorizedVerse(progress: HifzProgress, verse: Pick<MemorizedVerse, "verseKey" | "page">, date?: Date | string): HifzProgress;
export function recordVerseReview(progress: HifzProgress, verse: Pick<MemorizedVerse, "verseKey" | "page">, grade: ReviewGrade, date?: Date | string): HifzProgress;
export function todaysMemorizedCount(progress: HifzProgress, date?: Date | string): number;
export function dueReviewCount(progress: HifzProgress, date?: Date | string): number;
export function buildDailyPlan(progress: HifzProgress, candidates?: Array<Pick<MemorizedVerse, "verseKey" | "page">>, currentPage?: number, date?: Date | string): DailyPlanItem[];
export function buildPageMasteryMap(progress: HifzProgress, date?: Date | string): PageMastery[];
