export interface MemorizedVerse {
  verseKey: string;
  page: number;
  markedAt: string;
}

export interface HifzProgress {
  activityDates: string[];
  memorized: MemorizedVerse[];
  dailyGoal: number;
}

export const DEFAULT_HIFZ_PROGRESS: Readonly<HifzProgress>;
export function toLocalDateKey(date?: Date): string;
export function calendarDayDifference(fromKey: string, toKey: string): number;
export function calculateStreak(activityDates: string[], todayKey?: string): number;
export function normalizeHifzProgress(value: unknown): HifzProgress;
export function recordHifzActivity(progress: HifzProgress, date?: Date | string): HifzProgress;
export function toggleMemorizedVerse(progress: HifzProgress, verse: Pick<MemorizedVerse, "verseKey" | "page">, date?: Date | string): HifzProgress;
export function todaysMemorizedCount(progress: HifzProgress, date?: Date | string): number;
